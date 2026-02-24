import AttackMap from "@/components/gsocc/AttackMap";
import CommandPalette from "@/components/gsocc/CommandPalette";
import PredictiveInsights from "@/components/gsocc/PredictiveInsights";

export default function GSOCCMainHub() {
  return (
    <div className="relative w-full h-[calc(100vh-4rem)] bg-black overflow-hidden flex">
      {/* Background Live Threat Map */}
      <div className="absolute inset-0 z-0">
        <AttackMap />
      </div>

      {/* Main Command Layer Overlay */}
      <div className="relative z-10 p-6 flex-1 flex flex-col justify-between pointer-events-none">
        
        {/* Top Status Indicators */}
        <div className="flex justify-between items-start w-full max-w-7xl mx-auto">
            <div className="bg-[#050511]/80 border border-zinc-800 backdrop-blur-md p-4 rounded-lg shadow-2xl pointer-events-auto min-w-[300px]">
                <h2 className="text-zinc-400 font-mono text-xs mb-4 uppercase tracking-wider">System Status</h2>
                <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-zinc-300">WAF Filters</span>
                        <span className="text-emerald-500 font-bold font-mono">ACTIVE</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-zinc-300">Identity Shield</span>
                        <span className="text-emerald-500 font-bold font-mono">ACTIVE</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-zinc-300">Threat Intel Feed</span>
                        <span className="text-yellow-500 font-bold font-mono">SYNCING...</span>
                    </div>
                </div>
            </div>

            <div className="bg-[#050511]/80 border border-red-900/50 backdrop-blur-md p-4 rounded-lg shadow-2xl pointer-events-auto min-w-[250px]">
                 <h2 className="text-red-400 font-mono text-xs mb-2 uppercase tracking-wider border-b border-red-900/30 pb-2">Active Threats Detected</h2>
                 <div className="text-4xl font-black text-red-500 font-mono mt-2">
                    03 <span className="text-lg text-red-800">CRITICAL</span>
                 </div>
                 <div className="text-xs text-zinc-500 mt-2 font-mono">Autocontainment Engaged</div>
            </div>

            {/* AI Predictive Defense Layer */}
            <PredictiveInsights />
        </div>

        {/* Bottom Command Tooling */}
        <div className="w-full max-w-4xl mx-auto pointer-events-auto mt-12 shadow-[0_0_50px_rgba(0,0,0,0.8)]">
             <CommandPalette activeIncidents={0} />
        </div>
      </div>
    </div>
  );
}
