"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";

type LoginMethod = "phone" | "email";

export default function LoginPage() {
  const [loginMethod, setLoginMethod] = useState<LoginMethod>("phone");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { loginWithPhone, loginWithEmail, isLoading } = useAuth();
  const { addToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // التحقق من البيانات
    if (loginMethod === "phone" && !phone) {
      addToast("يرجى إدخال رقم الهاتف", "error");
      return;
    }

    if (loginMethod === "email" && !email) {
      addToast("يرجى إدخال البريد الإلكتروني", "error");
      return;
    }

    if (!password) {
      addToast("يرجى إدخال كلمة المرور", "error");
      return;
    }

    if (loginMethod === "phone" && phone.length < 9) {
      addToast("رقم الهاتف غير صحيح", "error");
      return;
    }

    if (loginMethod === "email" && !email.includes("@")) {
      addToast("البريد الإلكتروني غير صحيح", "error");
      return;
    }

    try {
      if (loginMethod === "phone") {
        await loginWithPhone(phone, password);
      } else {
        await loginWithEmail(email, password);
      }
      addToast("تم تسجيل الدخول بنجاح", "success");
    } catch (err) {
      addToast(err instanceof Error ? err.message : "فشل تسجيل الدخول", "error");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-bg-dark font-display">
      <div className="flex-1 flex flex-col justify-center px-6 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-4xl text-primary">recycling</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Metalix24</h1>
          <p className="text-slate-400">تسجيل الدخول إلى حسابك</p>
        </div>

        {/* Login Method Tabs */}
        <div className="flex bg-surface-dark rounded-xl p-1 mb-6 max-w-sm mx-auto w-full">
          <button
            type="button"
            onClick={() => setLoginMethod("phone")}
            className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              loginMethod === "phone"
                ? "bg-primary text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span className="material-symbols-outlined !text-[18px]">phone</span>
            رقم الهاتف
          </button>
          <button
            type="button"
            onClick={() => setLoginMethod("email")}
            className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              loginMethod === "email"
                ? "bg-primary text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span className="material-symbols-outlined !text-[18px]">email</span>
            البريد الإلكتروني
          </button>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 max-w-sm mx-auto w-full">
          {/* Phone Input */}
          {loginMethod === "phone" && (
            <div>
              <label className="block text-sm text-slate-400 mb-2">رقم الهاتف</label>
              <div className="relative">
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">
                  +963
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  placeholder="912345678"
                  maxLength={9}
                  className="w-full bg-surface-highlight border border-slate-700 rounded-xl pr-16 pl-4 py-4 text-white placeholder-slate-500 focus:border-primary focus:outline-none transition-colors text-lg text-center"
                />
              </div>
            </div>
          )}

          {/* Email Input */}
          {loginMethod === "email" && (
            <div>
              <label className="block text-sm text-slate-400 mb-2">البريد الإلكتروني</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                className="w-full bg-surface-highlight border border-slate-700 rounded-xl px-4 py-4 text-white placeholder-slate-500 focus:border-primary focus:outline-none transition-colors text-lg"
                dir="ltr"
              />
            </div>
          )}

          {/* Password Input */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">كلمة المرور</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-surface-highlight border border-slate-700 rounded-xl px-4 py-4 text-white placeholder-slate-500 focus:border-primary focus:outline-none transition-colors text-lg"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <span className="material-symbols-outlined">
                  {showPassword ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>
          </div>

          {/* Forgot Password */}
          <div className="text-left">
            <Link href="/forgot-password" className="text-sm text-primary hover:underline">
              نسيت كلمة المرور؟
            </Link>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 rounded-xl bg-primary text-white font-bold text-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                جاري تسجيل الدخول...
              </>
            ) : (
              <>
                تسجيل الدخول
                <span className="material-symbols-outlined">login</span>
              </>
            )}
          </button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-bg-dark text-slate-500">أو</span>
            </div>
          </div>

          {/* Register Link */}
          <div className="text-center">
            <span className="text-slate-400">ليس لديك حساب؟ </span>
            <Link href="/register" className="text-primary font-bold hover:underline">
              سجل الآن
            </Link>
          </div>

          {/* Back to Home */}
          <div className="text-center pt-4">
            <Link href="/" className="text-sm text-slate-500 hover:text-slate-300 flex items-center justify-center gap-1">
              <span className="material-symbols-outlined !text-[16px]">arrow_forward</span>
              العودة للصفحة الرئيسية
            </Link>
          </div>
        </form>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 text-center">
        <p className="text-xs text-slate-500">
          بتسجيل الدخول، أنت توافق على{" "}
          <Link href="/terms" className="text-primary hover:underline">
            شروط الاستخدام
          </Link>{" "}
          و{" "}
          <Link href="/privacy" className="text-primary hover:underline">
            سياسة الخصوصية
          </Link>
        </p>
      </div>
    </div>
  );
}
