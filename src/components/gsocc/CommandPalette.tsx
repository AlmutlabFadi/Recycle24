'use client';

import { useState } from 'react';

/**
 * GSOCC Command Palette (Playbook 3 & 4 Interface)
 * Allows sovereign commanders to manually override or execute instant containment.
 */
export default function CommandPalette({ activeIncidents }: { activeIncidents: number }) {
    const [command, setCommand] = useState('');
    const [executing, setExecuting] = useState(false);
    const [log, setLog] = useState<string[]>(['gsocc@core:~$ systemctl status automated-defense', '● automated-defense.service - GSOCC Playbook Orchestrator', '   Loaded: loaded', '   Active: active (running) since Sun 2026-02-22']);

    const handleExecute = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!command) return;

        setExecuting(true);
        setLog(prev => [...prev, `gsocc@core:~$ ${command}`]);
        
        let actionStr = '';
        let targetStr = '';
        
        if (command.toLowerCase().startsWith('block ip ')) {
            actionStr = 'BLOCK_IP';
            targetStr = command.split(' ')[2];
        } else if (command.toLowerCase().startsWith('isolate user ')) {
             actionStr = 'ISOLATE_USER';
             targetStr = command.split(' ')[2];
        }

        if (!actionStr) {
             setLog(prev => [...prev, `[ERROR] Unknown command format. Try 'block ip [IP]' or 'isolate user [ID]'`]);
             setExecuting(false);
             setCommand('');
             return;
        }

        try {
            const res = await fetch('/api/gsocc/actions', {
                method: 'POST',
                body: JSON.stringify({ action: actionStr, targetId: targetStr, incidentId: 'MANUAL_OVERRIDE', reason: `Terminal intervention: ${command}` })
            });
            const data = await res.json();
            
            if (res.ok) {
                 setLog(prev => [...prev, `[SUCCESS] ${data.message}`]);
            } else {
                 setLog(prev => [...prev, `[ERROR] ${data.error || 'Execution failed.'}`]);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setLog(prev => [...prev, `[FATAL] Network error: ${errorMessage}`]);
        } finally {
            setExecuting(false);
            setCommand('');
        }
    };

    return (
        <section className="bg-zinc-900/40 border border-zinc-800 rounded-lg p-5 flex flex-col h-full backdrop-blur-sm relative overflow-hidden">
            {/* Background texture */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-red-900/5 rounded-full blur-3xl -z-10" />

            <div className="flex justify-between items-center mb-6">
                <h2 className="text-sm text-zinc-400 font-semibold uppercase tracking-wider flex items-center gap-2">
                    <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Command / Execute
                </h2>
                
                {activeIncidents > 0 && (
                    <span className="bg-red-500/10 text-red-500 border border-red-500/20 px-2 py-0.5 rounded text-xs animate-pulse">
                        {activeIncidents} Active Incidents
                    </span>
                )}
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
                <QuickAction btnText="Isolate IP" icon="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" color="red" />
                <QuickAction btnText="Kill Session" icon="M13 10V3L4 14h7v7l9-11h-7z" color="yellow" />
                <QuickAction btnText="Escalate" icon="M9 11l3-3m0 0l3 3m-3-3v8m0-13a9 9 0 110 18 9 9 0 010-18z" color="indigo" />
                <QuickAction btnText="Audit Lock" icon="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" color="emerald" />
            </div>

            <hr className="border-zinc-800 my-2" />

            {/* CLI Interface */}
            <div className="flex-1 flex flex-col mt-4 relative">
                <div className="absolute inset-0 bg-red-900/5 mix-blend-overlay pointer-events-none" />
                
                <div className="flex-1 bg-black/40 border border-zinc-800 rounded p-4 font-mono text-xs overflow-y-auto w-full custom-scrollbar text-zinc-400 mb-4 h-40">
                    {log.map((line, idx) => (
                        <div key={idx} className={`${line.includes('[ERROR]') || line.includes('[FATAL]') ? 'text-red-400' : line.includes('[SUCCESS]') ? 'text-emerald-500' : line.startsWith('gsocc@core') ? 'text-cyan-400' : 'text-zinc-500'} mt-1`}>
                            {line}
                        </div>
                    ))}
                    <div className="text-zinc-500 animate-pulse mt-2">_</div>
                </div>

                <form onSubmit={handleExecute} className="w-full relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500 font-mono text-sm leading-none">❯</span>
                    <input 
                        type="text" 
                        value={command}
                        onChange={(e) => setCommand(e.target.value)}
                        placeholder="Enter command (e.g. block ip 192.168.1.x)"
                        disabled={executing}
                        className="w-full bg-black/60 border border-zinc-800 text-zinc-200 font-mono text-sm rounded py-3 pl-8 pr-4 focus:outline-none focus:border-red-900 focus:ring-1 focus:ring-red-900 transition-all placeholder:text-zinc-700 disabled:opacity-50"
                    />
                    {executing && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                    )}
                </form>
            </div>
        </section>
    );
}

function QuickAction({ btnText, icon, color }: { btnText: string, icon: string, color: 'red' | 'yellow' | 'indigo' | 'emerald' }) {
    const colorMap = {
        red: 'hover:bg-red-900/20 hover:border-red-900/50 text-red-500 fill-red-500/10',
        yellow: 'hover:bg-yellow-900/20 hover:border-yellow-900/50 text-yellow-500 fill-yellow-500/10',
        indigo: 'hover:bg-indigo-900/20 hover:border-indigo-900/50 text-indigo-400 fill-indigo-500/10',
        emerald: 'hover:bg-emerald-900/20 hover:border-emerald-900/50 text-emerald-500 fill-emerald-500/10',
    };

    return (
        <button className={`flex items-center gap-3 p-3 rounded border border-zinc-800 bg-black/20 text-left transition-all ${colorMap[color]} group`}>
            <div className="bg-zinc-900 p-2 rounded group-hover:bg-black/40 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                </svg>
            </div>
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-300 group-hover:text-white transition-colors">{btnText}</span>
        </button>
    );
}
