"use client";

import React, { useState } from "react";
import { FinanceQueueFilters } from "../_lib/types";

interface FinanceFiltersBarProps {
  filters: FinanceQueueFilters;
  onChange: (newFilters: FinanceQueueFilters) => void;
  onReset: () => void;
  onRefresh: () => void;
  lastRefreshedAt: Date | null;
}

export function FinanceFiltersBar({ filters, onChange, onReset, onRefresh, lastRefreshedAt }: FinanceFiltersBarProps) {
  const [localSearch, setLocalSearch] = useState(filters.search);

  const handleSelectChange = (key: keyof FinanceQueueFilters, value: any) => {
    onChange({ ...filters, [key]: value });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onChange({ ...filters, search: localSearch });
  };

  const handleCheckboxChange = (key: keyof FinanceQueueFilters, checked: boolean) => {
    onChange({ ...filters, [key]: checked });
  };

  const selectClass = "appearance-none bg-white border border-slate-200 text-slate-700 text-[13px] font-black rounded-xl px-4 py-2.5 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 cursor-pointer transition-all hover:bg-slate-50 shadow-sm";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm mb-4" dir="rtl">
      
      {/* Search & Actions Row */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-8 border-b border-slate-50 pb-6">
        
        <form onSubmit={handleSearchSubmit} className="relative w-full xl:w-[450px]">
          <input
            type="text"
            placeholder="بحث برقم الحساب، اسم العميل، رقم العملية أو الهاتف..."
            value={localSearch}
            onChange={e => setLocalSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-4 pr-12 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all font-black shadow-inner"
          />
          <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </button>
        </form>

        <div className="flex items-center gap-3">
          <button 
            type="button" 
            onClick={onReset} 
            className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-xs font-black text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm active:scale-95"
          >
            إعادة ضبط الفلاتر
          </button>
          
          <button 
            type="button" 
            onClick={onRefresh} 
            className="flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-xs font-black text-white hover:bg-blue-600 transition-all shadow-lg active:scale-95 group"
          >
            <svg className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            تحديث البيانات
          </button>
          
          {lastRefreshedAt && (
            <div className="text-[10px] font-black text-slate-400 mr-2 flex flex-col items-end">
              <span className="uppercase tracking-widest leading-none">آخر تحديث</span>
              <span className="text-blue-600 mt-1" dir="ltr">{lastRefreshedAt.toLocaleTimeString("en-US")}</span>
            </div>
          )}
        </div>
      </div>

      {/* Advanced Filters Row */}
      <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-center">
        
        {/* Checkbox Group */}
        <div className="flex flex-wrap items-center gap-6 bg-slate-50/80 px-5 py-3 rounded-2xl border border-slate-100 shadow-inner w-full lg:w-auto">
          <label className="flex items-center gap-3 cursor-pointer group select-none">
            <div className="relative flex items-center">
               <input type="checkbox" checked={filters.hasHold} onChange={e => handleCheckboxChange('hasHold', e.target.checked)} className="peer h-5 w-5 rounded-lg border-slate-300 text-blue-600 focus:ring-blue-500 transition-all" />
            </div>
            <span className="text-xs font-black text-slate-600 group-hover:text-amber-600 transition-colors">أرصدة محجوزة</span>
          </label>
          <div className="w-px h-6 bg-slate-200 hidden sm:block"></div>
          <label className="flex items-center gap-3 cursor-pointer group select-none">
            <input type="checkbox" checked={filters.hasDebt} onChange={e => handleCheckboxChange('hasDebt', e.target.checked)} className="h-5 w-5 rounded-lg border-slate-300 text-blue-600 focus:ring-blue-500 transition-all" />
            <span className="text-xs font-black text-slate-600 group-hover:text-rose-600 transition-colors">ديون معلقة</span>
          </label>
          <div className="w-px h-6 bg-slate-200 hidden sm:block"></div>
          <label className="flex items-center gap-3 cursor-pointer group select-none">
            <input type="checkbox" checked={filters.frozenOnly} onChange={e => handleCheckboxChange('frozenOnly', e.target.checked)} className="h-5 w-5 rounded-lg border-slate-300 text-rose-600 focus:ring-rose-500 transition-all" />
            <span className="text-xs font-black text-rose-600 group-hover:text-rose-700 transition-colors underline decoration-rose-200 decoration-2">مجمدة حصراً</span>
          </label>
        </div>

        {/* Dropdowns Group */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:flex-1 justify-end">
          <div className="relative group min-w-[140px]">
            <select value={filters.currency} onChange={e => handleSelectChange('currency', e.target.value)} className={selectClass}>
              <option value="ALL">جميع العملات</option>
              <option value="SYP">الليرة السورية (SYP)</option>
              <option value="USD">الدولار الأمريكي (USD)</option>
            </select>
          </div>

          <div className="relative group min-w-[170px]">
            <select value={filters.approvalStage} onChange={e => handleSelectChange('approvalStage', e.target.value)} className={selectClass}>
              <option value="ALL">مرحلة الاعتماد</option>
              <option value="NONE">بدون اعتماد</option>
              <option value="AWAITING_FIRST_REVIEW">بانتظار المراجعة (M)</option>
              <option value="AWAITING_FINAL_APPROVAL">بانتظار الصرف (A)</option>
            </select>
          </div>

          <div className="relative group min-w-[150px]">
            <select value={filters.status} onChange={e => handleSelectChange('status', e.target.value)} className={selectClass}>
              <option value="ALL">جميع الحالات</option>
              <option value="PENDING">قيد الانتظار</option>
              <option value="UNDER_REVIEW">تحت التدقيق</option>
              <option value="PROCESSING">جاري المعالجة</option>
              <option value="COMPLETED">مكتملة</option>
              <option value="FAILED">فاشلة</option>
            </select>
          </div>

          <div className="relative group min-w-[160px]">
            <select value={filters.accountClass} onChange={e => handleSelectChange('accountClass', e.target.value)} className={selectClass}>
              <option value="ALL">تصنيف الحساب</option>
              <option value="CUSTOMER">حسابات العملاء</option>
              <option value="MERCHANT">التجار والشركات</option>
              <option value="DRIVER">حسابات السائقين</option>
              <option value="GOVERNMENT">الحسابات الحكومية</option>
              <option value="INTERNAL">حسابات النظام</option>
            </select>
          </div>
        </div>

      </div>
    </div>
  );
}
