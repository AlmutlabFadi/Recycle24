import { NextResponse } from 'next/server';
import { generatePredictiveInsights } from '@/lib/security/predictive';

export async function GET() {
    try {
        const data = await generatePredictiveInsights();
        return NextResponse.json(data);
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'Failed to generate predictive insights';
        console.error('[GSOCC PREDICT API ERROR]', errorMessage);
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
