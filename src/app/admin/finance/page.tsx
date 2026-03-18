"use client";

import { useEffect, useMemo, useState } from "react";

type FinanceRequestUser = {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  isLocked: boolean;
  lockReason: string | null;
};

type DepositRequestItem = {
  id: string;
  amount: number;
  currency: string;
  method: string;
  status: string;
  approvalStage: string;
  reviewedById: string | null;
  reviewedAt: string | null;
  approvedById: string | null;
  approvedAt: string | null;
  requestNote: string | null;
  reviewNote: string | null;
  proofUrl: string | null;
  createdAt: string;
  completedAt: string | null;
  user: FinanceRequestUser;
};

type PayoutRequestItem = {
  id: string;
  amount: number;
  currency: string;
  method: string;
  destination: string;
  status: string;
  approvalStage: string;
  reviewedById: string | null;
  reviewedAt: string | null;
  approvedById: string | null;
  approvedAt: string | null;
  requestNote: string | null;
  reviewNote: string | null;
  createdAt: string;
  completedAt: string | null;
  processedAt: string | null;
  failureReason: string | null;
  user: FinanceRequestUser;
};

type TransferRequestItem = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  referenceNote: string | null;
  reviewNote: string | null;
  reviewedById: string | null;
  reviewedAt: string | null;
  completedAt: string | null;
  failedAt: string | null;
  createdAt: string;
  updatedAt: string;
  sender: FinanceRequestUser;
  receiver: FinanceRequestUser;
};

type FinanceApiResponse<T> = {
  success: boolean;
  items: T[];
  summary?: {
    totalCount: number;
    byStatus: Array<{
      status: string;
      approvalStage: string;
      count: number;
    }>;
  };
  error?: string;
};

type ActiveTab = "all" | "awaiting-final" | "pending-first" | "deposits" | "payouts" | "transfers";

type CurrencyFilter = "ALL" | "SYP" | "USD";

function formatAmount(amount: number, currency: string) {
  return `${amount.toLocaleString()} ${currency}`;
}

function formatDate(value: string | null) {
  if (!value) {
    return "—";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString();
}

function badgeClasses(kind: "pending" | "review" | "approved" | "rejected" | "neutral") {
  switch (kind) {
    case "pending":
      return "bg-amber-100 text-amber-800 border border-amber-200";
    case "review":
      return "bg-blue-100 text-blue-800 border border-blue-200";
    case "approved":
      return "bg-emerald-100 text-emerald-800 border border-emerald-200";
    case "rejected":
      return "bg-rose-100 text-rose-800 border border-rose-200";
    default:
      return "bg-slate-100 text-slate-800 border border-slate-200";
  }
}

function statusBadge(status: string) {
  const normalized = status.toUpperCase();

  if (normalized === "PENDING") return badgeClasses("pending");
  if (normalized === "UNDER_REVIEW") return badgeClasses("review");
  if (normalized === "COMPLETED") return badgeClasses("approved");
  if (normalized === "REJECTED" || normalized === "FAILED") return badgeClasses("rejected");

  return badgeClasses("neutral");
}

function approvalStageBadge(stage: string) {
  const normalized = (stage || "NONE").toUpperCase();

  if (normalized === "AWAITING_FINAL_APPROVAL") return badgeClasses("review");
  if (normalized === "FINAL_APPROVED") return badgeClasses("approved");
  if (normalized === "FINAL_REJECTED" || normalized === "REJECTED") return badgeClasses("rejected");

  return badgeClasses("neutral");
}

function SummaryCard(props: {
  title: string;
  value: string | number;
  subtitle: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-sm text-slate-500">{props.title}</div>
      <div className="mt-2 text-2xl font-semibold text-slate-900">{props.value}</div>
      <div className="mt-1 text-xs text-slate-500">{props.subtitle}</div>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
      {label}
    </div>
  );
}

function ActionButton(props: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  tone?: "primary" | "danger" | "neutral";
}) {
  const toneClass =
    props.tone === "danger"
      ? "border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100"
      : props.tone === "primary"
      ? "border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100"
      : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100";

  return (
    <button
      type="button"
      onClick={props.onClick}
      disabled={props.disabled}
      className={`rounded-xl border px-3 py-2 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${toneClass}`}
    >
      {props.label}
    </button>
  );
}

