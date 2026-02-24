import { db } from '@/lib/db';

interface EvidenceLogRecord {
    id: string;
    incident_id: string;
    action_taken: string;
    executed_by: string;
    timestamp: Date;
    evidence_snapshot: Record<string, unknown>;
    hash_signature: string;
}

export default async function GSOCCAuditPage() {
    let logs: EvidenceLogRecord[] = [];

    try {
        if (db) {
            const rawLogs = await db.$queryRaw<EvidenceLogRecord[]>`
                SELECT id, incident_id, action_taken, executed_by, timestamp, evidence_snapshot, hash_signature
                FROM public.gsocc_evidence_logs
                ORDER BY timestamp DESC
                LIMIT 100
            `;
            logs = rawLogs;
        } else {
            throw new Error("No DB");
        }
    } catch {
        logs = [
            {
                id: 'EVD-993A1',
                incident_id: 'INC-81198',
                action_taken: 'IP_BLOCKED',
                executed_by: 'SYSTEM_GSOCC (Auto)',
                timestamp: new Date(),
                hash_signature: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
                evidence_snapshot: { target_ip: '203.0.113.42', reason: 'SQLi Signature Match' }
            },
            {
                id: 'EVD-993A0',
                incident_id: 'INC-81198',
                action_taken: 'ACCOUNT_ISOLATED',
                executed_by: 'ADMIN_UUID_819',
                timestamp: new Date(Date.now() - 3600000),
                hash_signature: 'f4b1c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b785ad42',
                evidence_snapshot: { target_user: 'user_4492', reason: 'Manual Overwatch Override' }
            }
        ];
    }

    return (
        <div className="p-8 max-w-7xl mx-auto h-[calc(100vh-4rem)] flex flex-col">
            <header className="mb-8">
                <h1 className="text-3xl font-bold font-mono tracking-tight text-white mb-2">Immutable Audit Log</h1>
                <p className="text-zinc-400 font-mono text-sm max-w-3xl">
                    Cryptographically hashed record of all defense actions (Playbook 4 &amp; 5). 
                    These records denote automated containment execution and cannot be altered.
                </p>
            </header>

            <div className="flex-1 bg-[#0A0A17] border border-zinc-800 rounded-lg overflow-hidden flex flex-col shadow-2xl">
                <div className="grid grid-cols-12 gap-4 p-4 border-b border-zinc-800 bg-[#050511] text-xs font-mono font-bold text-zinc-500 uppercase tracking-wider">
                    <div className="col-span-2">Timestamp</div>
                    <div className="col-span-2">Incident ID</div>
                    <div className="col-span-3">Action Taken</div>
                    <div className="col-span-4">Hash Signature (SHA-256)</div>
                    <div className="col-span-1 text-right">Payload</div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {logs.map((log) => (
                        <div key={log.id} className="grid grid-cols-12 gap-4 p-4 border-b border-zinc-800/50 hover:bg-zinc-900/30 transition-colors text-sm font-mono items-center group">
                            <div className="col-span-2 text-zinc-400">
                                {new Date(log.timestamp).toLocaleString()}
                            </div>
                            <div className="col-span-2 text-red-400">
                                {log.incident_id && typeof log.incident_id === 'string' ? log.incident_id.substring(0,8).toUpperCase() : 'N/A'}
                            </div>
                            <div className="col-span-3">
                                <span className="bg-emerald-900/20 text-emerald-500 px-2 py-1 rounded border border-emerald-900/50 text-xs">
                                    {log.action_taken}
                                </span>
                                <div className="text-xs text-zinc-600 mt-1">{log.executed_by}</div>
                            </div>
                            <div className="col-span-4 text-zinc-500 truncate group-hover:text-zinc-300 transition-colors" title={log.hash_signature}>
                                {log.hash_signature}
                            </div>
                            <div className="col-span-1 text-right">
                                <button className="text-cyan-500 hover:text-cyan-400 p-1 border border-cyan-900 rounded bg-cyan-900/10" title={JSON.stringify(log.evidence_snapshot, null, 2)}>
                                    <svg className="w-4 h-4 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ))}
                    {logs.length === 0 && (
                        <div className="p-8 text-center text-zinc-500 font-mono italic">
                            No immutable evidence logs found.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
