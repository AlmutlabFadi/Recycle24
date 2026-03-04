import React from 'react';
import { db } from "@/lib/db";

interface SecurityIncident {
  id: string;
  level: string;
  event: string;
  userId: string | null;
  ip: string | null;
  createdAt: Date;
  user: { name: string | null; phone: string | null } | null;
}

export const metadata = {
  title: 'SOC Dashboard | Metalix24 Security',
  description: 'Security Operations Center Dashboard',
};

async function getSecurityStats() {
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  const totalEvents = await db.securityLog.count({ where: { createdAt: { gte: last24h } } });
  const criticalEvents = await db.securityLog.count({ where: { level: 'CRITICAL', createdAt: { gte: last24h } } });
  const lockedUsers = await db.user.count({ where: { isLocked: true } });

  const recentIncidents = await db.securityLog.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    where: { level: { in: ['CRITICAL', 'WARN'] } },
    include: { user: { select: { name: true, phone: true } } }
  });

  return { totalEvents, criticalEvents, lockedUsers, recentIncidents: recentIncidents as SecurityIncident[] };
}

import Link from 'next/link';

export default async function SOCDashboard() {
  const stats = await getSecurityStats();

  return (
    <div className="min-h-screen bg-bg-dark font-display">
      <div className="p-4 lg:p-8 max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin/dashboard" className="w-10 h-10 rounded-2xl bg-surface-highlight border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-primary transition-all group">
            <span className="material-symbols-outlined !text-[20px]">arrow_forward</span>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white uppercase tracking-tight">Security Operations Center (SOC)</h1>
            <p className="text-xs text-slate-500 font-bold">نظام المراقبة والتحكم الأمني المتقدم</p>
          </div>
        </div>
        
        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-surface-highlight p-6 rounded-[2rem] border border-slate-800 shadow-lg group hover:border-blue-500/50 transition">
            <div className="flex justify-between items-start mb-4">
              <span className="material-symbols-outlined text-blue-500 bg-blue-500/10 p-2 rounded-xl">activity</span>
              <span className="text-[10px] font-bold text-slate-500 font-english">MTTD: 1.2m</span>
            </div>
            <h3 className="text-slate-400 text-xs font-bold mb-1">Events (24h)</h3>
            <p className="text-3xl font-bold text-white font-english">{stats.totalEvents.toLocaleString()}</p>
          </div>
          <div className="bg-surface-highlight p-6 rounded-[2rem] border border-slate-800 shadow-lg group hover:border-red-500/50 transition">
            <div className="flex justify-between items-start mb-4">
              <span className="material-symbols-outlined text-red-500 bg-red-500/10 p-2 rounded-xl">warning</span>
              <span className="text-[10px] font-bold text-red-500 bg-red-500/10 px-2 rounded-full">ACTIVE ALERTS</span>
            </div>
            <h3 className="text-slate-400 text-xs font-bold mb-1">Critical Alerts (24h)</h3>
            <p className="text-3xl font-bold text-red-500 font-english">{stats.criticalEvents}</p>
          </div>
          <div className="bg-surface-highlight p-6 rounded-[2rem] border border-slate-800 shadow-lg group hover:border-amber-500/50 transition">
            <div className="flex justify-between items-start mb-4">
              <span className="material-symbols-outlined text-amber-500 bg-amber-500/10 p-2 rounded-xl">block</span>
              <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 rounded-full">LOCKED</span>
            </div>
            <h3 className="text-slate-400 text-xs font-bold mb-1">Locked Users / IPs</h3>
            <p className="text-3xl font-bold text-amber-500 font-english">{stats.lockedUsers}</p>
          </div>
        </div>

        {/* Playbook Controls */}
        <div className="bg-surface-highlight p-8 rounded-[2.5rem] border border-slate-800 shadow-xl mb-8 relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">play_arrow</span>
              Containment Controls (Playbooks)
            </h2>
            <div className="flex flex-wrap gap-4">
              <button className="px-6 py-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-2xl hover:bg-red-500 hover:text-white transition font-bold text-xs">
                Lock Specific User (Playbook A/C)
              </button>
              <button className="px-6 py-3 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-2xl hover:bg-amber-500 hover:text-white transition font-bold text-xs">
                Block IP Range (Playbook B)
              </button>
              <a href="/api/security/forensics/export?hours=24" target="_blank" className="px-6 py-3 bg-slate-800 text-white border border-slate-700 rounded-2xl hover:bg-slate-700 transition font-bold text-xs ml-auto">
                Export Forensic Logs (JSON)
              </a>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
        </div>

        {/* Recent Incidents Table */}
        <div className="bg-surface-highlight rounded-[2.5rem] border border-slate-800 shadow-2xl overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center text-right">
            <div>
              <h2 className="text-base font-bold text-white">Security Incidents Feed</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Real-time Telemetry Data</p>
            </div>
            <button className="material-symbols-outlined text-slate-500 hover:text-white transition">refresh</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-900/30">
                  <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-wider">Time</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-wider">Level</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-wider">Event</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-wider">User/Target</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 font-mono">
                {stats.recentIncidents.map((incident) => (
                  <tr key={incident.id} className="hover:bg-slate-800/30 transition group">
                    <td className="px-8 py-4 text-xs text-slate-500 font-english">
                      {new Date(incident.createdAt).toLocaleString()}
                    </td>
                    <td className="px-8 py-4">
                      <span className={`px-3 py-1 text-[9px] font-black rounded-full uppercase tracking-tighter
                        ${incident.level === 'CRITICAL' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'}`}>
                        {incident.level}
                      </span>
                    </td>
                    <td className="px-8 py-4 text-xs text-white font-medium">
                      {incident.event}
                    </td>
                    <td className="px-8 py-4 text-xs text-slate-400 font-english">
                       {incident.userId ? `${incident.user?.name || 'Unknown'} (${incident.userId.substring(0,8)}...)` : incident.ip || 'N/A'}
                    </td>
                  </tr>
                ))}
                {stats.recentIncidents.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-8 py-12 text-center text-slate-600 italic text-sm">No recent incidents found. System is secure.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
