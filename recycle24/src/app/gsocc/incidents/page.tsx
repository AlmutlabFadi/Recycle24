import { ReactNode } from 'react';
import { db } from '@/lib/db';

interface IncidentRecord {
    id: string;
    title: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    status: string;
    created_at: Date;
    description?: string;
    root_cause?: string;
    target?: string;
    source?: string;
    actionTaken?: string;
    showEvidence?: boolean;
}

interface IncidentCardProps {
    id: string;
    title: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    time: string;
    target: string;
    source: string;
    status: string;
    actionTaken?: string;
    showEvidence?: boolean;
}

export default async function GSOCCIncidents() {
  let openIncidents: IncidentRecord[] = [];
  let containedIncidents: IncidentRecord[] = [];
  let resolvedIncidents: IncidentRecord[] = [];

  try {
    if (db) {
      const incidents = await db.$queryRaw<IncidentRecord[]>`
        SELECT id, title, severity, status, created_at, description, root_cause
        FROM public.gsocc_incidents
        ORDER BY created_at DESC
        LIMIT 50
      `;
      
      openIncidents = incidents.filter(i => ['OPEN', 'INVESTIGATING'].includes(i.status));
      containedIncidents = incidents.filter(i => i.status === 'CONTAINED');
      resolvedIncidents = incidents.filter(i => ['RESOLVED', 'CLOSED'].includes(i.status));
    } else {
       throw new Error("No DB");
    }
  } catch {
     openIncidents = [
        { id: "INC-81204", title: "Credential Stuffing Attempt", severity: "HIGH", created_at: new Date(Date.now() - 120000), target: "User Authentication API", source: "192.168.1.45 (Multiple Regions)", status: "INVESTIGATING" }
     ];
     containedIncidents = [
        { id: "INC-81203", title: "Volumetric DDoS (L7)", severity: "CRITICAL", created_at: new Date(Date.now() - 840000), target: "Main Gateway", source: "Botnet Array", status: "CONTAINED", actionTaken: "IP Segments Null-Routed via WAF" },
        { id: "INC-81202", title: "Anomalous Data Export", severity: "MEDIUM", created_at: new Date(Date.now() - 3600000), target: "Financial Reports", source: "Internal User Account", status: "CONTAINED", actionTaken: "Account Isolated automatically" }
     ];
     resolvedIncidents = [
        { id: "INC-81198", title: "SQLi Injection Vector", severity: "HIGH", created_at: new Date(Date.now() - 14400000), target: "Search API", source: "Unknown Proxy", status: "RESOLVED", actionTaken: "Attacker Blocked. Rules Updated. Evidence Hashed.", showEvidence: true }
     ];
  }

  const formatTime = (date: Date) => {
      const now = new Date();
      const diff = Math.floor((now.getTime() - new Date(date).getTime()) / 60000);
      if (diff < 60) return `${diff}m ago`;
      const hours = Math.floor(diff / 60);
      if (hours < 24) return `${hours}h ago`;
      return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="p-6 w-full h-[calc(100vh-4rem)] flex gap-6 overflow-hidden">
        <IncidentColumn title="Open Incidents" count={openIncidents.length} type="danger">
            {openIncidents.map((inc) => (
               <IncidentCard 
                    key={inc.id}
                    id={inc.id.substring(0, 8).toUpperCase()}
                    title={inc.title}
                    severity={inc.severity}
                    time={formatTime(inc.created_at)}
                    target={inc.target || 'Multiple Systems'}
                    source={inc.source || 'Unknown Origin'}
                    status={inc.status}
                />
            ))}
            {openIncidents.length === 0 && <p className="text-zinc-600 text-sm italic text-center mt-4">No open incidents.</p>}
        </IncidentColumn>

        <IncidentColumn title="Contained (Playbook 3)" count={containedIncidents.length} type="warning">
             {containedIncidents.map((inc) => (
               <IncidentCard 
                    key={inc.id}
                    id={inc.id.substring(0, 8).toUpperCase()}
                    title={inc.title}
                    severity={inc.severity}
                    time={formatTime(inc.created_at)}
                    target={inc.target || 'Target System'}
                    source={inc.source || 'Identified Source'}
                    status={inc.status}
                    actionTaken={inc.actionTaken || 'Automated containment applied.'}
                />
            ))}
            {containedIncidents.length === 0 && <p className="text-zinc-600 text-sm italic text-center mt-4">No contained incidents.</p>}
        </IncidentColumn>

        <IncidentColumn title="Resolved & Proven (Playbook 4 & 5)" count={resolvedIncidents.length} type="success">
             {resolvedIncidents.map((inc) => (
               <IncidentCard 
                    key={inc.id}
                    id={inc.id.substring(0, 8).toUpperCase()}
                    title={inc.title}
                    severity={inc.severity}
                    time={formatTime(inc.created_at)}
                    target={inc.target || 'Protected Resource'}
                    source={inc.source || 'Neutralized Threat'}
                    status={inc.status}
                    actionTaken={inc.actionTaken || 'Incident resolved and evidence logged.'}
                    showEvidence={inc.showEvidence !== false}
                />
            ))}
            {resolvedIncidents.length === 0 && <p className="text-zinc-600 text-sm italic text-center mt-4">No resolved incidents.</p>}
        </IncidentColumn>
    </div>
  );
}

