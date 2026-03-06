import { ReactNode } from 'react';

export const metadata = {
  title: 'GSOCC Command Center | Sovereign Control',
  description: 'Global Security & Operations Command Center',
};

export default function GSOCCLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#050511] text-zinc-100 font-mono tracking-tight selection:bg-red-500/30">
      {/* Top Command Bar */}
      <header className="fixed top-0 inset-x-0 h-16 border-b border-red-900/40 bg-[#0A0A17]/80 backdrop-blur-md z-50 px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <a href="/admin/dashboard" className="w-8 h-8 rounded-lg bg-red-900/20 border border-red-900/40 flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all group" title="العودة لوحة التحكم">
            <span className="material-symbols-outlined !text-[20px] group-hover:scale-110 transition">arrow_forward</span>
          </a>
          <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse shadow-[0_0_10px_rgba(220,38,38,0.7)]" />
          <h1 className="text-xl font-bold bg-gradient-to-r from-red-500 to-rose-400 bg-clip-text text-transparent uppercase tracking-widest flex items-center gap-2">
            GSOCC <span className="text-[10px] text-zinc-500 font-normal hidden md:inline">Sovereign Command</span>
          </h1>
        </div>
        
        <nav className="flex items-center gap-6 text-sm text-zinc-400">
          <a href="/gsocc" className="hover:text-red-400 transition-colors">Global Pulse</a>
          <a href="/gsocc/incidents" className="hover:text-red-400 transition-colors">Active Incidents</a>
          <a href="/gsocc/playbooks" className="hover:text-red-400 transition-colors">Response Playbooks</a>
          <a href="/gsocc/audit" className="hover:text-red-400 transition-colors">Immutable Audit</a>
        </nav>

        <div className="flex items-center gap-4">
          <div className="text-xs text-red-500 font-bold border border-red-500/30 px-3 py-1 rounded bg-red-500/10">DEFCON 2</div>
          <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs">A</div>
        </div>
      </header>

      {/* Main Command Area */}
      <main className="pt-16 min-h-screen overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
