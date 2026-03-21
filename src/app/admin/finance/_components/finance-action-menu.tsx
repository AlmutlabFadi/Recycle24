"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import type { FinanceRequestType } from "../_lib/types";
import type { PermissionContext } from "../_lib/permissions";
import * as permissions from "../_lib/permissions";
import {
  type FinanceActionCapability,
  getActionCapabilities,
} from "../_lib/actions";

interface FinanceActionMenuProps {
  context: PermissionContext;
  recordId: string;
  recordType: "REQUEST" | "ACCOUNT" | "HOLD" | "DEBT" | "RESTRICTION";
  requestType?: FinanceRequestType | null;
  onSelectAction: (
    actionType: string,
    recordId: string,
    options?: {
      recordType?: "REQUEST" | "ACCOUNT" | "HOLD" | "DEBT" | "RESTRICTION";
      requestType?: FinanceRequestType | null;
    },
  ) => void;
  inline?: boolean;
  isOpen?: boolean;
  onToggle?: () => void;
  onClose?: () => void;
}

export function FinanceActionMenu({
  context,
  recordId,
  recordType,
  requestType = null,
  onSelectAction,
  inline = false,
  isOpen: externalIsOpen,
  onToggle,
  onClose,
}: FinanceActionMenuProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;

  const buttonRef = useRef<HTMLButtonElement>(null);
  const [coords, setCoords] = useState({
    top: 0,
    left: 0,
    direction: "down" as "down" | "up",
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen || !buttonRef.current) {
      return;
    }

    const updatePosition = () => {
      if (!buttonRef.current) {
        return;
      }

      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const dropdownHeight = 280;

      let direction: "down" | "up" = "down";
      let top = rect.bottom + window.scrollY + 8;

      if (spaceBelow < dropdownHeight && rect.top > dropdownHeight) {
        direction = "up";
        top = rect.top + window.scrollY - 8;
      }

      setCoords({
        top,
        left: rect.right + window.scrollX,
        direction,
      });
    };

    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen]);

  const handleToggle = (event: React.MouseEvent) => {
    event.stopPropagation();

    if (onToggle) {
      onToggle();
      return;
    }

    setInternalIsOpen((prev) => !prev);
  };

  const handleClose = (event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }

    if (onClose) {
      onClose();
      return;
    }

    setInternalIsOpen(false);
  };

  const capabilities = useMemo<FinanceActionCapability[]>(() => {
    const items: FinanceActionCapability[] = [];

    if (recordType === "REQUEST") {
      items.push(
        getActionCapabilities(
          {
            actionType: "APPROVE_FIRST_STAGE",
            label: "موافقة على المرحلة الأولى",
            requiresReason: false,
            requiresConfirmation: true,
            tone: "primary",
            canExecute: permissions.canApproveFirstStage(context),
          },
          { requestType },
        ),
      );

      items.push(
        getActionCapabilities(
          {
            actionType: "APPROVE_FINAL_STAGE",
            label: "اعتماد نهائي",
            requiresReason: false,
            requiresConfirmation: true,
            tone: "primary",
            canExecute: permissions.canApproveFinalStage(context),
          },
          { requestType },
        ),
      );

      items.push(
        getActionCapabilities(
          {
            actionType: "REJECT",
            label: "رفض الطلب",
            requiresReason: true,
            requiresConfirmation: true,
            tone: "danger",
            canExecute: permissions.canRejectRequest(context),
          },
          { requestType },
        ),
      );

      items.push(
        getActionCapabilities(
          {
            actionType: "MARK_FAILED",
            label: "وسم كعملية فاشلة",
            requiresReason: true,
            requiresConfirmation: true,
            tone: "danger",
            canExecute: permissions.canMarkFailed(context),
          },
          { requestType },
        ),
      );
    }

    items.push(
      getActionCapabilities(
        {
          actionType: "ADD_INTERNAL_NOTE",
          label: "إضافة ملاحظة إدارية",
          requiresReason: true,
          requiresConfirmation: false,
          tone: "neutral",
          canExecute: permissions.canAddInternalNote(context),
        },
        { requestType },
      ),
    );

    if (recordType === "ACCOUNT" || recordType === "REQUEST") {
      items.push(
        getActionCapabilities(
          {
            actionType: "FREEZE_DEBIT",
            label: "تجميد الخصم",
            requiresReason: true,
            requiresConfirmation: true,
            tone: "warning",
            canExecute: permissions.canFreezeDebit(context),
          },
          { requestType },
        ),
      );
    }

    return items.filter((item) => item.isEnabled || item.disabledReason);
  }, [context, recordType, requestType]);

  if (capabilities.length === 0) {
    return (
      <span className="px-2 py-1 text-[10px] font-bold text-slate-400">
        لا صلاحيات
      </span>
    );
  }

  const triggerAction = (actionType: string) => {
    onSelectAction(actionType, recordId, {
      recordType,
      requestType,
    });
  };

  if (inline) {
    return (
      <div className="flex flex-wrap gap-2">
        {capabilities.map((capability) => (
          <button
            key={capability.actionType}
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              if (capability.isEnabled) {
                triggerAction(capability.actionType);
              }
            }}
            disabled={!capability.isEnabled}
            title={capability.disabledReason ?? undefined}
            className={`rounded px-3 py-1.5 text-xs font-black transition-all shadow-sm ${
              capability.isEnabled
                ? getToneClasses(capability.tone)
                : "cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400 opacity-60"
            }`}
          >
            {capability.label}
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
            ? "border-blue-600 bg-blue-600 text-white shadow-md"
            : "border-slate-300 bg-white text-slate-700 shadow-sm hover:border-blue-300 hover:bg-slate-50"
        }`}
      >
        الخيارات
        <svg
          className={`mr-1.5 h-4 w-4 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-white" : "text-slate-400"
          }`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {mounted &&
        isOpen &&
        createPortal(
          <div dir="rtl" className="finance-portal-dropdown">
            <div
              className="fixed inset-0 z-[9998]"
              onClick={handleClose}
            />
            <div
              className="absolute z-[9999] w-56 rounded-xl bg-white p-1.5 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] ring-1 ring-slate-200 focus:outline-none animate-in fade-in zoom-in duration-150"
              style={{
                top: coords.top,
                left: coords.left,
                transform:
                  coords.direction === "down"
                    ? "translateX(-100%)"
                    : "translateX(-100%) translateY(-100%)",
                transformOrigin:
                  coords.direction === "down" ? "top right" : "bottom right",
              }}
            >
              <div className="mb-1.5 border-b border-slate-100 px-3 py-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  إجراءات إدارية
                </span>
              </div>

              <div className="space-y-0.5">
                {capabilities.map((capability) => (
                  <button
                    key={capability.actionType}
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();

                      if (!capability.isEnabled) {
                        return;
                      }

                      handleClose();
                      triggerAction(capability.actionType);
                    }}
                    disabled={!capability.isEnabled}
                    title={capability.disabledReason ?? undefined}
                    className={`block w-full rounded-lg px-3 py-2.5 text-right text-xs font-black transition-all ${
                      capability.isEnabled
                        ? "text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                        : "cursor-not-allowed bg-slate-50/50 text-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{capability.label}</span>
                      {capability.tone === "danger" && (
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shadow-sm" />
                      )}
                      {capability.tone === "warning" && (
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shadow-sm" />
                      )}
                      {capability.tone === "primary" && (
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shadow-sm" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

function getToneClasses(tone: string) {
  switch (tone) {
    case "primary":
      return "border border-blue-600 bg-blue-600 text-white shadow-blue-200 hover:bg-blue-700";
    case "danger":
      return "border border-rose-600 bg-rose-600 text-white shadow-rose-200 hover:bg-rose-700";
    case "warning":
      return "border border-amber-500 bg-amber-500 text-white shadow-amber-200 hover:bg-amber-600";
    default:
      return "border-slate-300 bg-white text-slate-700 hover:bg-slate-50";
  }
}