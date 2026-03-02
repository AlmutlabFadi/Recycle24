"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import HeaderWithBack from "@/components/HeaderWithBack";
import { useToast } from "@/contexts/ToastContext";

interface DriverDelivery {
    id: string;
    status: string;
    order: {
        id: string;
        pickupAddress: string;
        dropoffAddress: string;
        recipientName: string | null;
        recipientPhone: string | null;
    };
}

export default function DriverPodPage() {
    const params = useParams();
    const deliveryId = params?.id as string;
    const router = useRouter();
    const { addToast } = useToast();

    const [delivery, setDelivery] = useState<DriverDelivery | null>(null);
    const [loading, setLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [photoUrls, setPhotoUrls] = useState<string[]>([]);
    const [signedName, setSignedName] = useState("");
    const [signatureSvg, setSignatureSvg] = useState<string | null>(null);
    const [lat, setLat] = useState<number | null>(null);
    const [lng, setLng] = useState<number | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const isDrawingRef = useRef(false);

    const fetchDelivery = useCallback(async () => {
        if (!deliveryId) return;
        setLoading(true);
        try {
            const response = await fetch("/api/driver/deliveries", { cache: "no-store" });
            const data = await response.json();
            if (response.ok) {
                const found = (data.deliveries || []).find((d: DriverDelivery) => d.id === deliveryId);
                setDelivery(found || null);
            }
        } catch (error) {
            console.error("Fetch delivery error:", error);
        } finally {
            setLoading(false);
        }
    }, [deliveryId]);

    useEffect(() => {
        fetchDelivery();
    }, [fetchDelivery]);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        setIsUploading(true);
        try {
            for (const file of Array.from(files)) {
                const formData = new FormData();
                formData.append("file", file);
                const res = await fetch("/api/upload", { method: "POST", body: formData });
                const result = await res.json();
                if (result.success) {
                    setPhotoUrls((prev) => [...prev, result.url]);
                } else {
                    addToast(result.error || "خطأ في رفع الملف", "error");
                }
            }
        } catch {
            addToast("تعذر الاتصال بالخادم لرفع الملف", "error");
        } finally {
            setIsUploading(false);
        }
    };

    const handleLocate = () => {
        if (!navigator.geolocation) {
            addToast("الموقع غير مدعوم على هذا الجهاز", "warning");
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setLat(pos.coords.latitude);
                setLng(pos.coords.longitude);
                addToast("تم حفظ الموقع بنجاح", "success");
            },
            () => addToast("تعذر تحديد الموقع", "error")
        );
    };

    const canSubmit = useMemo(() => photoUrls.length > 0 && !submitting, [photoUrls.length, submitting]);

    const setupCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const parent = canvas.parentElement;
        const width = parent ? parent.clientWidth : 320;
        const height = 160;
        const scale = window.devicePixelRatio || 1;
        canvas.width = width * scale;
        canvas.height = height * scale;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.scale(scale, scale);
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.strokeStyle = "#e2e8f0";
        ctx.lineWidth = 2;
        ctx.fillStyle = "#0b1220";
        ctx.fillRect(0, 0, width, height);
    }, []);

    useEffect(() => {
        setupCanvas();
        const handleResize = () => setupCanvas();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [setupCanvas]);

    const drawStart = (x: number, y: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.beginPath();
        ctx.moveTo(x, y);
        isDrawingRef.current = true;
    };

    const drawMove = (x: number, y: number) => {
        if (!isDrawingRef.current) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const drawEnd = () => {
        if (!isDrawingRef.current) return;
        isDrawingRef.current = false;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const dataUrl = canvas.toDataURL("image/png");
        setSignatureSvg(dataUrl);
    };

    const clearSignature = () => {
        setupCanvas();
        setSignatureSvg(null);
    };

    const handleSubmit = async () => {
        if (!deliveryId) return;
        if (photoUrls.length === 0) {
            addToast("يرجى رفع صورة إثبات التسليم", "warning");
            return;
        }
        setSubmitting(true);
        try {
            const response = await fetch(`/api/driver/deliveries/${deliveryId}/deliver`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    signedName: signedName || null,
                    signatureSvg: signatureSvg || null,
                    photoUrls,
                    lat,
                    lng,
                }),
            });
            const result = await response.json();
            if (!response.ok) {
                addToast(result.error || "تعذر إتمام التسليم", "error");
                return;
            }
            addToast("تم تسجيل إثبات التسليم", "success");
            router.push("/driver/history");
        } catch (error) {
            console.error("Submit POD error:", error);
            addToast("حدث خطأ أثناء إرسال إثبات التسليم", "error");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col min-h-screen bg-background-dark font-arabic">
                <HeaderWithBack title="إثبات التسليم" />
                <main className="flex-1 p-4">
                    <div className="bg-surface-dark rounded-xl p-4 border border-slate-800 text-center text-slate-400 text-sm">
                        جاري التحميل...
                    </div>
                </main>
            </div>
        );
    }

    if (!delivery) {
        return (
            <div className="flex flex-col min-h-screen bg-background-dark font-arabic">
                <HeaderWithBack title="إثبات التسليم" />
                <main className="flex-1 p-4">
                    <div className="bg-surface-dark rounded-xl p-4 border border-slate-800 text-center text-slate-400 text-sm">
                        لم يتم العثور على الشحنة المطلوبة.
                    </div>
                </main>
            </div>
        );
    }

    if (delivery.status !== "OUT_FOR_DELIVERY") {
        return (
            <div className="flex flex-col min-h-screen bg-background-dark font-arabic">
                <HeaderWithBack title="إثبات التسليم" />
                <main className="flex-1 p-4">
                    <div className="bg-surface-dark rounded-xl p-4 border border-slate-800 text-center text-slate-400 text-sm">
                        لا يمكن تسجيل إثبات التسليم إلا للشحنات في حالة &quot;في الطريق&quot;.
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-background-dark font-arabic">
            <HeaderWithBack title="إثبات التسليم" />

            <main className="flex-1 p-4 pb-28 space-y-4">
                <div className="bg-surface-dark rounded-xl p-4 border border-slate-800">
                    <p className="text-xs text-slate-500">شحنة #{delivery.order.id}</p>
                    <p className="text-sm font-bold text-white">من {delivery.order.pickupAddress}</p>
                    <p className="text-xs text-slate-400">إلى {delivery.order.dropoffAddress}</p>
                    <div className="flex items-center justify-between text-xs text-slate-400 mt-2">
                        <span>المستلم: {delivery.order.recipientName || "غير محدد"}</span>
                        <span dir="ltr">{delivery.order.recipientPhone || "--"}</span>
                    </div>
                </div>

                <div className="bg-surface-highlight rounded-xl p-4 border border-slate-700 space-y-3">
                    <h2 className="text-sm font-bold text-white">صور إثبات التسليم</h2>
                    <label className="relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-700 rounded-xl bg-surface-dark cursor-pointer hover:border-primary/50 hover:bg-surface-highlight transition group overflow-hidden">
                        <div className="flex flex-col items-center gap-2 text-slate-500 group-hover:text-primary transition">
                            <span className="material-symbols-outlined !text-[32px]">upload_file</span>
                            <span className="text-xs font-medium text-center px-4">
                                {isUploading ? "جاري رفع الصور..." : "ارفع صور واضحة لإثبات التسليم"}
                            </span>
                        </div>
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={handleUpload}
                        />
                    </label>

                    {photoUrls.length > 0 && (
                        <div className="grid grid-cols-3 gap-2">
                            {photoUrls.map((img, idx) => (
                                <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-slate-700 group">
                                    <img src={img} alt={`POD ${idx}`} className="w-full h-full object-cover" />
                                    <button
                                        onClick={() => setPhotoUrls((prev) => prev.filter((_, i) => i !== idx))}
                                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition shadow-sm"
                                    >
                                        <span className="material-symbols-outlined !text-[16px]">close</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="bg-surface-highlight rounded-xl p-4 border border-slate-700 space-y-3">
                    <h2 className="text-sm font-bold text-white">بيانات المستلم</h2>
                    <input
                        type="text"
                        value={signedName}
                        onChange={(e) => setSignedName(e.target.value)}
                        placeholder="اسم المستلم (اختياري)"
                        className="w-full bg-surface-dark border border-slate-700 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-primary transition"
                    />
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <p className="text-xs text-slate-400">توقيع المستلم (اختياري)</p>
                            <button
                                type="button"
                                onClick={clearSignature}
                                className="text-xs text-slate-400 hover:text-slate-200"
                            >
                                مسح التوقيع
                            </button>
                        </div>
                        <div className="rounded-xl border border-slate-700 bg-surface-dark overflow-hidden">
                            <canvas
                                ref={canvasRef}
                                onPointerDown={(e) => {
                                    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
                                    drawStart(e.clientX - rect.left, e.clientY - rect.top);
                                }}
                                onPointerMove={(e) => {
                                    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
                                    drawMove(e.clientX - rect.left, e.clientY - rect.top);
                                }}
                                onPointerUp={drawEnd}
                                onPointerLeave={drawEnd}
                                className="w-full h-40 touch-none"
                            />
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleLocate}
                        className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-surface-dark py-3 text-xs font-bold text-slate-200 hover:border-primary/50 transition"
                    >
                        <span className="material-symbols-outlined !text-[18px] text-primary">my_location</span>
                        {lat && lng ? "تم حفظ موقع التسليم" : "حفظ موقع التسليم"}
                    </button>
                </div>
            </main>

            <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background-dark/90 backdrop-blur border-t border-slate-800 max-w-md mx-auto">
                <button
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                    className={`w-full flex items-center justify-center gap-2 text-white font-bold text-base py-4 rounded-xl shadow-lg transition-all duration-200 ${
                        canSubmit ? "bg-emerald-600 hover:bg-emerald-500" : "bg-slate-700 cursor-not-allowed opacity-50"
                    }`}
                >
                    {submitting ? (
                        <>
                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                            <span>جاري الإرسال...</span>
                        </>
                    ) : (
                        <>
                            <span className="material-symbols-outlined !text-[20px]">verified</span>
                            <span>تأكيد التسليم</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
