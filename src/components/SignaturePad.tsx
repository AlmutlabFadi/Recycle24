"use client";

import { useRef, useState, useEffect } from "react";

interface SignaturePadProps {
    title: string;
    onSign?: (signature: string) => void;
    placeholder?: string;
}

export default function SignaturePad({ title, onSign, placeholder = "الموقع هنا" }: SignaturePadProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasDrawn, setHasDrawn] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext("2d");
            if (ctx) {
                ctx.strokeStyle = "#ffffff";
                ctx.lineWidth = 2;
                ctx.lineCap = "round";
                ctx.lineJoin = "round";
            }
        }
    }, []);

    const getCoordinates = (event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (!canvasRef.current) return null;
        
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        
        let clientX, clientY;
        
        if ('touches' in event) {
            clientX = event.touches[0].clientX;
            clientY = event.touches[0].clientY;
        } else {
            clientX = (event as React.MouseEvent).clientX;
            clientY = (event as React.MouseEvent).clientY;
        }

        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    };

    const startDrawing = (event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        event.preventDefault();
        const coords = getCoordinates(event);
        if (!coords || !canvasRef.current) return;

        const ctx = canvasRef.current.getContext("2d");
        if (ctx) {
            ctx.beginPath();
            ctx.moveTo(coords.x, coords.y);
            setIsDrawing(true);
            setHasDrawn(true);
        }
    };

    const draw = (event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        event.preventDefault();
        if (!isDrawing) return;

        const coords = getCoordinates(event);
        if (!coords || !canvasRef.current) return;

        const ctx = canvasRef.current.getContext("2d");
        if (ctx) {
            ctx.lineTo(coords.x, coords.y);
            ctx.stroke();
        }
    };

    const stopDrawing = (event?: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (event) event.preventDefault();
        if (isDrawing) {
            setIsDrawing(false);
            if (onSign && canvasRef.current && hasDrawn) {
                onSign(canvasRef.current.toDataURL("image/png"));
            }
        }
    };

    const clearSignature = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext("2d");
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                setHasDrawn(false);
                if (onSign) {
                    onSign("");
                }
            }
        }
    };

    return (
        <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center text-sm">
                <span className="text-slate-300">{title}</span>
                <button 
                    onClick={clearSignature}
                    className="text-primary hover:text-primary/80 transition-colors bg-transparent border-none p-0 cursor-pointer"
                    type="button"
                >
                    مسح التوقيع
                </button>
            </div>
            
            <div className="relative rounded-xl border border-slate-700 bg-surface-dark/50 overflow-hidden h-32 block">
                {!hasDrawn && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                        <span className="text-4xl font-arabic font-bold uppercase tracking-widest text-slate-500 select-none whitespace-nowrap">{placeholder}</span>
                    </div>
                )}
                
                <canvas
                    ref={canvasRef}
                    width={400}
                    height={128}
                    className="w-full h-full touch-none cursor-crosshair relative z-10"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    onTouchCancel={stopDrawing}
                />
                
                <div className="absolute bottom-3 left-3 w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center opacity-80 z-0 border border-slate-700 pointer-events-none">
                    <span className="material-symbols-outlined text-slate-400 text-[16px]">edit</span>
                </div>
            </div>
        </div>
    );
}
