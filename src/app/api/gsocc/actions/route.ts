import { NextResponse } from 'next/server';
import { blockIP, isolateAccount } from '@/lib/security/actions';
import { db } from '@/lib/db';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { action, targetId, incidentId, reason } = body;

        if (!action || !targetId) {
            return NextResponse.json({ error: 'Action and Target ID are required.' }, { status: 400 });
        }

        const safeIncidentId = incidentId || 'MANUAL_OVERRIDE';
        const safeReason = reason || 'Manual command execution by GSOCC Administrator';

        if (safeIncidentId === 'MANUAL_OVERRIDE') {
            const existingManual = await db.gsocc_incidents.findFirst({
                where: {
                    title: 'Manual Administrative Override'
                },
                select: { id: true }
            });
            let realIncidentId: string;
            if (!existingManual) {
                const newIncident = await db.gsocc_incidents.create({
                    data: {
                        title: 'Manual Administrative Override',
                        severity: 'MEDIUM',
                        description: 'Placeholder incident for manual terminal commands.'
                    },
                    select: { id: true }
                });
                realIncidentId = newIncident.id;
            } else {
                realIncidentId = existingManual.id;
            }
            if (action === 'BLOCK_IP') {
                await blockIP(targetId, realIncidentId, safeReason);
                return NextResponse.json({
                    status: 'success',
                    message: `IP ${targetId} blocked successfully.`
                });
            }
            if (action === 'ISOLATE_USER') {
                await isolateAccount(targetId, realIncidentId, safeReason);
                return NextResponse.json({
                    status: 'success',
                    message: `User ${targetId} isolated effectively.`
                });
            }
        } else {
            if (action === 'BLOCK_IP') {
                await blockIP(targetId, safeIncidentId, safeReason);
                return NextResponse.json({ status: 'success', message: `IP ${targetId} blocked under incident ${safeIncidentId}.` });
            } else if (action === 'ISOLATE_USER') {
                await isolateAccount(targetId, safeIncidentId, safeReason);
                return NextResponse.json({ status: 'success', message: `User ${targetId} isolated under incident ${safeIncidentId}.` });
            }
        }

        return NextResponse.json({ error: 'Invalid action specified.' }, { status: 400 });
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'Internal Server Error';
        console.error('[GSOCC ACTIONS API ERROR]', errorMessage);
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
