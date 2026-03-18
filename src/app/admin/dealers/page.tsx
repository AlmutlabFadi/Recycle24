"use client";

import { useState, useEffect } from "react";
import HeaderWithBack from "@/components/HeaderWithBack";

interface Dealer {
  id: string;
  name: string;
  governorate: string;
  region: string;
  address: string;
  contactPhone: string | null;
  contactWhatsapp: string | null;
  isActive: boolean;
  services: string[];
  workingHours: string | null;
  lat: number | null;
  lng: number | null;
  createdAt: string;
}

const GOVERNORATES = [
  "دمشق", "ريف دمشق", "حلب", "حمص", "حماة", 
  "اللاذقية", "طرطوس", "إدلب", "الرقة", 
  "دير الزور", "الحسكة", "درعا", "السويداء", "القنيطرة"
];

const SERVICES_OPTIONS = [
  { value: "DEPOSIT", label: "إيداع مالي" },
  { value: "WITHDRAW", label: "سحب مالي" },
  { value: "AUCTION_PAYMENT", label: "دفع تأمين مزاد" },
  { value: "INSURANCE_COLLECTION", label: "تحصيل تأمينات" },
];

export default function AdminDealersPage() {
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [loading, setLoading] = useState(true);
  const [governorateFilter, setGovernorateFilter] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentDealer, setCurrentDealer] = useState<Partial<Dealer> | null>(null);

  useEffect(() => {
    fetchDealers();
  }, [governorateFilter]);

  async function fetchDealers() {
    setLoading(true);
    try {
      const url = governorateFilter === "ALL" 
        ? "/api/admin/dealers" 
        : `/api/admin/dealers?governorate=${encodeURIComponent(governorateFilter)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setDealers(data.dealers);
      }
    } catch (error) {
      console.error("Error fetching dealers:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentDealer?.name || !currentDealer?.governorate || !currentDealer?.region || !currentDealer?.address) {
      alert("يرجى ملء جميع الحقول الإلزامية");
      return;
    }

    const method = currentDealer.id ? "PATCH" : "POST";
    const url = currentDealer.id ? `/api/admin/dealers/${currentDealer.id}` : "/api/admin/dealers";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(currentDealer),
      });
      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        setCurrentDealer(null);
        fetchDealers();
      } else {
        alert(data.error || "حدث خطأ أثناء الحفظ");
      }
    } catch (error) {
      console.error("Error saving dealer:", error);
    }
  }

  async function toggleStatus(id: string, currentStatus: boolean) {
    try {
      await fetch(`/api/admin/dealers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      fetchDealers();
    } catch (error) {
      console.error("Error toggling status:", error);
    }
  }

  async function deleteDealer(id: string) {
    if (!confirm("هل أنت متأكد من حذف هذا الوكيل؟")) return;
    try {
      await fetch(`/api/admin/dealers/${id}`, { method: "DELETE" });
      fetchDealers();
    } catch (error) {
      console.error("Error deleting dealer:", error);
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-bg-dark font-display">
      <HeaderWithBack title="إدارة شبكة الوكلاء المعتمدين" />

      <main className="flex-1 p-4 lg:max-w-7xl lg:mx-auto w-full pb-20">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-xl font-bold text-white mb-1">الوكلاء والمناطق الجغرافية</h1>
            <p className="text-xs text-slate-500">إدارة مواقع الوكلاء وتفاصيل التواصل والخدمات المقدمة.</p>
          </div>

          <div className="flex items-center gap-2">
            <select 
              title="تصفية حسب المحافظة"
              value={governorateFilter}
              onChange={(e) => setGovernorateFilter(e.target.value)}
              className="bg-surface-highlight border border-slate-800 text-white rounded-xl px-4 py-2 text-xs font-bold outline-none"
            >
              <option value="ALL">جميع المحافظات</option>
              {GOVERNORATES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>

            <button 
              onClick={() => {
                setCurrentDealer({ services: ["DEPOSIT", "WITHDRAW"], governorate: GOVERNORATES[0] });
                setIsModalOpen(true);
              }}
              className="bg-primary text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition active:scale-95"
            >
              إضافة وكيل جديد
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loading ? (
            <div className="py-20 text-center col-span-full">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary mx-auto"></div>
            </div>
          ) : dealers.length === 0 ? (
            <div className="py-20 text-center col-span-full text-slate-500">
              <span className="material-symbols-outlined !text-6xl mb-4 opacity-20">storefront</span>
              <p>لا يوجد وكلاء مسجلين حالياً</p>
            </div>
          ) : dealers.map((dealer) => (
            <div key={dealer.id} className="bg-surface-highlight border border-slate-800 rounded-[2rem] p-6 hover:border-slate-700 transition group shadow-lg">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="size-12 rounded-2xl bg-slate-800 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary">storefront</span>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">{dealer.name}</h3>
                    <p className="text-xs text-slate-500">
                      {dealer.governorate} • {dealer.region}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      setCurrentDealer(dealer);
                      setIsModalOpen(true);
                    }}
                    className="p-2 text-slate-400 hover:text-white transition"
                    title="تعديل"
                  >
                    <span className="material-symbols-outlined !text-xl">edit</span>
                  </button>
                  <button 
                    onClick={() => deleteDealer(dealer.id)}
                    className="p-2 text-slate-400 hover:text-red-500 transition"
                    title="حذف"
                  >
                    <span className="material-symbols-outlined !text-xl">delete</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="material-symbols-outlined !text-sm">location_on</span>
                  <span>{dealer.address}</span>
                </div>
                {(dealer.contactPhone || dealer.contactWhatsapp) && (
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="material-symbols-outlined !text-sm">call</span>
                    <span className="font-english">{dealer.contactPhone || dealer.contactWhatsapp}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {dealer.services.map(s => (
                  <span key={s} className="bg-slate-800 text-[9px] font-bold text-slate-300 px-2 py-0.5 rounded-md">
                    {SERVICES_OPTIONS.find(opt => opt.value === s)?.label || s}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <div className="flex items-center gap-2">
                  <div className={`size-2 rounded-full ${dealer.isActive ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                  <span className="text-[10px] text-slate-500">{dealer.isActive ? 'نشط' : 'متوقف'}</span>
                </div>
                <button 
                  onClick={() => toggleStatus(dealer.id, dealer.isActive)}
                  className={`text-[10px] font-bold px-3 py-1 rounded-lg border transition ${
                    dealer.isActive 
                      ? 'border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white' 
                      : 'border-emerald-500/30 text-emerald-500 hover:bg-emerald-500 hover:text-white'
                  }`}
                >
                  {dealer.isActive ? 'إيقاف مؤقت' : 'تفعيل'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-surface-dark border border-slate-800 w-full max-w-lg rounded-[2.5rem] overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">
                {currentDealer?.id ? "تعديل بيانات الوكيل" : "إضافة وكيل جديد"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white transition">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">اسم الوكيل / المحل *</label>
                <input 
                  type="text"
                  required
                  value={currentDealer?.name || ""}
                  onChange={(e) => setCurrentDealer({ ...currentDealer, name: e.target.value })}
                  placeholder="أدخل اسم الوكيل"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-primary transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400">المحافظة *</label>
                  <select 
                    title="المحافظة"
                    required
                    value={currentDealer?.governorate || ""}
                    onChange={(e) => setCurrentDealer({ ...currentDealer, governorate: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-primary transition appearance-none"
                  >
                    {GOVERNORATES.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400">المنطقة / الحي *</label>
                  <input 
                    type="text"
                    required
                    value={currentDealer?.region || ""}
                    onChange={(e) => setCurrentDealer({ ...currentDealer, region: e.target.value })}
                    placeholder="مثلاً: المزة"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-primary transition"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">العنوان التفصيلي *</label>
                <input 
                  type="text"
                  required
                  value={currentDealer?.address || ""}
                  onChange={(e) => setCurrentDealer({ ...currentDealer, address: e.target.value })}
                  placeholder="أدخل العنوان التفصيلي"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-primary transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400">رقم الهاتف</label>
                  <input 
                    type="text"
                    value={currentDealer?.contactPhone || ""}
                    onChange={(e) => setCurrentDealer({ ...currentDealer, contactPhone: e.target.value })}
                    placeholder="رقم التواصل"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-primary transition font-english"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400">واتساب</label>
                  <input 
                    type="text"
                    value={currentDealer?.contactWhatsapp || ""}
                    onChange={(e) => setCurrentDealer({ ...currentDealer, contactWhatsapp: e.target.value })}
                    placeholder="رقم الواتساب"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-primary transition font-english"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">أوقات العمل</label>
                <input 
                  type="text"
                  value={currentDealer?.workingHours || ""}
                  onChange={(e) => setCurrentDealer({ ...currentDealer, workingHours: e.target.value })}
                  placeholder="مثلاً: 9 AM - 8 PM"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-primary transition"
                />
              </div>

              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold text-slate-400">الخدمات المتاحة</label>
                <div className="grid grid-cols-2 gap-2">
                  {SERVICES_OPTIONS.map(opt => (
                    <label key={opt.value} className="flex items-center gap-2 p-3 rounded-xl bg-slate-800/50 cursor-pointer hover:bg-slate-800 transition">
                      <input 
                        type="checkbox"
                        checked={currentDealer?.services?.includes(opt.value)}
                        onChange={(e) => {
                          const services = currentDealer?.services || [];
                          if (e.target.checked) {
                            setCurrentDealer({ ...currentDealer, services: [...services, opt.value] });
                          } else {
                            setCurrentDealer({ ...currentDealer, services: services.filter(s => s !== opt.value) });
                          }
                        }}
                        className="accent-primary"
                      />
                      <span className="text-xs text-white">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-primary text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary/30 hover:shadow-primary/50 transition active:scale-95 mt-4"
              >
                حفظ بيانات الوكيل
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
