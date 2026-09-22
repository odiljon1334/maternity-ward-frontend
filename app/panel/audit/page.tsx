"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  History,
  RefreshCw,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { auditLogsApi } from "@/lib/api";

type AuditRecord = {
  id: string;
  userId?: string | null;
  hospitalId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  details?: Record<string, unknown> | null;
  ip?: string | null;
  createdAt: string;
};

type AuditResponse = {
  records: AuditRecord[];
  total: number;
  page: number;
  limit: number;
  pages: number;
};

const ACTION_LABELS: Record<string, string> = {
  LOGIN: "Kirish",
  LOGIN_FAILED: "Kirish xatosi",
  LOGOUT: "Chiqish",
  REGISTER: "Ro'yxatdan o'tkazish",
  CREATE: "Yaratish",
  UPDATE: "Tahrirlash",
  UPDATE_PHOTO: "Rasmni yangilash",
  DELETE: "O'chirish",
  FIRE: "Ishdan bo'shatish",
  IMPORT_CSV: "CSV import",
  GENERATE: "Hisoblash",
  APPROVE: "Tasdiqlash",
  EXPORT: "Eksport",
  CHANGE_PASSWORD: "Parolni o'zgartirish",
  CLEAR_LOGS: "Loglarni tozalash",
};

const ENTITY_LABELS: Record<string, string> = {
  User: "Foydalanuvchi",
  Employee: "Xodim",
  Hospital: "Muassasa",
  PayrollRecord: "Ish haqi",
  Payment: "To'lov",
  AttendanceRecord: "Davomat",
  Schedule: "Grafik",
  Department: "Bo'lim",
  Position: "Lavozim",
  TrialLead: "LEAD",
  AuditLog: "Audit log",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("uz-UZ", {
    timeZone: "Asia/Tashkent",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value));
}

function detailText(details?: Record<string, unknown> | null) {
  if (!details) return "—";
  const preferred =
    details.reason ??
    details.fullName ??
    details.filename ??
    details.username ??
    (details.deletedCount !== undefined
      ? `${String(details.deletedCount)} ta o'chirildi`
      : undefined);
  if (preferred !== undefined) return String(preferred);
  const serialized = JSON.stringify(details);
  return serialized.length > 120
    ? `${serialized.slice(0, 117)}...`
    : serialized;
}

function actionStyle(action: string) {
  if (["DELETE", "FIRE", "LOGIN_FAILED", "CLEAR_LOGS"].includes(action))
    return "border-red-500/20 bg-red-500/10 text-red-500";
  if (["CREATE", "REGISTER", "LOGIN", "APPROVE"].includes(action))
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-500";
  return "border-indigo-500/20 bg-indigo-500/10 text-indigo-500";
}

