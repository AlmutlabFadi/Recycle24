"use client";

import { useState, useEffect } from "react";
import HeaderWithBack from "@/components/HeaderWithBack";
import Link from "next/link";

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
}

const GOVERNORATES = [
  "دمشق", "ريف دمشق", "حلب", "حمص", "حماة", 
  "اللاذقية", "طرطوس", "إدلب", "الرقة", 
  "دير الزور", "الحسكة", "درعا", "السويداء", "القنيطرة"
];

const SERVICE_LABELS: Record<string, string> = {
  DEPOSIT: "إيداع",
  WITHDRAW: "سحب",
  AUCTION_PAYMENT: "تأمين مزادات",
  INSURANCE_COLLECTION: "تأمينات",
};

export default function DealersSearchPage() {
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchDealers();
  }, [filter]);

  async function fetchDealers() {
    setLoading(true);
    try {
      const url = filter === "ALL" 
        ? "/api/wallet/dealers" 
        : `/api/wallet/dealers?governorate=${encodeURIComponent(filter)}`;
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

  const filteredDealers = dealers.filter(d => 
    d.name.includes(searchQuery) || 
    d.region.includes(searchQuery) || 
    d.address.includes(searchQuery)
  );

  return (
    <div className="flex flex-col min-h-screen bg-bg-dark font-display">
      <HeaderWithBack title="شبكة الوكلاء المعتمدين" />

      {/* Filters Area */}
      <div className="bg-surface-dark border-b border-slate-800 p-4 sticky top-[64px] z-30">
        <div className="flex flex-col gap-3">
          {/* Governorate Select */}
          <div className="relative">
            <select 
              title="اختر المحافظة"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm font-bold outline-none appearance-none focus:border-primary transition"
            >
              <option value="ALL">جميع المحافظات</option>
              {GOVERNORATES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
              expand_more
            </span>
          </div>

          {/* Search Input */}
          <div className="relative">
            <input 
              type="text"
              placeholder="ابحث باسم الوكيل أو المنطقة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl pr-10 pl-4 py-3 text-sm focus:border-primary outline-none transition"
            />
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
              search
            </span>
          </div>
        </div>
      </div>

      <main className="flex-1 p-4 pb-24">
        {loading ? (
          <div className="py-20 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary mx-auto"></div>
          </div>
        ) : filteredDealers.length === 0 ? (
          <div className="py-20 text-center text-slate-500">
            <span className="material-symbols-outlined text-6xl mb-4 opacity-20">location_off</span>
            <p>لا يوجد وكلاء يطابقون بحثك</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredDealers.map((dealer) => (
              <div key={dealer.id} className="bg-surface-dark border border-slate-800 rounded-3xl p-5 shadow-lg relative overflow-hidden group">
                {/* Visual Accent */}
                <div className="absolute top-0 right-0 w-2 h-full bg-gradient-to-b from-primary to-secondary opacity-20"></div>
                
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1 group-hover:text-primary transition-colors">{dealer.name}</h3>
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded uppercase">
                         {dealer.governorate}
                       </span>
                       <span className="text-[10px] text-slate-500">{dealer.region}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {dealer.contactWhatsapp && (
                      <a 
                        href={`https://wa.me/${dealer.contactWhatsapp.replace(/\+/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="size-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition shadow-sm"
                      >
                         <span className="material-symbols-outlined !text-[20px]">chat</span>
                      </a>
                    )}
                    {dealer.contactPhone && (
                      <a 
                        href={`tel:${dealer.contactPhone}`}
                        className="size-10 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center hover:bg-blue-500 hover:text-white transition shadow-sm"
                      >
                         <span className="material-symbols-outlined !text-[20px]">call</span>
                      </a>
                    )}
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-start gap-2 text-xs text-slate-400">
                    <span className="material-symbols-outlined !text-sm mt-0.5">location_on</span>
                    <span className="leading-relaxed">{dealer.address}</span>
                  </div>
                  {dealer.workingHours && (
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="material-symbols-outlined !text-sm">schedule</span>
                      <span>{dealer.workingHours}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-800/50">
                  {dealer.services.map(s => (
                    <div key={s} className="flex items-center gap-1.5 bg-slate-800/50 px-3 py-1.5 rounded-xl border border-slate-700/30">
                      <div className="size-1.5 rounded-full bg-emerald-500"></div>
                      <span className="text-[10px] font-bold text-slate-300">
                        {SERVICE_LABELS[s] || s}
                      </span>
                    </div>
                  ))}
                </div>
                
                {/* Navigation Button (Placeholder if lat/lng exists) */}
                {dealer.lat && dealer.lng && (
                   <a 
                     href={`https://www.google.com/maps?q=${dealer.lat},${dealer.lng}`}
                     target="_blank"
                     rel="noopener noreferrer"
                     className="mt-4 w-full flex items-center justify-center gap-2 py-3 bg-slate-800 text-white text-xs font-bold rounded-xl border border-slate-700 hover:bg-slate-700 transition"
                   >
                     <span className="material-symbols-outlined !text-sm">directions</span>
                     عرض الاتجاهات
                   </a>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
      
      {/* Help Banner */}
      <div className="fixed bottom-24 left-4 right-4 z-20">
         <div className="bg-gradient-to-r from-slate-900 to-bg-dark border border-slate-700/50 p-4 rounded-2xl shadow-2xl flex items-center gap-4">
            <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
               <span className="material-symbols-outlined text-primary">info</span>
            </div>
            <div>
               <p className="text-xs font-bold text-white">تحتاج مساعدة؟</p>
               <p className="text-[10px] text-slate-400">تواصل مع الدعم الفني لمزيد من المعلومات حول أقرب وكيل لك.</p>
            </div>
         </div>
      </div>
    </div>
  );
}
