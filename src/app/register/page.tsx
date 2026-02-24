"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { TitleSelector, GenderSelector } from "@/components/TitleSelector";
import { Gender, getTitleDisplay } from "@/lib/title-system";

type RegisterMethod = "phone" | "email";

export default function RegisterPage() {
  const [registerMethod, setRegisterMethod] = useState<RegisterMethod>("phone");
  const [formData, setFormData] = useState({
    titleId: "",
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    userType: "TRADER" as "TRADER" | "BUYER",
    gender: "male" as Gender,
  });
  const [showPassword, setShowPassword] = useState(false);
  const { registerWithPhone, registerWithEmail, isLoading } = useAuth();
  const { addToast } = useToast();

  const handleTitleChange = (titleId: string, gender: Gender) => {
    setFormData({ ...formData, titleId, gender });
  };

  const fullName = `${formData.firstName} ${formData.lastName}`.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.firstName || !formData.lastName) {
      addToast("يرجى إدخال الاسم الكامل", "error");
      return;
    }

    if (registerMethod === "phone" && !formData.phone) {
      addToast("يرجى إدخال رقم الهاتف", "error");
      return;
    }

    if (registerMethod === "email" && !formData.email) {
      addToast("يرجى إدخال البريد الإلكتروني", "error");
      return;
    }

    if (!formData.password) {
      addToast("يرجى إدخال كلمة المرور", "error");
      return;
    }

    if (registerMethod === "phone" && formData.phone.length < 9) {
      addToast("رقم الهاتف غير صحيح", "error");
      return;
    }

    if (registerMethod === "email" && !formData.email.includes("@")) {
      addToast("البريد الإلكتروني غير صحيح", "error");
      return;
    }

    if (formData.password.length < 6) {
      addToast("كلمة المرور يجب أن تكون 6 أحرف على الأقل", "error");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      addToast("كلمتا المرور غير متطابقتين", "error");
      return;
    }

    try {
      if (registerMethod === "phone") {
        await registerWithPhone(
          formData.phone,
          formData.password,
          fullName,
          formData.userType,
          formData.titleId,
          formData.gender
        );
      } else {
        await registerWithEmail(
          formData.email,
          formData.password,
          fullName,
          formData.userType,
          formData.titleId,
          formData.gender
        );
      }
      addToast("تم إنشاء الحساب بنجاح", "success");
    } catch (err) {
      addToast(err instanceof Error ? err.message : "فشل إنشاء الحساب", "error");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-bg-dark font-display">
      <div className="flex-1 flex flex-col justify-center px-6 py-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-3">
            <span className="material-symbols-outlined text-3xl text-primary">person_add</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">إنشاء حساب جديد</h1>
          <p className="text-slate-400 text-sm">انضم إلى Metalix24 اليوم</p>
        </div>

        {/* Register Method Tabs */}
        <div className="flex bg-surface-dark rounded-xl p-1 mb-5 max-w-sm mx-auto w-full">
          <button
            type="button"
            onClick={() => setRegisterMethod("phone")}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              registerMethod === "phone"
                ? "bg-primary text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span className="material-symbols-outlined !text-[18px]">phone</span>
            رقم الهاتف
          </button>
          <button
            type="button"
            onClick={() => setRegisterMethod("email")}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              registerMethod === "email"
                ? "bg-primary text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span className="material-symbols-outlined !text-[18px]">email</span>
            البريد الإلكتروني
          </button>
        </div>

        {/* Register Form */}
        <form onSubmit={handleSubmit} className="space-y-4 max-w-sm mx-auto w-full">
          {/* Title & Name Section */}
          <div className="bg-surface-highlight border border-slate-700 rounded-xl p-4 space-y-4">
            <TitleSelector
              value={formData.titleId}
              onChange={handleTitleChange}
              label="اللقب"
            />
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-slate-400 mb-2">الاسم الأول</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="محمد"
                  className="w-full bg-surface-dark border border-slate-600 rounded-lg px-3 py-2.5 text-white placeholder-slate-500 focus:border-primary focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">اسم العائلة</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="أحمد"
                  className="w-full bg-surface-dark border border-slate-600 rounded-lg px-3 py-2.5 text-white placeholder-slate-500 focus:border-primary focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Preview of full name with title */}
            {fullName && (
              <div className="text-center p-2 bg-primary/10 rounded-lg border border-primary/30">
                <span className="text-xs text-slate-400 block mb-1">معاينة الاسم:</span>
                <span className="text-white font-semibold">{fullName}</span>
              </div>
            )}
          </div>

          {/* Phone Input */}
          {registerMethod === "phone" && (
            <div>
              <label className="block text-sm text-slate-400 mb-2">رقم الهاتف</label>
              <div className="relative">
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">
                  +963
                </span>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value.replace(/\D/g, "") })
                  }
                  placeholder="912345678"
                  maxLength={9}
                  className="w-full bg-surface-highlight border border-slate-700 rounded-xl pr-16 pl-4 py-3.5 text-white placeholder-slate-500 focus:border-primary focus:outline-none transition-colors text-center"
                />
              </div>
            </div>
          )}

          {/* Email Input */}
          {registerMethod === "email" && (
            <div>
              <label className="block text-sm text-slate-400 mb-2">البريد الإلكتروني</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="example@email.com"
                className="w-full bg-surface-highlight border border-slate-700 rounded-xl px-4 py-3.5 text-white placeholder-slate-500 focus:border-primary focus:outline-none transition-colors"
                dir="ltr"
              />
            </div>
          )}

          {/* User Type */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">نوع الحساب</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, userType: "TRADER" })}
                className={`p-3 rounded-xl border-2 transition-all text-center ${
                  formData.userType === "TRADER"
                    ? "border-primary bg-primary/10"
                    : "border-slate-700 bg-surface-highlight"
                }`}
              >
                <span className="material-symbols-outlined text-xl mb-1 block text-primary">
                  sell
                </span>
                <span className="text-white font-bold text-sm">بائع</span>
                <span className="text-slate-400 text-xs block">لدي خردة للبيع</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, userType: "BUYER" })}
                className={`p-3 rounded-xl border-2 transition-all text-center ${
                  formData.userType === "BUYER"
                    ? "border-primary bg-primary/10"
                    : "border-slate-700 bg-surface-highlight"
                }`}
              >
                <span className="material-symbols-outlined text-xl mb-1 block text-primary">
                  shopping_cart
                </span>
                <span className="text-white font-bold text-sm">مشتري</span>
                <span className="text-slate-400 text-xs block">أشتري الخردة</span>
              </button>
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">كلمة المرور</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                className="w-full bg-surface-highlight border border-slate-700 rounded-xl px-4 py-3.5 text-white placeholder-slate-500 focus:border-primary focus:outline-none transition-colors"
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
            <p className="text-xs text-slate-500 mt-1">6 أحرف على الأقل</p>
          </div>

          {/* Confirm Password Input */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">تأكيد كلمة المرور</label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData({ ...formData, confirmPassword: e.target.value })
              }
              placeholder="••••••••"
              className="w-full bg-surface-highlight border border-slate-700 rounded-xl px-4 py-3.5 text-white placeholder-slate-500 focus:border-primary focus:outline-none transition-colors"
            />
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
                جاري إنشاء الحساب...
              </>
            ) : (
              <>
                إنشاء الحساب
                <span className="material-symbols-outlined">person_add</span>
              </>
            )}
          </button>

          {/* Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-bg-dark text-slate-500">أو</span>
            </div>
          </div>

          {/* Login Link */}
          <div className="text-center">
            <span className="text-slate-400">لديك حساب بالفعل؟ </span>
            <Link href="/login" className="text-primary font-bold hover:underline">
              تسجيل الدخول
            </Link>
          </div>

          {/* Back to Home */}
          <div className="text-center pt-2">
            <Link href="/" className="text-sm text-slate-500 hover:text-slate-300 flex items-center justify-center gap-1">
              <span className="material-symbols-outlined !text-[16px]">arrow_forward</span>
              العودة للصفحة الرئيسية
            </Link>
          </div>
        </form>
      </div>

      {/* Footer */}
      <div className="px-6 py-3 text-center">
        <p className="text-xs text-slate-500">
          بالتسجيل، أنت توافق على{" "}
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
