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

export default async function SOCDashboard() {
  const stats = await getSecurityStats();

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-red-600">Security Operations Center (SOC)</h1>
      
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
          <h3 className="text-gray-500 text-sm font-medium">Events (24h)</h3>
          <p className="text-3xl font-bold">{stats.totalEvents}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-500">
          <h3 className="text-gray-500 text-sm font-medium">Critical Alerts (24h)</h3>
          <p className="text-3xl font-bold text-red-600">{stats.criticalEvents}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-500">
          <h3 className="text-gray-500 text-sm font-medium">Locked Users / IPs</h3>
          <p className="text-3xl font-bold text-yellow-600">{stats.lockedUsers}</p>
        </div>
      </div>

      {/* Playbook Controls */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4 border-b pb-2">Containment Controls (Playbooks)</h2>
        <div className="flex gap-4">
          <button className="px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition font-medium">
            Lock Specific User (Playbook A/C)
          </button>
          <button className="px-4 py-2 bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition font-medium">
            Block IP Range (Playbook B)
          </button>
          <a href="/api/security/forensics/export?hours=24" target="_blank" className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition font-medium ml-auto">
            Export Forensic Logs (JSON)
          </a>
        </div>
      </div>

      {/* Recent Incidents Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-800">Recent Security Incidents</h2>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User/Target</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {stats.recentIncidents.map((incident) => (
              <tr key={incident.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(incident.createdAt).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${incident.level === 'CRITICAL' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {incident.level}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                  {incident.event}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                   {incident.userId ? `${incident.user?.name || 'Unknown'} (${incident.userId})` : incident.ip || 'N/A'}
                </td>
              </tr>
            ))}
            {stats.recentIncidents.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500 italic">No recent incidents found. System is secure.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
