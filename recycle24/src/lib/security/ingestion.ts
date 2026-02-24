import { db } from '@/lib/db';
import { processSecurityEvent } from './orchestrator';
import { SecurityEvent } from './types';

interface IngestionResult {
    id: string;
    created_at: Date;
}

export async function ingestSecurityEvent(event: SecurityEvent) {
  try {
    const riskScore = calculateInitialRiskScore(event);
    const eventWithRisk = { ...event, risk_score: riskScore };

    const result = await db.$queryRaw<IngestionResult[]>`
       INSERT INTO public.gsocc_security_events 
       (event_type, severity, source_ip, user_id, session_id, endpoint, payload, risk_score)
       VALUES (
           ${eventWithRisk.event_type}, 
           ${eventWithRisk.severity}, 
           ${eventWithRisk.source_ip}, 
           ${eventWithRisk.user_id}, 
           ${eventWithRisk.session_id}, 
           ${eventWithRisk.endpoint}, 
           ${eventWithRisk.payload ? JSON.stringify(eventWithRisk.payload) : null}::jsonb, 
           ${eventWithRisk.risk_score}
       )
       RETURNING id, created_at
    `;

    const persistedEvent = {
        ...eventWithRisk,
        id: result[0]?.id,
        created_at: result[0]?.created_at
    };

    setImmediate(() => {
        processSecurityEvent(persistedEvent).catch((err: Error) => {
            console.error('Failed to process security event in orchestrator', err.message);
        });
    });

    return persistedEvent;
  } catch (error) {
    console.error('CRITICAL: Failed to ingest security event', error);
    return null;
  }
}

function calculateInitialRiskScore(event: SecurityEvent): number {
    let score = 0;
    
    switch(event.severity) {
        case 'LOW': score += 10; break;
        case 'MEDIUM': score += 40; break;
        case 'HIGH': score += 75; break;
        case 'CRITICAL': score += 100; break;
    }

    if (event.event_type === 'SQL_INJECTION_ATTEMPT') score += 50;
    if (event.event_type === 'LOGIN_FAILED') score += 10;
    if (event.event_type === 'ANOMALOUS_BEHAVIOR') score += 20;

    return Math.min(score, 100);
}