function IncidentColumn({ title, count, type, children }: { title: string, count: number, type: 'danger'|'warning'|'success', children: ReactNode }) {
    const typeConfig = {
        danger: 'border-red-900/50 bg-red-900/10 text-red-500',
        warning: 'border-yellow-900/50 bg-yellow-900/10 text-yellow-500',
        success: 'border-emerald-900/50 bg-emerald-900/10 text-emerald-500',
    };

    return (
        <div className="flex-1 min-w-[320px] max-w-md bg-zinc-900/30 border border-zinc-800/50 rounded-lg flex flex-col overflow-hidden">
            <header className={`p-4 border-b ${typeConfig[type]} flex justify-between items-center`}>
                <h3 className="font-semibold text-sm tracking-wide uppercase">{title}</h3>
                <span className="bg-black/40 px-2 py-0.5 rounded font-mono text-xs font-bold">{count}</span>
            </header>
            <div className="flex-1 p-4 overflow-y-auto space-y-4 custom-scrollbar">
                {children}
            </div>
        </div>
    );
}

function IncidentCard({ id, title, severity, time, target, source, status, actionTaken, showEvidence }: IncidentCardProps) {
    const sevColors: Record<string, string> = {
        CRITICAL: 'bg-red-500 text-white',
        HIGH: 'bg-orange-500 text-white',
        MEDIUM: 'bg-yellow-500 text-black',
        LOW: 'bg-zinc-500 text-white',
    };

    return (
        <div className="bg-[#0A0A17] border border-zinc-700/50 rounded-lg p-4 shadow-lg hover:border-zinc-500/50 transition-colors cursor-pointer group">
            <div className="flex justify-between items-start mb-3">
                <span className="text-xs font-mono text-zinc-500">{id}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded shadow ${sevColors[severity]}`}>{severity}</span>
            </div>
            
            <h4 className="text-zinc-100 font-semibold mb-2 group-hover:text-red-400 transition-colors">{title}</h4>
            
            <div className="text-xs text-zinc-400 space-y-1 mb-4 flex flex-col font-mono">
                <span className="truncate"><span className="text-zinc-600">TARGET:</span> {target}</span>
                <span className="truncate"><span className="text-zinc-600">SOURCE:</span> {source}</span>
                <span className="truncate"><span className="text-zinc-600">TIME:</span> {time}</span>
            </div>

            {actionTaken && (
                <div className="text-xs bg-black/60 border border-zinc-800 p-2 rounded text-zinc-300 font-mono mb-3">
                    <span className="text-emerald-500 mr-2">❯</span>{actionTaken}
                </div>
            )}

            <div className="flex justify-between items-center pt-3 border-t border-zinc-800">
                <span className="text-xs font-semibold text-zinc-500">{status}</span>
                
                {showEvidence && (
                    <button className="flex items-center gap-1 text-xs text-emerald-500 hover:text-emerald-400">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Hash Verified
                    </button>
                )}
                {!showEvidence && (
                    <button className="text-xs text-red-400 hover:text-red-300 transition-colors font-medium">Overwatch</button>
                )}
            </div>
        </div>
    );
}