export default function PanelAuditPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [action, setAction] = useState("");
  const [entity, setEntity] = useState("");
  const [clearOpen, setClearOpen] = useState(false);
  const [clearDays, setClearDays] = useState(90);
  const limit = 25;

  const { data, isLoading, isError, isFetching, refetch } =
    useQuery<AuditResponse>({
      queryKey: ["panel-audit", action, entity, page],
      queryFn: () =>
        auditLogsApi.list({
          action: action || undefined,
          entity: entity || undefined,
          page,
          limit,
        }),
      placeholderData: (previous) => previous,
    });

  const clearMutation = useMutation({
    mutationFn: (days: number) => auditLogsApi.clearOldLogs(days),
    onSuccess: (result: { deleted?: number }) => {
      toast.success(`${result.deleted ?? 0} ta eski audit yozuvi o'chirildi`);
      setClearOpen(false);
      setPage(1);
      queryClient.invalidateQueries({ queryKey: ["panel-audit"] });
    },
    onError: () => toast.error("Audit yozuvlarini tozalab bo'lmadi"),
  });

  const records = data?.records ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.pages ?? 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[10px] font-semibold tracking-wider text-indigo-500">
            XAVFSIZLIK TARIXI
          </div>
          <h1 className="mt-1 text-[26px] font-semibold tracking-tight text-[var(--text-primary)]">
            Audit log
          </h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Tizimda bajarilgan muhim amallar va xavfsizlik hodisalari.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="btn-secondary"
          >
            <RefreshCw
              className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
            />
            Yangilash
          </button>
          <button
            onClick={() => setClearOpen(true)}
            className="btn-secondary text-red-500"
          >
            <Trash2 className="h-4 w-4" /> Eski loglarni tozalash
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Jami yozuv", value: total, icon: History },
          { label: "Joriy sahifa", value: records.length, icon: ShieldCheck },
          {
            label: "Xavfli hodisalar",
            value: records.filter((record) =>
              ["LOGIN_FAILED", "DELETE", "FIRE"].includes(record.action),
            ).length,
            icon: AlertTriangle,
          },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="card flex items-center gap-4 p-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500">
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <div className="text-xl font-semibold text-[var(--text-primary)]">
                {value}
              </div>
              <div className="text-xs text-[var(--text-muted)]">{label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card flex flex-wrap items-center gap-3 p-4">
        <select
          value={action}
          onChange={(event) => {
            setAction(event.target.value);
            setPage(1);
          }}
          className="input-field w-auto min-w-48"
        >
          <option value="">Barcha amallar</option>
          {Object.entries(ACTION_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          value={entity}
          onChange={(event) => {
            setEntity(event.target.value);
            setPage(1);
          }}
          className="input-field w-auto min-w-48"
        >
          <option value="">Barcha obyektlar</option>
          {Object.entries(ENTITY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        {(action || entity) && (
          <button
            onClick={() => {
              setAction("");
              setEntity("");
              setPage(1);
            }}
            className="btn-ghost text-xs"
          >
            Filtrlarni tozalash
          </button>
        )}
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-sm text-[var(--text-muted)]">
            Yuklanmoqda...
          </div>
        ) : isError ? (
          <div className="p-10 text-center text-sm text-red-500">
            Audit yozuvlarini yuklab bo&apos;lmadi
          </div>
        ) : records.length === 0 ? (
          <div className="p-10 text-center text-sm text-[var(--text-muted)]">
            Audit yozuvi topilmadi
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-left text-xs uppercase tracking-wider text-[var(--text-muted)]">
                  <th className="px-5 py-3 font-medium">Vaqt</th>
                  <th className="px-5 py-3 font-medium">Amal</th>
                  <th className="px-5 py-3 font-medium">Obyekt</th>
                  <th className="px-5 py-3 font-medium">Foydalanuvchi</th>
                  <th className="px-5 py-3 font-medium">Tafsilot</th>
                  <th className="px-5 py-3 font-medium">IP</th>
                </tr>
              </thead>
              <tbody className={isFetching ? "opacity-60" : ""}>
                {records.map((record) => (
                  <tr
                    key={record.id}
                    className="border-b border-[var(--border)] align-top last:border-0 hover:bg-[var(--bg-hover)]"
                  >
                    <td className="whitespace-nowrap px-5 py-3 font-mono text-xs text-[var(--text-muted)]">
                      {formatDate(record.createdAt)}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${actionStyle(record.action)}`}
                      >
                        {ACTION_LABELS[record.action] || record.action}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="text-[var(--text-primary)]">
                        {ENTITY_LABELS[record.entity] || record.entity}
                      </div>
                      {record.entityId && (
                        <div className="font-mono text-[10px] text-[var(--text-muted)]">
                          {record.entityId.slice(0, 12)}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3 text-xs text-[var(--text-muted)]">
                      {record.details?.username
                        ? `@${String(record.details.username)}`
                        : record.userId?.slice(0, 12) || "Tizim"}
                    </td>
                    <td className="max-w-[300px] px-5 py-3 text-xs text-[var(--text-muted)]">
                      <span className="block break-words">
                        {detailText(record.details)}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-[var(--text-muted)]">
                      {record.ip || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-[var(--border)] px-5 py-3">
            <span className="text-xs text-[var(--text-muted)]">
              {(page - 1) * limit + 1}–{Math.min(page * limit, total)} / {total}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1 || isFetching}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                className="btn-ghost p-1.5 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs text-[var(--text-primary)]">
                {page} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages || isFetching}
                onClick={() =>
                  setPage((value) => Math.min(totalPages, value + 1))
                }
                className="btn-ghost p-1.5 disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {clearOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="card w-full max-w-sm p-6">
            <div className="flex items-center gap-3">
              <span className="rounded-xl bg-red-500/10 p-2.5 text-red-500">
                <Trash2 className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-semibold text-[var(--text-primary)]">
                  Eski loglarni tozalash
                </h2>
                <p className="text-xs text-[var(--text-muted)]">
                  Bu amalni ortga qaytarib bo&apos;lmaydi.
                </p>
              </div>
            </div>
            <select
              value={clearDays}
              onChange={(event) => setClearDays(Number(event.target.value))}
              className="input-field mt-5"
            >
              <option value={30}>30 kundan eski</option>
              <option value={60}>60 kundan eski</option>
              <option value={90}>90 kundan eski</option>
              <option value={180}>180 kundan eski</option>
            </select>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setClearOpen(false)}
                className="btn-secondary flex-1"
              >
                Bekor qilish
              </button>
              <button
                onClick={() => clearMutation.mutate(clearDays)}
                disabled={clearMutation.isPending}
                className="flex-1 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {clearMutation.isPending ? "Tozalanmoqda..." : "Tozalash"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
