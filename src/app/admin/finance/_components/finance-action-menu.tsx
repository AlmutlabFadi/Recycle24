"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { PermissionContext } from "../_lib/permissions";
import * as permissions from "../_lib/permissions";
import { FinanceActionCapability, getActionCapabilities } from "../_lib/actions";

interface FinanceActionMenuProps {
  context: PermissionContext;
  recordId: string;
  recordType: "REQUEST" | "ACCOUNT" | "HOLD" | "DEBT" | "RESTRICTION";
  onSelectAction: (actionType: string, recordId: string) => void;
  inline?: boolean;
  isOpen?: boolean;
  onToggle?: () => void;
  onClose?: () => void;
}

export function FinanceActionMenu({ 
  context, 
  recordId, 
  recordType, 
  onSelectAction, 
  inline = false,
  isOpen: externalIsOpen,
  onToggle,
  onClose
}: FinanceActionMenuProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, direction: 'down' as 'down' | 'up' });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const updatePosition = () => {
        if (!buttonRef.current) return;
        const rect = buttonRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const dropdownHeight = 280; 
        
        let direction: 'down' | 'up' = 'down';
        let top = rect.bottom + window.scrollY + 8;
        
        if (spaceBelow < dropdownHeight && rect.top > dropdownHeight) {
          direction = 'up';
          top = rect.top + window.scrollY - 8;
        }

        setCoords({
          top,
          left: rect.right + window.scrollX,
          direction
        });
      };

      updatePosition();
      
      // Listen to scroll events on any scrollable container
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isOpen]);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggle) {
      onToggle();
    } else {
      setInternalIsOpen(!internalIsOpen);
    }
  };

  const handleClose = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (onClose) {
      onClose();
    } else {
      setInternalIsOpen(false);
    }
  };

  const capabilities: FinanceActionCapability[] = [];

  if (recordType === "REQUEST") {
    capabilities.push(getActionCapabilities({
      actionType: "APPROVE_FIRST_STAGE", label: "موافقة على المرحلة الأولى",
      requiresReason: false, requiresConfirmation: true, tone: "primary",
      canExecute: permissions.canApproveFirstStage(context)
    }));
    capabilities.push(getActionCapabilities({
      actionType: "APPROVE_FINAL_STAGE", label: "اعتماد نهائي (صرف)",
      requiresReason: false, requiresConfirmation: true, tone: "primary",
      canExecute: permissions.canApproveFinalStage(context)
    }));
    capabilities.push(getActionCapabilities({
      actionType: "REJECT", label: "رفض الطلب نهائياً",
      requiresReason: true, requiresConfirmation: true, tone: "danger",
      canExecute: permissions.canRejectRequest(context)
    }));
    capabilities.push(getActionCapabilities({
      actionType: "MARK_FAILED", label: "وسم كعملية فاشلة",
      requiresReason: true, requiresConfirmation: true, tone: "danger",
      canExecute: permissions.canMarkFailed(context)
    }));
  }

  capabilities.push(getActionCapabilities({
    actionType: "ADD_INTERNAL_NOTE", label: "إضافة ملاحظة إدارية",
    requiresReason: true, requiresConfirmation: false, tone: "neutral",
    canExecute: permissions.canAddInternalNote(context)
  }));

  if (recordType === "ACCOUNT" || recordType === "REQUEST") {
    capabilities.push(getActionCapabilities({
      actionType: "FREEZE_DEBIT", label: "تجميد الخصم (منع سحب)",
      requiresReason: true, requiresConfirmation: true, tone: "warning",
      canExecute: permissions.canFreezeDebit(context)
    }));
  }

  const activeCapabilities = capabilities.filter(c => c.isEnabled || c.disabledReason);

  if (activeCapabilities.length === 0) {
    return <span className="text-[10px] font-bold text-slate-400 px-2 py-1">لا صلاحيات</span>;
  }

  if (inline) {
    return (
      <div className="flex flex-wrap gap-2">
        {activeCapabilities.map(cap => (
          <button
            key={cap.actionType}
            onClick={(e) => { e.stopPropagation(); cap.isEnabled && onSelectAction(cap.actionType, recordId); }}
            disabled={!cap.isEnabled}
            title={cap.disabledReason}
            className={`rounded px-3 py-1.5 text-xs font-black transition-all shadow-sm ${
              cap.isEnabled 
                ? getToneClasses(cap.tone)
                : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200 opacity-60'
            }`}
          >
            {cap.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="relative inline-block text-right">
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        className={`group inline-flex items-center justify-center rounded-lg border px-3 py-2 text-xs font-black transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
          isOpen 
            ? 'bg-blue-600 border-blue-600 text-white shadow-md' 
            : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-blue-300 shadow-sm'
        }`}
      >
        الخيارات
        <svg className={`mr-1.5 h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-white' : 'text-slate-400'}`} viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
        </svg>
      </button>

      {mounted && isOpen && createPortal(
        <div dir="rtl" className="finance-portal-dropdown">
          <div className="fixed inset-0 z-[9998]" onClick={handleClose}></div>
          <div 
            className="absolute z-[9999] w-56 rounded-xl bg-white p-1.5 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] ring-1 ring-slate-200 focus:outline-none animate-in fade-in zoom-in duration-150"
            style={{ 
              top: coords.top, 
              left: coords.left,
              transform: coords.direction === 'down' ? 'translateX(-100%)' : 'translateX(-100%) translateY(-100%)',
              transformOrigin: coords.direction === 'down' ? 'top right' : 'bottom right'
            }}
          >
            <div className="px-3 py-2 border-b border-slate-100 mb-1.5">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">إجراءات إدارية</span>
            </div>
            <div className="space-y-0.5">
              {activeCapabilities.map(cap => (
                <button
                  key={cap.actionType}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (cap.isEnabled) {
                      handleClose();
                      onSelectAction(cap.actionType, recordId);
                    }
                  }}
                  disabled={!cap.isEnabled}
                  title={cap.disabledReason}
                  className={`block w-full text-right px-3 py-2.5 text-xs font-black rounded-lg transition-all ${
                    cap.isEnabled
                      ? 'text-slate-700 hover:bg-blue-50 hover:text-blue-700'
                      : 'text-slate-300 cursor-not-allowed bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{cap.label}</span>
                    {cap.tone === 'danger' && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-sm"></span>}
                    {cap.tone === 'warning' && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-sm"></span>}
                    {cap.tone === 'primary' && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-sm"></span>}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

function getToneClasses(tone: string) {
  switch (tone) {
    case 'primary': return 'bg-blue-600 text-white hover:bg-blue-700 border border-blue-600 shadow-blue-200';
    case 'danger': return 'bg-rose-600 text-white hover:bg-rose-700 border border-rose-600 shadow-rose-200';
    case 'warning': return 'bg-amber-500 text-white hover:bg-amber-600 border border-amber-500 shadow-amber-200';
    default: return 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50';
  }
}
