'use client';

import { useState } from 'react';
import { useToast } from '@/contexts/ToastContext';

const playbooks = [
  {
    id: 'identity-compromise',
    name: 'Identity Compromise',
    code: 'PB-A',
    description: 'Responds to compromised credentials or session hijacking.',
    triggers: ['Suspicious Login', 'Brute Force Detection', 'Manual Flag'],
    actions: ['Lock User Account', 'Invalidate All Sessions', 'Notify Security Team'],
    endpoint: '/api/security/playbooks/identity',
    severity: 'CRITICAL',
    color: 'red'
  },
  {
    id: 'api-abuse',
    name: 'API Abuse & Scraping',
    code: 'PB-B',
    description: 'Mitigates large-scale data scraping or API credential abuse.',
    triggers: ['Rate Limit Ceiling Hit', 'User-Agent Anomalies', 'IP Volatility'],
    actions: ['Block Origin IP', 'Throttle Account', 'Rotate API Keys'],
    endpoint: '/api/security/playbooks/api-abuse',
    severity: 'HIGH',
    color: 'orange'
  },
  {
    id: 'insider-threat',
    name: 'Insider Threat / Data Leak',
    code: 'PB-C',
    description: 'Handles unauthorized data export or administrative anomalies.',
    triggers: ['Mass Export Attempt', 'Permission Escalation', 'Off-Hours Access'],
    actions: ['Immediate Revocation', 'Demote Role', 'Forensic Snapshot'],
    endpoint: '/api/security/playbooks/insider-threat',
    severity: 'CRITICAL',
    color: 'rose'
  }
];

export default function ResponsePlaybooksPage() {
  const [executing, setExecuting] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>(['[SYSTEM] Playbook Orchestrator Initialized...', '[SIEM] Monitoring all threat vectors...']);
  const { addToast } = useToast();

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 50));
  };

  const handleExecute = async (playbook: typeof playbooks[0]) => {
    if (executing) return;
    
    // Simulate manual ID input for demo/manual override
    const targetId = prompt(`Enter Target ID (User ID or IP) for ${playbook.name}:`, "user_7721");
    if (!targetId) return;

    setExecuting(playbook.id);
    addLog(`INITIALIZING ${playbook.code}: ${playbook.name} on target ${targetId}`);
    
    try {
      const res = await fetch(playbook.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: targetId, ip: targetId, reason: 'Manual GSOCC Execution', adminId: 'GSOCC-CMD-01' })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        addLog(`SUCCESS: ${playbook.code} executed. ${data.message}`);
        addToast("Playbook executed successfully", "success");
      } else {
        addLog(`ERROR: ${playbook.code} failed. ${data.error}`);
        addToast(`Execution failed: ${data.error}`, "error");
      }
    } catch (err) {
      addLog(`FATAL: Connection error during ${playbook.code} execution.`);
      addToast("Network error during execution", "error");
    } finally {
      setExecuting(null);
    }
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto">
      <div className="flex justify-between items-end mb-10 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase flex items-center gap-3">
            <span className="w-2 h-8 bg-red-600 rounded-full animate-pulse" />
            Response Playbooks
          </h1>
          <p className="text-zinc-500 font-mono text-sm mt-2">Active Defense & Containment Orchestration Layer</p>
        </div>
        <div className="flex gap-4">
            <div className="text-right">
                <p className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] mb-1">Status</p>
                <p className="text-emerald-500 font-mono font-bold">READY</p>
            </div>
            <div className="w-px h-10 bg-zinc-800 mx-2" />
            <div className="text-right">
                <p className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] mb-1">Orchestrator</p>
                <p className="text-zinc-300 font-mono">v4.2.0-secure</p>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Playbook Cards */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          {playbooks.map((pb) => (
            <div key={pb.id} className={`bg-zinc-900/40 border ${executing === pb.id ? 'border-red-500' : 'border-zinc-800'} rounded-2xl p-6 transition-all hover:border-zinc-700 group relative overflow-hidden`}>
              <div className={`absolute top-0 right-0 w-32 h-32 bg-${pb.color}-600/5 rounded-full blur-[60px] -z-10`} />
              
              <div className="flex justify-between items-start mb-4">
                <span className={`px-2 py-1 rounded text-[10px] font-black border ${pb.severity === 'CRITICAL' ? 'border-red-500/30 text-red-500 bg-red-500/5' : 'border-orange-500/30 text-orange-500 bg-orange-500/5'}`}>
                  {pb.code} - {pb.severity}
                </span>
                {executing === pb.id && (
                  <div className="flex items-center gap-2 text-red-500">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Executing</span>
                  </div>
                )}
              </div>

              <h2 className="text-xl font-bold text-white mb-2">{pb.name}</h2>
              <p className="text-zinc-500 text-sm mb-6 leading-relaxed">{pb.description}</p>

              <div className="space-y-4 mb-8">
                <div>
                  <h3 className="text-[10px] text-zinc-600 uppercase tracking-[0.2em] mb-2 font-bold">Triggers</h3>
                  <div className="flex flex-wrap gap-2">
                    {pb.triggers.map(t => (
                      <span key={t} className="text-[11px] text-zinc-400 bg-zinc-800/50 px-2 py-1 rounded border border-zinc-700/30 italic">#{t}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-[10px] text-zinc-600 uppercase tracking-[0.2em] mb-2 font-bold">Automated Response</h3>
                  <div className="space-y-1">
                    {pb.actions.map(a => (
                      <div key={a} className="flex items-center gap-2 text-xs text-zinc-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
                        {a}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <button 
                onClick={() => handleExecute(pb)}
                disabled={executing !== null}
                className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all border border-zinc-700 active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined !text-[18px]">bolt</span>
                Manual Override Execute
              </button>
            </div>
          ))}

          {/* New Custom Playbook Card Placeholder */}
          <div className="bg-zinc-900/20 border border-dashed border-zinc-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center group cursor-not-allowed">
            <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-zinc-600">add</span>
            </div>
            <p className="text-zinc-600 font-bold text-sm tracking-wide">Design Custom Playbook</p>
            <p className="text-[10px] text-zinc-800 mt-2 uppercase">L3 Commander Auth Required</p>
          </div>
        </div>

        {/* Execution Log Sidebar */}
        <div className="bg-black/40 border border-zinc-800 rounded-2xl flex flex-col h-[700px] shadow-2xl overflow-hidden backdrop-blur-md">
          <div className="p-4 border-b border-zinc-800 bg-zinc-900/30 flex justify-between items-center">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Real-time Logs
            </h3>
            <button onClick={() => setLogs([])} className="text-[10px] text-zinc-500 hover:text-white transition-colors">CLEAR</button>
          </div>
          
          <div className="flex-1 p-5 font-mono text-[11px] overflow-y-auto w-full custom-scrollbar space-y-2">
            {logs.map((L, i) => (
              <div key={i} className={`pb-2 border-b border-zinc-900/50 ${L.includes('ERROR') || L.includes('FATAL') ? 'text-red-400' : L.includes('SUCCESS') ? 'text-emerald-400' : L.includes('INITIALIZING') ? 'text-white font-bold' : 'text-zinc-500'}`}>
                {L}
              </div>
            ))}
            {logs.length === 0 && <div className="text-zinc-700 italic">No output logged...</div>}
          </div>

          <div className="p-4 bg-black/60 border-t border-zinc-900">
             <div className="flex items-center gap-2 text-[10px] text-zinc-600 uppercase font-bold tracking-widest">
                <span className="material-symbols-outlined !text-[12px]">security</span>
                Verified Forensic Logging v2
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
