"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function InviteAcceptPage({ params }: { params: Promise<{ code: string }> }) {
    const { code } = use(params);
    const router = useRouter();
    const { update } = useSession();
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [message, setMessage] = useState("الانضمام إلى فريق العمل يتطلب تأكيداً نهائياً.");

    const handleAccept = async () => {
        try {
            setStatus("loading");
            const response = await fetch("/api/invites/accept", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || "تعذر قبول الدعوة");
            }

            // Force NextAuth session refresh to pick up new ADMIN role/type
            const updatedSession = await update();
            
            // Explicitly set activeRole in localStorage to prevent redirection to client account
            const userId = (updatedSession as any)?.user?.id;
            if (userId) {
                localStorage.setItem(`activeRole_${userId}`, 'ADMIN');
            }

            setStatus("success");
            setMessage("تم تفعيل الدعوة بنجاح. يتم توجيهك الآن إلى لوحة التحكم...");
            setTimeout(() => {
                window.location.href = "/admin/dashboard";
            }, 1500);
        } catch (error) {
            setStatus("error");
            const errorMsg = error instanceof Error ? error.message : "حدث خطأ غير متوقع";
            if (errorMsg === "Unauthorized") {
                setMessage("يجب عليك تسجيل الدخول أولاً لتتمكن من قبول هذه الدعوة.");
            } else {
                setMessage(errorMsg);
            }
        }
    };

    return (
        <div className="min-h-screen bg-bg-dark text-white flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-6 text-center">
                <span className="material-symbols-outlined !text-5xl text-emerald-400 mb-3">verified_user</span>
                <h1 className="text-lg font-bold mb-2">تفعيل دعوة فريق العمل</h1>
                <p className="text-sm text-slate-300 mb-6">{message}</p>
                <button
                    onClick={handleAccept}
                    disabled={status === "loading" || status === "success"}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl disabled:opacity-60"
                >
                    {status === "loading" ? "جار التفعيل..." : status === "success" ? "تم التفعيل" : "تفعيل الدعوة"}
                </button>
            </div>
        </div>
    );
}
