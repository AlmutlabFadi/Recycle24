'use client';

import { useEffect, useState } from 'react';

interface PredictiveInsight {
  forecastedThreatType: string;
  probability: number;
  timeframeHours: number;
  recommendedAction: string;
  whatIfScenario: string;
}

interface SystemHealthInsight {
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  predictedBottleneck: string | null;
  responseTimeTrend: 'STABLE' | 'DEGRADING' | 'IMPROVING';
  activeConnections: number;
}

export default function PredictiveInsights() {
    const [insights, setInsights] = useState<PredictiveInsight[]>([]);
    const [health, setHealth] = useState<SystemHealthInsight | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPredictions = async () => {
            try {
                const res = await fetch('/api/gsocc/predict');
                if (res.ok) {
                    const data = await res.json();
                    setInsights(data.insights || []);
                    setHealth(data.health);
                }
            } catch (err) {
                console.error("Failed to fetch predictive insights", err);
            } finally {
                setLoading(false);
            }
        };

        fetchPredictions();
        const interval = setInterval(fetchPredictions, 30000); // Pulse every 30s
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="bg-[#050511]/80 border border-zinc-800 backdrop-blur-md p-4 rounded-lg shadow-2xl pointer-events-auto min-w-[300px] h-32 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="bg-[#050511]/80 border border-zinc-800 backdrop-blur-md p-4 rounded-lg shadow-2xl pointer-events-auto min-w-[340px] flex flex-col gap-4">
            
            {/* System Health Module */}
            <div>
                <h2 className="text-zinc-400 font-mono text-xs mb-2 uppercase tracking-wider flex justify-between items-center">
                    <span>System Forecasting</span>
                    {health?.status === 'HEALTHY' && <span className="text-emerald-500">OPTIMAL</span>}
                    {health?.status === 'WARNING' && <span className="text-yellow-500 animate-pulse">DEGRADING</span>}
                    {health?.status === 'CRITICAL' && <span className="text-red-500 animate-pulse">AT RISK</span>}
                </h2>
                
                {health?.predictedBottleneck && (
                    <div className="text-xs text-yellow-500/80 bg-yellow-500/10 border border-yellow-500/20 p-2 rounded mb-2">
                        <span className="font-bold text-yellow-500">BOTTLENECK PREDICTED:</span> {health.predictedBottleneck}
                    </div>
                )}
                <div className="flex justify-between text-xs font-mono text-zinc-500">
                    <span>Trend: <span className="text-zinc-300">{health?.responseTimeTrend}</span></span>
                    <span>Load: <span className="text-zinc-300">{health?.activeConnections} CCU</span></span>
                </div>
            </div>

            <hr className="border-zinc-800" />

            {/* AI Threat Predictions */}
            <div>
                 <h2 className="text-indigo-400 font-mono text-xs mb-3 uppercase tracking-wider flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    AI Attack Forecast
                </h2>
                
                <div className="space-y-3 max-h-[250px] overflow-y-auto custom-scrollbar pr-1">
                    {insights.map((insight, idx) => (
                        <div key={idx} className="bg-black/60 border border-zinc-800/80 p-3 rounded hover:border-indigo-500/50 transition-colors group">
                            <div className="flex justify-between items-start mb-1">
                                <span className="text-xs font-bold text-zinc-200 group-hover:text-indigo-400 transition-colors uppercase truncate max-w-[200px]" title={insight.forecastedThreatType}>{insight.forecastedThreatType}</span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${insight.probability > 75 ? 'bg-red-500/20 text-red-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
                                    {insight.probability}% PROB
                                </span>
                            </div>
                            <div className="text-[10px] text-zinc-500 font-mono mb-2">ETA: Within {insight.timeframeHours}h</div>
                            
                            <div className="text-[10px] space-y-1.5">
                                <div className="text-zinc-400"><span className="text-indigo-400 mr-1">❯</span>{insight.recommendedAction}</div>
                                <div className="text-zinc-500 italic border-l-2 border-zinc-700 pl-2 mt-1">&ldquo;{insight.whatIfScenario}&rdquo;</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
