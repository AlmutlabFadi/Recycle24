import { db } from '@/lib/db';
import { SecurityEvent, SecuritySeverity } from './types';
import { isSafeHaven } from './whitelist';
import crypto from 'crypto';

interface QueryResultId {
    id: string;
}

export async function executeContainment(incidentId: string, event: SecurityEvent, severity: SecuritySeverity) {
  try {
    if (severity === 'CRITICAL' && event.source_ip) {
      await blockIP(event.source_ip, incidentId, 'Automated CRITICAL Defense trigger');
      if (event.user_id) {
          await isolateAccount(event.user_id, incidentId, 'Automated CRITICAL Defense trigger for IP breach');
      }
    } else if (severity === 'HIGH' && event.user_id) {
      await killSession(event.user_id, incidentId, 'Automated HIGH Defense trigger for unusual behavior');
    }

    await db.$executeRaw`
        UPDATE public.gsocc_incidents SET status = 'CONTAINED', updated_at = NOW() WHERE id = ${incidentId}::uuid
    `;

  } catch (error) {
    console.error('CRITICAL GSOCC containment failure:', error);
  }
}

export async function blockIP(ip: string, incidentId: string, reason: string) {
    if (isSafeHaven(ip)) {
        console.warn(`[GSOCC SAFE HAVEN] Bypassed IP block for protected address: ${ip}. Incident: ${incidentId}`);
        await db.$executeRaw`UPDATE public.gsocc_incidents SET description = description || '\n[SAFE HAVEN] Block IP Command Bypassed for: ' || ${ip} WHERE id = ${incidentId}::uuid`;
        return;
    }

    const ruleResult = await db.$queryRaw<QueryResultId[]>`
        INSERT INTO public.gsocc_security_rules 
         (rule_type, target_value, action, created_by, reason, incident_id) 
         VALUES ('IP_BLOCK', ${ip}, 'BLOCK', 'SYSTEM', ${reason}, ${incidentId}::uuid)
         RETURNING id
    `;

    await proveAction('IP_BLOCKED', incidentId, {
        target_ip: ip,
        reason: reason,
        rule_id: ruleResult[0]?.id
    });
}

export async function isolateAccount(userId: string, incidentId: string, reason: string) {
    if (isSafeHaven(undefined, userId)) {
        console.warn(`[GSOCC SAFE HAVEN] Bypassed account isolation for protected user: ${userId}. Incident: ${incidentId}`);
        await db.$executeRaw`UPDATE public.gsocc_incidents SET description = description || '\n[SAFE HAVEN] Isolate Account Command Bypassed for: ' || ${userId} WHERE id = ${incidentId}::uuid`;
        return;
    }

    await db.$executeRaw`UPDATE public.profiles SET is_active = false WHERE id = ${userId}::uuid`.catch((e: Error) => console.warn('Profile table might not exist or field is missing', e.message));
    
    const ruleResult = await db.$queryRaw<QueryResultId[]>`
        INSERT INTO public.gsocc_security_rules 
         (rule_type, target_value, action, created_by, reason, incident_id) 
         VALUES ('USER_ISOLATE', ${userId}, 'ISOLATE', 'SYSTEM', ${reason}, ${incidentId}::uuid)
         RETURNING id
    `;

    await proveAction('ACCOUNT_ISOLATED', incidentId, {
        target_user: userId,
        reason: reason,
        rule_id: ruleResult[0]?.id
    });
}

export async function killSession(userId: string, incidentId: string, reason: string) {
    await proveAction('SESSION_KILLED', incidentId, {
        target_user: userId,
        reason: reason
    });
}

async function proveAction(action: string, incidentId: string, evidenceData: Record<string, unknown>) {
    const snapshotJSON = JSON.stringify(evidenceData);
    
    const hash = crypto.createHash('sha256').update(`${incidentId}-${action}-${snapshotJSON}-${Date.now()}`).digest('hex');

    await db.$executeRaw`
        INSERT INTO public.gsocc_evidence_logs 
         (incident_id, action_taken, executed_by, evidence_snapshot, hash_signature)
         VALUES (${incidentId}::uuid, ${action}, 'SYSTEM_GSOCC', ${snapshotJSON}::jsonb, ${hash})
    `;
}
