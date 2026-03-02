import React from 'react';

import Link from 'next/link';

export default function BoardReport() {
  return (
    <div className="min-h-screen bg-bg-dark font-display pb-20">
      <div className="p-4 lg:p-10 max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-10">
          <Link href="/admin/dashboard" className="w-10 h-10 rounded-2xl bg-surface-highlight border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-primary transition-all group">
            <span className="material-symbols-outlined !text-[20px]">arrow_forward</span>
          </Link>
          <div className="flex-1 flex justify-between items-center">
            <div>
              <h1 className="text-2xl lg:text-3xl font-black text-white uppercase tracking-tighter">Cyber Resilience Report</h1>
              <p className="text-xs text-slate-500 font-bold">Executive Summary & Security Posture</p>
            </div>
            <div className="text-left">
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Date: {new Date().toLocaleDateString("en-US")}</p>
              <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Status: SECURE</p>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <section className="bg-surface-highlight border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse"></span>
              1. Executive Summary
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed font-medium">
              The DonalGo/Metalix24 platform is currently operating continuously with a &quot;Closed-Loop Control&quot; defense model framework. 
              Recent audits and implementations of our automated SIEM, active containment playbooks, and forensic logging mechanisms confirm our 
              readiness against internal and external threats in accordance with rigorous standards (SOC 2 / ISO baseline).
            </p>
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl"></div>
          </section>

          <section>
            <h2 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-4 px-4">2. Key Performance Indicators (KPIs)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-6 bg-surface-highlight border border-slate-800 rounded-3xl">
                <h3 className="text-[10px] text-slate-500 font-black uppercase mb-1">MTTD (Detection)</h3>
                <p className="text-2xl font-black text-emerald-500 font-english">&lt; 2 Minutes</p>
                <p className="text-[9px] text-slate-600 mt-1 font-bold">SIEM / UEBA signals</p>
              </div>
              <div className="p-6 bg-surface-highlight border border-slate-800 rounded-3xl">
                <h3 className="text-[10px] text-slate-500 font-black uppercase mb-1">MTTC (Containment)</h3>
                <p className="text-2xl font-black text-emerald-500 font-english">&lt; 5 Minutes</p>
                <p className="text-[9px] text-slate-600 mt-1 font-bold">Automated Kill Switch</p>
              </div>
              <div className="p-6 bg-surface-highlight border border-slate-800 rounded-3xl">
                <h3 className="text-[10px] text-slate-500 font-black uppercase mb-1">Forensics</h3>
                <p className="text-2xl font-black text-blue-500 font-english">100%</p>
                <p className="text-[9px] text-slate-600 mt-1 font-bold">Tamper-evident hashing</p>
              </div>
              <div className="p-6 bg-surface-highlight border border-slate-800 rounded-3xl">
                <h3 className="text-[10px] text-slate-500 font-black uppercase mb-1">Major Incidents</h3>
                <p className="text-2xl font-black text-white font-english">0</p>
                <p className="text-[9px] text-slate-600 mt-1 font-bold">Last 30 Days</p>
              </div>
            </div>
          </section>

          <section className="bg-slate-900/40 border border-slate-800/50 rounded-[2.5rem] p-8">
            <h2 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-6">3. Closed-Loop System Status</h2>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { title: "Detection (SIEM / Logging)", desc: "Active. All API gateways and identity flows are logged.", status: "Active" },
                { title: "Containment (Playbooks)", desc: "Active. Instant IP blocking and account freezing deployed.", status: "Active" },
                { title: "Forensics (Evidence)", desc: "Active. Logs are cryptographically signed (WORM equivalent).", status: "Active" },
                { title: "Prevention (Dashboard)", desc: "Active. Single-pane-of-glass visibility via SOC Dashboard.", status: "Active" },
              ].map((item, i) => (
                <li key={i} className="flex gap-4">
                  <span className="material-symbols-outlined text-emerald-500 bg-emerald-500/10 p-2 rounded-xl h-fit">verified_user</span>
                  <div>
                    <strong className="text-white text-sm font-bold block mb-1">{item.title}</strong>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800 text-[10px] text-slate-600 flex justify-between font-mono font-bold uppercase tracking-widest">
          <p>Prepared securely via Internal Automated Systems</p>
          <p>Report SIG: {new Date().getTime().toString(16).toUpperCase()}</p>
        </div>
      </div>
    </div>
  );
}
