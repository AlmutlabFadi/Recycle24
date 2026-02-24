'use client';

import { useEffect, useState } from 'react';

interface AttackPoint {
    id: string;
    x: number;
    y: number;
    severity: 'HIGH' | 'LOW';
    life: number;
}

export default function AttackMap() {
    const [points, setPoints] = useState<AttackPoint[]>([]);

    // Simulated attack pulse effect
    useEffect(() => {
        const interval = setInterval(() => {
            const newPoint: AttackPoint = {
                id: Math.random().toString(),
                x: Math.random() * 100,
                y: Math.random() * 100,
                severity: Math.random() > 0.8 ? 'HIGH' : 'LOW',
                life: 100
            };
            setPoints(prev => [...prev, newPoint].slice(-15)); // Keep last 15 points
        }, 800);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="absolute inset-0 bg-[#050511] overflow-hidden">
            {/* Grid overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />
            
            {/* Map Placeholder Image (Stylized) */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
                <svg viewBox="0 0 1000 500" className="w-full h-full text-blue-500/30" preserveAspectRatio="xMidYMid slice">
                   {/* Simplified World Path Silhouette for aesthetics */}
                   <path fill="currentColor" d="M100,100 Q150,50 200,100 T300,150 T400,100 T500,200 T600,150 T700,250 T800,200 T900,150 L900,300 Q850,350 800,300 T700,350 T600,400 T500,300 T400,350 T300,300 T200,400 T100,300 Z" opacity="0.4" />
                   <path fill="currentColor" d="M400,50 Q450,20 500,80 T600,60 T700,120 L750,80 L800,150 L700,200 L650,150 Z" opacity="0.3" />
                </svg>
            </div>

            {/* Target Reticle (Center Dashboard focus) */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[30rem] h-[30rem] border border-cyan-900/20 rounded-full animate-[spin_60s_linear_infinite]" />
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[20rem] h-[20rem] border-2 border-red-900/10 border-dashed rounded-full animate-[spin_40s_linear_infinite_reverse]" />

            {/* Live Attack Points */}
            {points.map(point => (
                <div 
                    key={point.id}
                    className="absolute z-10"
                    style={{ left: `${point.x}%`, top: `${point.y}%` }}
                >
                    {/* Ripple */}
                    <div className={`absolute -inset-4 rounded-full animate-ping opacity-50 ${point.severity === 'HIGH' ? 'bg-red-500' : 'bg-cyan-500'}`} />
                    
                    {/* Core */}
                    <div className={`relative w-2 h-2 rounded-full ${point.severity === 'HIGH' ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)]' : 'bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]'}`} />
                    
                    {/* Trajectory line placeholder */}
                    <div className={`absolute top-1 left-1 w-24 h-[1px] ${point.severity === 'HIGH' ? 'bg-gradient-to-r from-red-500/50 to-transparent' : 'bg-gradient-to-r from-cyan-400/50 to-transparent'} origin-left -rotate-45`} />
                </div>
            ))}
            
            {/* Status Footer */}
            <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end z-20 pointer-events-none">
                <div className="flex gap-4 items-center bg-[#050511]/80 px-4 py-2 border border-zinc-800 rounded font-mono text-xs">
                    <span className="text-zinc-500">SECTOR ALPHA</span>
                    <span className="text-cyan-500 font-bold">SECURE</span>
                    <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse" />
                </div>
                
                <div className="text-right">
                    <div className="text-xs text-zinc-500 font-mono mb-1">DATA LINK STATUS</div>
                    <div className="flex gap-1 justify-end">
                        {[1,2,3,4,5].map(i => (
                            <div key={i} className={`w-8 h-1 ${i === 4 || i === 5 ? 'bg-zinc-800' : 'bg-emerald-500'} rounded-sm`} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
