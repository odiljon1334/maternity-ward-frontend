"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth";
import { useRouter } from "next/navigation";
import { auditLogsApi } from "@/lib/api";
import {
  Shield, LogIn, LogOut, UserPlus, Pencil, Trash2,
  FileUp, DollarSign, ChevronLeft, ChevronRight,
  Search, AlertTriangle, RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

// ─── Action badge config ──────────────────────────
const ACTION_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  LOGIN:           { label: "Kirish",             color: "bg-green-500/10 text-green-400 border-green-500/20",   icon: LogIn },
  LOGIN_FAILED:    { label: "Kirish xato",        color: "bg-red-500/10 text-red-400 border-red-500/20",        icon: AlertTriangle },
  LOGOUT:          { label: "Chiqish",            color: "bg-gray-500/10 text-gray-400 border-gray-500/20",     icon: LogOut },
  REGISTER:        { label: "Ro'yxat",            color: "bg-blue-500/10 text-blue-400 border-blue-500/20",     icon: UserPlus },
  CREATE:          { label: "Yaratish",           color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20", icon: UserPlus },
  UPDATE:          { label: "Tahrirlash",         color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20", icon: Pencil },
  UPDATE_PHOTO:    { label: "Rasm",               color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20", icon: Pencil },
  DELETE:          { label: "O'chirish",          color: "bg-red-500/10 text-red-400 border-red-500/20",        icon: Trash2 },
  FIRE:            { label: "Ishdan bo'shatish",  color: "bg-orange-500/10 text-orange-400 border-orange-500/20", icon: Trash2 },
  IMPORT_CSV:      { label: "CSV import",         color: "bg-purple-500/10 text-purple-400 border-purple-500/20", icon: FileUp },
  GENERATE:        { label: "Hisoblash",          color: "bg-teal-500/10 text-teal-400 border-teal-500/20",     icon: DollarSign },
  APPROVE:         { label: "Tasdiqlash",         color: "bg-green-500/10 text-green-400 border-green-500/20",  icon: Shield },
  CHANGE_PASSWORD: { label: "Parol o'zgartirish", color: "bg-pink-500/10 text-pink-400 border-pink-500/20",     icon: Shield },
  CLEAR_LOGS:      { label: "Log tozalash",       color: "bg-red-500/10 text-red-400 border-red-500/20",        icon: Trash2 },
};

const ENTITY_LABELS: Record<string, string> = {
  User:          "Foydalanuvchi",
  Employee:      "Xodim",
  PayrollRecord: "Maosh",
  Schedule:      "Grafik",
  Department:    "Bo'lim",
  Position:      "Lavozim",
  AuditLog:      "Audit log",
};

const ACTIONS   = Object.keys(ACTION_CONFIG);
const ENTITIES  = Object.keys(ENTITY_LABELS);
const PAGE_SIZE = 20;

const CLEAR_OPTIONS = [
  { label: "30 kundan eski",  days: 30 },
  { label: "60 kundan eski",  days: 60 },
  { label: "90 kundan eski",  days: 90 },
  { label: "180 kundan eski", days: 180 },
];

function ActionBadge({ action }: { action: string }) {
  const cfg = ACTION_CONFIG[action] ?? {
    label: action, color: "bg-gray-500/10 text-gray-400 border-gray-500/20", icon: Shield,
  };
  const Icon = cfg.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border", cfg.color)}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("uz-UZ", { day: "2-digit", month: "2-digit", year: "numeric" })
    + " " + d.toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export default function AuditLogsPage() {
  const { user } = useAuthStore();
  const router   = useRouter();
  const qc       = useQueryClient();

  const [page, setPage]               = useState(1);
  const [actionFilter, setActionFilter] = useState("");
  const [entityFilter, setEntityFilter] = useState("");
  const [clearModal, setClearModal]   = useState(false);
  const [clearDays, setClearDays]     = useState(90);

  // ── Hooks dan keyin role check ──────────────────
  if (user && user.role !== "SUPER_ADMIN") {
    router.replace("/dashboard");
    return null;
  }

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["audit-logs", page, actionFilter, entityFilter],
    queryFn: () =>
      auditLogsApi.list({
        page,
        limit: PAGE_SIZE,
        action: actionFilter || undefined,
        entity: entityFilter || undefined,
      }),
    staleTime: 0,           // har doim fresh fetch
    placeholderData: (prev) => prev,
  });

  const clearMutation = useMutation({
    mutationFn: (days: number) => auditLogsApi.clearOldLogs(days),
    onSuccess: (result: any) => {
      toast.success(`${result?.deleted ?? 0} ta log o'chirildi`);
      setClearModal(false);
      qc.invalidateQueries({ queryKey: ["audit-logs"] });
    },
    onError: () => toast.error("O'chirishda xato"),
  });

  const logs: any[]   = data?.records ?? [];
  const total: number = data?.total   ?? 0;
  const pages: number = data?.pages   ?? 1;

  const handleFilterChange = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLSelectElement>) => {
    setter(e.target.value);
    setPage(1);
  };

  return (
    <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="w-6 h-6 text-indigo-400" />
            Audit Log
          </h1>
          <p className="text-sm text-gray-400 mt-1">Tizimda amalga oshirilgan barcha amallar</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-50 text-gray-300 text-sm transition-colors"
          >
            <RefreshCw className={cn("w-4 h-4", isFetching && "animate-spin")} />
            Yangilash
          </button>
          <button
            onClick={() => setClearModal(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-sm transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Eski loglarni tozalash
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <select
            value={actionFilter}
            onChange={handleFilterChange(setActionFilter)}
            className="pl-9 pr-4 py-2 rounded-lg bg-[var(--card-bg)] border border-[var(--border)] text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none cursor-pointer"
          >
            <option value="">Barcha amallar</option>
            {ACTIONS.map((a) => (
              <option key={a} value={a}>{ACTION_CONFIG[a]?.label ?? a}</option>
            ))}
          </select>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <select
            value={entityFilter}
            onChange={handleFilterChange(setEntityFilter)}
            className="pl-9 pr-4 py-2 rounded-lg bg-[var(--card-bg)] border border-[var(--border)] text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none cursor-pointer"
          >
            <option value="">Barcha ob'ektlar</option>
            {ENTITIES.map((e) => (
              <option key={e} value={e}>{ENTITY_LABELS[e] ?? e}</option>
            ))}
          </select>
        </div>

        {(actionFilter || entityFilter) && (
          <button
            onClick={() => { setActionFilter(""); setEntityFilter(""); setPage(1); }}
            className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm hover:bg-red-500/20 transition-colors"
          >
            Filtrni tozalash
          </button>
        )}

        <span className="ml-auto flex items-center text-sm text-gray-400">
          Jami: <strong className="ml-1 text-white">{total}</strong> ta yozuv
        </span>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[var(--border)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white/5 border-b border-[var(--border)]">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Vaqt</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Amal</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Ob'ekt</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Foydalanuvchi</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Tafsilot</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-white/5 rounded w-24" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                    <Shield className="w-10 h-10 mx-auto mb-2 opacity-20" />
                    Hech qanday yozuv topilmadi
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className={cn("transition-colors hover:bg-white/5", isFetching && "opacity-60")}>
                    <td className="px-4 py-3 text-gray-300 whitespace-nowrap font-mono text-xs">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <ActionBadge action={log.action} />
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-gray-300">{ENTITY_LABELS[log.entity] ?? log.entity}</span>
                      {log.entityId && (
                        <span className="block text-xs text-gray-600 font-mono mt-0.5">
                          {log.entityId.slice(0, 8)}...
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {log.details?.username ? (
                        <div>
                          <span className="text-white font-medium">{log.details.username}</span>
                          {log.details?.role && (
                            <span className="ml-1 text-xs text-gray-500">({log.details.role})</span>
                          )}
                        </div>
                      ) : log.userId ? (
                        <span className="text-gray-500 font-mono text-xs">{log.userId.slice(0, 8)}...</span>
                      ) : (
                        <span className="text-gray-600">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 max-w-[200px]">
                      {log.details ? (
                        <span className="text-xs text-gray-400 truncate block">
                          {log.details.reason
                            ? <span className="text-red-400">{log.details.reason}</span>
                            : log.details.fullName ?? log.details.filename
                            ?? (log.details.imported !== undefined ? `${log.details.imported} ta import` : null)
                            ?? (log.details.deletedCount !== undefined ? `${log.details.deletedCount} ta o'chirildi` : null)
                            ?? JSON.stringify(log.details).slice(0, 40)}
                        </span>
                      ) : (
                        <span className="text-gray-600">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">
                      {log.ip ?? "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">
            {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} / {total}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || isFetching}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-white" />
            </button>
            <span className="text-sm text-white">{page} / {pages}</span>
            <button
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              disabled={page === pages || isFetching}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      )}

      {/* Clear old logs modal */}
      {clearModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a2035] border border-[var(--border)] rounded-xl p-6 w-full max-w-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Eski loglarni tozalash</h3>
                <p className="text-xs text-gray-400">Bu amal qaytarib bo'lmaydi</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-400">Qaysi loglarni o'chirish:</p>
              <div className="grid grid-cols-2 gap-2">
                {CLEAR_OPTIONS.map((opt) => (
                  <button
                    key={opt.days}
                    onClick={() => setClearDays(opt.days)}
                    className={cn(
                      "px-3 py-2 rounded-lg text-sm border transition-colors",
                      clearDays === opt.days
                        ? "bg-red-500/20 border-red-500/40 text-red-300"
                        : "bg-white/5 border-[var(--border)] text-gray-400 hover:bg-white/10"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setClearModal(false)}
                className="flex-1 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-sm transition-colors"
              >
                Bekor qilish
              </button>
              <button
                onClick={() => clearMutation.mutate(clearDays)}
                disabled={clearMutation.isPending}
                className="flex-1 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-medium transition-colors"
              >
                {clearMutation.isPending ? "O'chirilmoqda..." : "O'chirish"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