export default function AdminFinancePage() {
  const [depositItems, setDepositItems] = useState<DepositRequestItem[]>([]);
  const [payoutItems, setPayoutItems] = useState<PayoutRequestItem[]>([]);
  const [transferItems, setTransferItems] = useState<TransferRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("awaiting-final");
  const [currencyFilter, setCurrencyFilter] = useState<CurrencyFilter>("ALL");
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});

  async function loadData() {
    setLoading(true);
    setError(null);
    const errors: string[] = [];

    // Fetch each endpoint independently so one failure doesn't block others
    try {
      const depositResponse = await fetch("/api/admin/finance/deposit-requests?status=ALL&take=50", { cache: "no-store" });
      const depositJson = (await depositResponse.json()) as FinanceApiResponse<DepositRequestItem>;
      if (depositResponse.ok) {
        setDepositItems(depositJson.items ?? []);
      } else {
        errors.push(depositJson.error ?? "Failed to load deposit requests");
      }
    } catch {
      errors.push("Failed to load deposit requests");
    }

    try {
      const payoutResponse = await fetch("/api/admin/finance/payout-requests?status=ALL&take=50", { cache: "no-store" });
      const payoutJson = (await payoutResponse.json()) as FinanceApiResponse<PayoutRequestItem>;
      if (payoutResponse.ok) {
        setPayoutItems(payoutJson.items ?? []);
      } else {
        errors.push(payoutJson.error ?? "Failed to load payout requests");
      }
    } catch {
      errors.push("Failed to load payout requests");
    }

    try {
      const transferResponse = await fetch("/api/admin/finance/transfer-requests?status=ALL&take=50", { cache: "no-store" });
      const transferJson = (await transferResponse.json()) as FinanceApiResponse<TransferRequestItem>;
      if (transferResponse.ok) {
        setTransferItems(transferJson.items ?? []);
      } else {
        errors.push(transferJson.error ?? "Failed to load transfer requests");
      }
    } catch {
      errors.push("Failed to load transfer requests");
    }

    if (errors.length > 0) {
      setError(errors.join(" | "));
    }
    setLoading(false);
  }

  useEffect(() => {
    void loadData();
  }, []);

  const filteredDepositItems = useMemo(
    () => depositItems.filter(i => currencyFilter === "ALL" || i.currency === currencyFilter),
    [depositItems, currencyFilter]
  );

  const filteredPayoutItems = useMemo(
    () => payoutItems.filter(i => currencyFilter === "ALL" || i.currency === currencyFilter),
    [payoutItems, currencyFilter]
  );

  const filteredTransferItems = useMemo(
    () => transferItems.filter(i => currencyFilter === "ALL" || i.currency === currencyFilter),
    [transferItems, currencyFilter]
  );

  const depositAwaitingFinal = useMemo(
    () =>
      filteredDepositItems.filter(
        (item) =>
          item.status === "UNDER_REVIEW" &&
          item.approvalStage === "AWAITING_FINAL_APPROVAL"
      ),
    [filteredDepositItems]
  );

  const payoutAwaitingFinal = useMemo(
    () =>
      filteredPayoutItems.filter(
        (item) =>
          item.status === "UNDER_REVIEW" &&
          item.approvalStage === "AWAITING_FINAL_APPROVAL"
      ),
    [filteredPayoutItems]
  );

  const depositPending = useMemo(
    () => filteredDepositItems.filter((item) => item.status === "PENDING"),
    [filteredDepositItems]
  );

  const payoutPending = useMemo(
    () => filteredPayoutItems.filter((item) => item.status === "PENDING"),
    [filteredPayoutItems]
  );

  const transferPending = useMemo(
    () => filteredTransferItems.filter((item) => item.status === "PENDING"),
    [filteredTransferItems]
  );

  const visibleDeposits = useMemo(() => {
    switch (activeTab) {
      case "awaiting-final":
        return depositAwaitingFinal;
      case "pending-first":
        return depositPending;
      case "deposits":
        return filteredDepositItems;
      case "payouts":
        return [];
      default:
        return filteredDepositItems;
    }
  }, [activeTab, depositAwaitingFinal, depositPending, filteredDepositItems]);

  const visiblePayouts = useMemo(() => {
    switch (activeTab) {
      case "awaiting-final":
        return payoutAwaitingFinal;
      case "pending-first":
        return payoutPending;
      case "payouts":
        return filteredPayoutItems;
      case "deposits":
        return [];
      default:
        return filteredPayoutItems;
    }
  }, [activeTab, payoutAwaitingFinal, payoutPending, filteredPayoutItems]);

  const visibleTransfers = useMemo(() => {
    switch (activeTab) {
      case "awaiting-final":
        return [];
      case "pending-first":
        return transferPending;
      case "transfers":
        return filteredTransferItems;
      case "deposits":
      case "payouts":
        return [];
      default:
        return filteredTransferItems;
    }
  }, [activeTab, transferPending, filteredTransferItems]);

  function getReviewNote(id: string) {
    return reviewNotes[id] ?? "";
  }

  function setReviewNote(id: string, value: string) {
    setReviewNotes((current) => ({
      ...current,
      [id]: value,
    }));
  }

  async function submitDepositApprove(id: string) {
    try {
      setBusyKey(`deposit-approve-${id}`);
      setError(null);

      const response = await fetch(`/api/admin/finance/deposit-requests/${id}/approve`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          reviewNote: getReviewNote(id) || undefined,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to approve deposit request");
      }

      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Deposit approval failed");
    } finally {
      setBusyKey(null);
    }
  }

  async function submitDepositReject(id: string) {
    try {
      setBusyKey(`deposit-reject-${id}`);
      setError(null);

      const reviewNote = getReviewNote(id);

      if (!reviewNote.trim()) {
        throw new Error("Review note is required before rejecting a deposit request");
      }

      const response = await fetch(`/api/admin/finance/deposit-requests/${id}/reject`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          reviewNote,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to reject deposit request");
      }

      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Deposit rejection failed");
    } finally {
      setBusyKey(null);
    }
  }

  async function submitPayoutApprove(id: string) {
    try {
      setBusyKey(`payout-approve-${id}`);
      setError(null);

      const response = await fetch(`/api/admin/finance/payout-requests/${id}/approve`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          reviewNote: getReviewNote(id) || undefined,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to approve payout request");
      }

      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payout approval failed");
    } finally {
      setBusyKey(null);
    }
  }

  async function submitPayoutReject(id: string) {
    try {
      setBusyKey(`payout-reject-${id}`);
      setError(null);

      const reviewNote = getReviewNote(id);

      if (!reviewNote.trim()) {
        throw new Error("Review note is required before rejecting a payout request");
      }

      const response = await fetch(`/api/admin/finance/payout-requests/${id}/reject`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          reviewNote,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to reject payout request");
      }

      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payout rejection failed");
    } finally {
      setBusyKey(null);
    }
  }

  async function submitTransferApprove(id: string) {
    try {
      setBusyKey(`transfer-approve-${id}`);
      setError(null);

      const response = await fetch(`/api/admin/finance/transfer-requests/${id}/approve`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          reviewNote: getReviewNote(id) || undefined,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to approve transfer request");
      }

      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transfer approval failed");
    } finally {
      setBusyKey(null);
    }
  }

  async function submitTransferReject(id: string) {
    try {
      setBusyKey(`transfer-reject-${id}`);
      setError(null);

      const reviewNote = getReviewNote(id);

      if (!reviewNote.trim()) {
        throw new Error("Review note is required before rejecting a transfer request");
      }

      const response = await fetch(`/api/admin/finance/transfer-requests/${id}/reject`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          reviewNote,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to reject transfer request");
      }

      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transfer rejection failed");
    } finally {
      setBusyKey(null);
    }
  }

  function tabButton(tab: ActiveTab, label: string) {
    const active = activeTab === tab;

    return (
      <button
        type="button"
        onClick={() => setActiveTab(tab)}
        className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
          active
            ? "bg-slate-900 text-white"
            : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
        }`}
      >
        {label}
      </button>
    );
  }

  function renderDepositCard(item: DepositRequestItem) {
    const approveBusy = busyKey === `deposit-approve-${item.id}`;
    const rejectBusy = busyKey === `deposit-reject-${item.id}`;
    const canAct = item.status === "PENDING" || item.status === "UNDER_REVIEW";

    return (
      <div key={`deposit-${item.id}`} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:shadow-md hover:border-blue-200 hover:-translate-y-0.5">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="text-sm text-slate-500">Deposit Request</div>
            <div className="mt-1 text-lg font-semibold text-slate-900">
              {formatAmount(item.amount, item.currency)}
            </div>
            <div className="mt-1 text-sm text-slate-600">
              {item.user.name ?? "Unknown user"} — {item.user.phone ?? item.user.email ?? "No contact"}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusBadge(item.status)}`}>
              {item.status}
            </span>
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${approvalStageBadge(item.approvalStage)}`}>
              {item.approvalStage || "NONE"}
            </span>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-400">Method</div>
            <div className="mt-1 text-sm text-slate-800">{item.method}</div>
          </div>

          <div>
            <div className="text-xs uppercase tracking-wide text-slate-400">Proof</div>
            <div className="mt-1 text-sm text-slate-800">{item.proofUrl ? "Attached" : "None"}</div>
          </div>

          <div>
            <div className="text-xs uppercase tracking-wide text-slate-400">Created</div>
            <div className="mt-1 text-sm text-slate-800">{formatDate(item.createdAt)}</div>
          </div>

          <div>
            <div className="text-xs uppercase tracking-wide text-slate-400">Completed</div>
            <div className="mt-1 text-sm text-slate-800">{formatDate(item.completedAt)}</div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-400">First Reviewer</div>
            <div className="mt-1 text-sm text-slate-800">{item.reviewedById ?? "—"}</div>
            <div className="text-xs text-slate-500">{formatDate(item.reviewedAt)}</div>
          </div>

          <div>
            <div className="text-xs uppercase tracking-wide text-slate-400">Final Approver</div>
            <div className="mt-1 text-sm text-slate-800">{item.approvedById ?? "—"}</div>
            <div className="text-xs text-slate-500">{formatDate(item.approvedAt)}</div>
          </div>

          <div>
            <div className="text-xs uppercase tracking-wide text-slate-400">Request Note</div>
            <div className="mt-1 text-sm text-slate-800">{item.requestNote ?? "—"}</div>
          </div>

          <div>
            <div className="text-xs uppercase tracking-wide text-slate-400">Review Note</div>
            <div className="mt-1 text-sm text-slate-800">{item.reviewNote ?? "—"}</div>
          </div>
        </div>

        <div className="mt-4">
          <label className="mb-2 block text-xs uppercase tracking-wide text-slate-400">
            Action Review Note
          </label>
          <textarea
            value={getReviewNote(item.id)}
            onChange={(event) => setReviewNote(item.id, event.target.value)}
            rows={3}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none ring-0 transition focus:border-slate-500"
            placeholder="Enter review note. Required for reject. Recommended for approvals."
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <ActionButton
            label={approveBusy ? "Processing..." : item.approvalStage === "AWAITING_FINAL_APPROVAL" ? "Final Approve Deposit" : "Approve Deposit"}
            onClick={() => void submitDepositApprove(item.id)}
            disabled={!canAct || approveBusy || rejectBusy}
            tone="primary"
          />
          <ActionButton
            label={rejectBusy ? "Rejecting..." : "Reject Deposit"}
            onClick={() => void submitDepositReject(item.id)}
            disabled={!canAct || approveBusy || rejectBusy}
            tone="danger"
          />
        </div>

        {item.user.isLocked ? (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            User account is locked. {item.user.lockReason ?? ""}
          </div>
        ) : null}
      </div>
    );
  }

  function renderPayoutCard(item: PayoutRequestItem) {
    const approveBusy = busyKey === `payout-approve-${item.id}`;
    const rejectBusy = busyKey === `payout-reject-${item.id}`;
    const canAct = item.status === "PENDING" || item.status === "UNDER_REVIEW";

    return (
      <div key={`payout-${item.id}`} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:shadow-md hover:border-purple-200 hover:-translate-y-0.5">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="text-sm text-slate-500">Payout Request</div>
            <div className="mt-1 text-lg font-semibold text-slate-900">
              {formatAmount(item.amount, item.currency)}
            </div>
            <div className="mt-1 text-sm text-slate-600">
              {item.user.name ?? "Unknown user"} — {item.user.phone ?? item.user.email ?? "No contact"}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusBadge(item.status)}`}>
              {item.status}
            </span>
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${approvalStageBadge(item.approvalStage)}`}>
              {item.approvalStage || "NONE"}
            </span>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-400">Method</div>
            <div className="mt-1 text-sm text-slate-800">{item.method}</div>
          </div>

          <div>
            <div className="text-xs uppercase tracking-wide text-slate-400">Destination</div>
            <div className="mt-1 break-all text-sm text-slate-800">{item.destination}</div>
          </div>

          <div>
            <div className="text-xs uppercase tracking-wide text-slate-400">Created</div>
            <div className="mt-1 text-sm text-slate-800">{formatDate(item.createdAt)}</div>
          </div>

          <div>
            <div className="text-xs uppercase tracking-wide text-slate-400">Completed</div>
            <div className="mt-1 text-sm text-slate-800">{formatDate(item.completedAt)}</div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-400">First Reviewer</div>
            <div className="mt-1 text-sm text-slate-800">{item.reviewedById ?? "—"}</div>
            <div className="text-xs text-slate-500">{formatDate(item.reviewedAt)}</div>
          </div>

          <div>
            <div className="text-xs uppercase tracking-wide text-slate-400">Final Approver</div>
            <div className="mt-1 text-sm text-slate-800">{item.approvedById ?? "—"}</div>
            <div className="text-xs text-slate-500">{formatDate(item.approvedAt)}</div>
          </div>

          <div>
            <div className="text-xs uppercase tracking-wide text-slate-400">Request Note</div>
            <div className="mt-1 text-sm text-slate-800">{item.requestNote ?? "—"}</div>
          </div>

          <div>
            <div className="text-xs uppercase tracking-wide text-slate-400">Review Note</div>
            <div className="mt-1 text-sm text-slate-800">{item.reviewNote ?? "—"}</div>
          </div>
        </div>

        <div className="mt-4">
          <label className="mb-2 block text-xs uppercase tracking-wide text-slate-400">
            Action Review Note
          </label>
          <textarea
            value={getReviewNote(item.id)}
            onChange={(event) => setReviewNote(item.id, event.target.value)}
            rows={3}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none ring-0 transition focus:border-slate-500"
            placeholder="Enter review note. Required for reject."
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <ActionButton
            label={approveBusy ? "Processing..." : item.approvalStage === "AWAITING_FINAL_APPROVAL" ? "Final Approve Payout" : "Approve Payout"}
            onClick={() => void submitPayoutApprove(item.id)}
            disabled={!canAct || approveBusy || rejectBusy}
            tone="primary"
          />
          <ActionButton
            label={rejectBusy ? "Rejecting..." : "Reject Payout"}
            onClick={() => void submitPayoutReject(item.id)}
            disabled={!canAct || approveBusy || rejectBusy}
            tone="danger"
          />
        </div>

        {item.user.isLocked ? (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            User account is locked. {item.user.lockReason ?? ""}
          </div>
        ) : null}

        {item.failureReason ? (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            Failure reason: {item.failureReason}
          </div>
        ) : null}
      </div>
    );
  }

  function renderTransferCard(item: TransferRequestItem) {
    const approveBusy = busyKey === `transfer-approve-${item.id}`;
    const rejectBusy = busyKey === `transfer-reject-${item.id}`;
    const canAct = item.status === "PENDING";

    return (
      <div key={`transfer-${item.id}`} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:shadow-md hover:border-amber-200 hover:-translate-y-0.5">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="text-sm text-slate-500">Transfer Request</div>
            <div className="mt-1 text-lg font-semibold text-slate-900">
              {formatAmount(item.amount, item.currency)}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusBadge(item.status)}`}>
              {item.status}
            </span>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-400">Sender</div>
            <div className="mt-1 text-sm text-slate-800">{item.sender?.name || item.sender?.phone || item.sender?.email || "Unknown"}</div>
          </div>

          <div>
            <div className="text-xs uppercase tracking-wide text-slate-400">Receiver</div>
            <div className="mt-1 text-sm text-slate-800">{item.receiver?.name || item.receiver?.phone || item.receiver?.email || "Unknown"}</div>
          </div>

          <div>
            <div className="text-xs uppercase tracking-wide text-slate-400">Created</div>
            <div className="mt-1 text-sm text-slate-800">{formatDate(item.createdAt)}</div>
          </div>

          <div>
            <div className="text-xs uppercase tracking-wide text-slate-400">Completed</div>
            <div className="mt-1 text-sm text-slate-800">{formatDate(item.completedAt)}</div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-400">Approver</div>
            <div className="mt-1 text-sm text-slate-800">{item.reviewedById ?? "—"}</div>
            <div className="text-xs text-slate-500">{formatDate(item.reviewedAt)}</div>
          </div>

          <div className="col-span-2">
            <div className="text-xs uppercase tracking-wide text-slate-400">Reference Note</div>
            <div className="mt-1 text-sm text-slate-800">{item.referenceNote ?? "—"}</div>
          </div>

          <div>
            <div className="text-xs uppercase tracking-wide text-slate-400">Review Note</div>
            <div className="mt-1 text-sm text-slate-800">{item.reviewNote ?? "—"}</div>
          </div>
        </div>

        {canAct && (
          <div className="mt-4">
            <label className="mb-2 block text-xs uppercase tracking-wide text-slate-400">
              Action Review Note
            </label>
            <textarea
              value={getReviewNote(item.id)}
              onChange={(event) => setReviewNote(item.id, event.target.value)}
              rows={3}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none ring-0 transition focus:border-slate-500"
              placeholder="Enter review note. Required for reject."
            />
          </div>
        )}

        {canAct && (
          <div className="mt-4 flex flex-wrap gap-2">
            <ActionButton
              label={approveBusy ? "Processing..." : "Approve Transfer"}
              onClick={() => void submitTransferApprove(item.id)}
              disabled={approveBusy || rejectBusy}
              tone="primary"
            />
            <ActionButton
              label={rejectBusy ? "Rejecting..." : "Reject Transfer"}
              onClick={() => void submitTransferReject(item.id)}
              disabled={approveBusy || rejectBusy}
              tone="danger"
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">Finance Control Panel</h1>
            <p className="mt-1 text-sm text-slate-500">
              Operate pending wallet requests and enforce maker-checker approval flow.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadData()}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-100"
          >
            Refresh
          </button>
        </div>

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Pending Deposits"
            value={depositPending.length}
            subtitle="New deposit requests waiting for first review"
          />
          <SummaryCard
            title="Pending Payouts"
            value={payoutPending.length}
            subtitle="New payout requests waiting for first review"
          />
          <SummaryCard
            title="Pending Transfers"
            value={transferPending.length}
            subtitle="Internal P2P transfers waiting for approval"
          />
          <SummaryCard
            title="Deposits Awaiting Final Approval"
            value={depositAwaitingFinal.length}
            subtitle="Large deposits blocked until second approver signs"
          />
          <SummaryCard
            title="Payouts Awaiting Final Approval"
            value={payoutAwaitingFinal.length}
            subtitle="Large payouts blocked until second approver signs"
          />
        </section>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <section className="flex flex-wrap gap-2">
            {tabButton("awaiting-final", "Awaiting Final Approval")}
            {tabButton("pending-first", "Pending First Review")}
            {tabButton("deposits", "All Deposits")}
            {tabButton("payouts", "All Payouts")}
            {tabButton("transfers", "All Transfers")}
            {tabButton("all", "All Requests")}
          </section>

          <div className="flex items-center gap-2 rounded-xl bg-slate-200/50 p-1">
            <button
              onClick={() => setCurrencyFilter("ALL")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${currencyFilter === "ALL" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
            >
              All Currencies
            </button>
            <button
              onClick={() => setCurrencyFilter("SYP")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${currencyFilter === "SYP" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
            >
              SYP (ل.س)
            </button>
            <button
              onClick={() => setCurrencyFilter("USD")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${currencyFilter === "USD" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
            >
              USD ($)
            </button>
          </div>
        </div>

        {loading ? <EmptyState label="Loading finance requests..." /> : null}

        {!loading && activeTab === "awaiting-final" ? (
          <section className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Awaiting Final Approval</h2>
              <p className="text-sm text-slate-500">
                High-value requests staged by the first reviewer and waiting for a second finance admin.
              </p>
            </div>

            {depositAwaitingFinal.length === 0 && payoutAwaitingFinal.length === 0 ? (
              <EmptyState label="No requests are currently awaiting final approval." />
            ) : (
              <div className="grid gap-4">
                {depositAwaitingFinal.map(renderDepositCard)}
                {payoutAwaitingFinal.map(renderPayoutCard)}
              </div>
            )}
          </section>
        ) : null}

        {!loading && activeTab === "pending-first" ? (
          <section className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Pending First Review</h2>
              <p className="text-sm text-slate-500">
                Requests untouched by finance operations.
              </p>
            </div>

            {depositPending.length === 0 && payoutPending.length === 0 && transferPending.length === 0 ? (
              <EmptyState label="No requests are currently waiting for first review." />
            ) : (
              <div className="grid gap-4">
                {depositPending.map(renderDepositCard)}
                {payoutPending.map(renderPayoutCard)}
                {transferPending.map(renderTransferCard)}
              </div>
            )}
          </section>
        ) : null}

        {!loading && (activeTab === "deposits" || activeTab === "all") ? (
          <section className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Deposit Requests</h2>
              <p className="text-sm text-slate-500">
                Full deposit feed with direct approval and rejection actions.
              </p>
            </div>

            {visibleDeposits.length === 0 ? (
              <EmptyState label="No deposit requests found." />
            ) : (
              <div className="grid gap-4">{visibleDeposits.map(renderDepositCard)}</div>
            )}
          </section>
        ) : null}

        {!loading && (activeTab === "payouts" || activeTab === "all") ? (
          <section className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Payout Requests</h2>
              <p className="text-sm text-slate-500">
                Full payout feed with direct approval and rejection actions.
              </p>
            </div>

            {visiblePayouts.length === 0 ? (
              <EmptyState label="No payout requests found." />
            ) : (
              <div className="grid gap-4">{visiblePayouts.map(renderPayoutCard)}</div>
            )}
          </section>
        ) : null}

        {!loading && (activeTab === "transfers" || activeTab === "all") ? (
          <section className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Transfer Requests</h2>
              <p className="text-sm text-slate-500">
                Full transfer feed with direct approval and rejection actions.
              </p>
            </div>

            {visibleTransfers.length === 0 ? (
              <EmptyState label="No transfer requests found." />
            ) : (
              <div className="grid gap-4">{visibleTransfers.map(renderTransferCard)}</div>
            )}
          </section>
        ) : null}
      </div>
    </main>
  );
}
