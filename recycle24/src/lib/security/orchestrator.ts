import { db } from '@/lib/db';
import { SecurityEvent, SecuritySeverity } from './types';
import { executeContainment } from './actions';

interface VelocityResult {
    count: bigint;
}

interface IncidentResult {
    id: string;
    status: string;
}

export async function processSecurityEvent(event: SecurityEvent) {
  try {
    let shouldEscalate = false;
    let incidentReason = '';
    let escalateSeverity: SecuritySeverity = event.severity;

    if ((event.risk_score || 0) >= 70) {
      shouldEscalate = true;
      incidentReason = 'High risk event detected directly from ingestion.';
      escalateSeverity = 'CRITICAL';
    } else if (event.source_ip) {
      const velocityResult = await db.$queryRaw<VelocityResult[]>`
         SELECT COUNT(*) as count 
         FROM public.gsocc_security_events 
         WHERE source_ip = ${event.source_ip} AND created_at > NOW() - INTERVAL '1 minute'
      `;
      
      const count = Number(velocityResult[0]?.count || 0);
      if (count >= 10) {
        shouldEscalate = true;
        incidentReason = `Velocity Anomaly: ${count} events from IP ${event.source_ip} within 60 seconds.`;
        escalateSeverity = 'HIGH';
      }
    }

    if (shouldEscalate) {
      await correlateAndRaiseIncident(event, escalateSeverity, incidentReason);
    }
  } catch (error) {
    console.error('GSOCC Orchestrator Error during processing event:', error);
  }
}

async function correlateAndRaiseIncident(event: SecurityEvent, severity: SecuritySeverity, reason: string) {
  let incidentId: string | null = null;
  
  if (event.source_ip) {
      const activeIncidents = await db.$queryRaw<IncidentResult[]>`
           SELECT id, status FROM public.gsocc_incidents 
           WHERE status IN ('OPEN', 'INVESTIGATING') 
           AND description LIKE ${`%${event.source_ip}%`}
           LIMIT 1
      `;
      if (activeIncidents.length > 0) {
          incidentId = activeIncidents[0].id;
      }
  }

  if (!incidentId) {
      const title = `Security Threat: ${event.event_type} from ${event.source_ip || 'Unknown'}`;
      const description = `Incident created automatically via GSOCC Orchestrator.\nReason: ${reason}\nTarget IP: ${event.source_ip}\nTarget User: ${event.user_id || 'N/A'}`;
      
      const newIncident = await db.$queryRaw<IncidentResult[]>`
           INSERT INTO public.gsocc_incidents (title, status, severity, description, root_cause)
           VALUES (${title}, 'OPEN', ${severity}, ${description}, 'Awaiting deep automated analysis')
           RETURNING id
      `;
      incidentId = newIncident[0]?.id;
  }

  if (event.id && incidentId) {
      await db.$executeRaw`
           INSERT INTO public.gsocc_incident_events (incident_id, event_id)
           VALUES (${incidentId}::uuid, ${event.id}::uuid) ON CONFLICT DO NOTHING
      `;
  }

  if ((severity === 'CRITICAL' || severity === 'HIGH') && incidentId && typeof incidentId === 'string') {
      await executeContainment(incidentId, event, severity);
  }
}
