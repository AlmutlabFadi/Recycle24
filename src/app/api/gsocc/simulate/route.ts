import { NextResponse } from 'next/server';
import { ingestSecurityEvent } from '@/lib/security/ingestion';
import { SecuritySeverity } from '@/lib/security/types';

type SimulationType = 'bruteforce' | 'sqli' | 'anomaly';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const simType: SimulationType = body.type || 'bruteforce';
        const testIP = `192.168.1.${Math.floor(Math.random() * 255)}`;
        
        console.log(`[GSOCC SIMULATION] Starting ${simType} scenario from IP ${testIP}`);

        if (simType === 'bruteforce') {
            for (let i = 0; i < 12; i++) {
                await ingestSecurityEvent({
                    event_type: 'LOGIN_FAILED',
                    severity: 'MEDIUM' as SecuritySeverity,
                    source_ip: testIP,
                    endpoint: '/api/auth/login',
                    payload: { username: `admin${i}@test.com` }
                });
                await new Promise(r => setTimeout(r, 50)); 
            }
            return NextResponse.json({ 
                status: 'success', 
                message: 'Simulated 12 rapid login failures.', 
                expected: 'Orchestrator should create HIGH severity Incident and trigger Containment (IP Block).' 
            });

        } else if (simType === 'sqli') {
            await ingestSecurityEvent({
                event_type: 'SQL_INJECTION_ATTEMPT',
                severity: 'CRITICAL' as SecuritySeverity,
                source_ip: testIP,
                endpoint: '/api/users/search',
                payload: { query: "1' OR '1'='1" },
                risk_score: 95
            });
            return NextResponse.json({ 
                status: 'success', 
                message: 'Simulated CRITICAL SQLi vector.', 
                expected: 'Instant Playbook 3 execution (IP Block) and Evidence Generation (Playbook 4).' 
            });

        } else {
            await ingestSecurityEvent({
                event_type: 'ANOMALOUS_BEHAVIOR',
                severity: 'LOW' as SecuritySeverity,
                source_ip: testIP,
                endpoint: '/api/public/data'
            });
            return NextResponse.json({ 
                status: 'success', 
                message: 'Simulated LOW severity anomaly.', 
                expected: 'Event logged in Real-Time Core (Playbook 1), no immediate incident.' 
            });
        }

    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'Unknown error';
        return NextResponse.json({ status: 'error', error: errorMessage }, { status: 500 });
    }
}
