"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Globe2,
  Inbox,
  MessageCircle,
  Phone,
  Search,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { trialLeadsApi } from "@/lib/api";

type LeadStatus = "NEW" | "CONTACTED" | "QUALIFIED" | "CONVERTED" | "REJECTED";
type LeadSource = "WEB_FORM" | "TELEGRAM_BOT";

type TrialLead = {
  id: string;
  source: LeadSource;
  status: LeadStatus;
  institutionName: string;
  contactName: string;
  phone: string;
  orgType?: string | null;
  region?: string | null;
  staffCount?: number | null;
  plan?: string | null;
  faceId?: boolean | null;
  telegramUsername?: string | null;
  createdAt: string;
};

type ApiError = {
  response?: { data?: { message?: string } };
};

const STATUS_LABELS: Record<LeadStatus, string> = {
  NEW: "Yangi",
  CONTACTED: "Bog'lanildi",
  QUALIFIED: "Saralandi",
  CONVERTED: "Mijoz bo'ldi",
  REJECTED: "Rad etildi",
};

const STATUS_STYLES: Record<LeadStatus, string> = {
  NEW: "border-blue-500/20 bg-blue-500/10 text-blue-500",
  CONTACTED: "border-amber-500/20 bg-amber-500/10 text-amber-500",
  QUALIFIED: "border-violet-500/20 bg-violet-500/10 text-violet-500",
  CONVERTED: "border-emerald-500/20 bg-emerald-500/10 text-emerald-500",
  REJECTED: "border-red-500/20 bg-red-500/10 text-red-500",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("uz-UZ", {
    timeZone: "Asia/Tashkent",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function PanelLeadsPage() {
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [source, setSource] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const limit = 20;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["trial-leads", search, source, status, page],
    queryFn: () =>
      trialLeadsApi.list({
        search: search || undefined,
        source: source || undefined,
        status: status || undefined,
        page,
        limit,
      }),
  });

  const { data: stats } = useQuery({
    queryKey: ["trial-lead-stats"],
    queryFn: trialLeadsApi.stats,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, nextStatus }: { id: string; nextStatus: LeadStatus }) =>
      trialLeadsApi.updateStatus(id, nextStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trial-leads"] });
      queryClient.invalidateQueries({ queryKey: ["trial-lead-stats"] });
      toast.success("So'rov holati yangilandi");
    },
    onError: (error: ApiError) =>
      toast.error(error.response?.data?.message || "Holatni yangilab bo'lmadi"),
  });

  const leads = (data?.data ?? []) as TrialLead[];
  const meta = data?.meta ?? { total: 0, page: 1, totalPages: 1 };
  const counts = stats?.byStatus ?? {};

  function handleSearch(value: string) {
    setSearchInput(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(value.trim());
      setPage(1);
    }, 350);
  }

  const cards = [
    {
      label: "Jami so'rovlar",
      value: stats?.total ?? 0,
      icon: Inbox,
      color: "text-indigo-500",
    },
    {
      label: "Yangi",
      value: counts.NEW ?? 0,
      icon: Clock3,
      color: "text-blue-500",
    },
    {
      label: "Jarayonda",
      value: (counts.CONTACTED ?? 0) + (counts.QUALIFIED ?? 0),
      icon: Users,
      color: "text-amber-500",
    },
    {
      label: "Mijoz bo'ldi",
      value: counts.CONVERTED ?? 0,
      icon: CheckCircle2,
      color: "text-emerald-500",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="text-[10px] font-semibold tracking-wider text-indigo-500">
          SOTUV VA RO&apos;YXATDAN O&apos;TISH
        </div>
        <h1 className="mt-1 text-[26px] font-semibold tracking-tight text-[var(--text-primary)]">
          Yangi so&apos;rovlar
        </h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Veb-sayt va Telegram orqali kelgan trial so&apos;rovlarini kuzating.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card flex items-center gap-4 p-4">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--bg-hover)]">
              <Icon className={`h-5 w-5 ${color}`} />
            </span>
            <div>
              <div className="text-2xl font-semibold text-[var(--text-primary)]">
                {value}
              </div>
              <div className="text-xs text-[var(--text-muted)]">{label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card flex flex-wrap items-center gap-3 p-4">
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            value={searchInput}
            onChange={(event) => handleSearch(event.target.value)}
            placeholder="Muassasa, ism yoki telefon..."
            className="input-field pl-9"
          />
        </div>
        <select
          value={source}
          onChange={(event) => {
            setSource(event.target.value);
            setPage(1);
          }}
          className="input-field w-auto"
        >
          <option value="">Barcha manbalar</option>
          <option value="WEB_FORM">Veb-sayt</option>
          <option value="TELEGRAM_BOT">Telegram</option>
        </select>
        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
          }}
          className="input-field w-auto"
        >
          <option value="">Barcha holatlar</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-sm text-[var(--text-muted)]">
            Yuklanmoqda...
          </div>
        ) : isError ? (
          <div className="p-10 text-center text-sm text-red-500">
            So&apos;rovlarni yuklab bo&apos;lmadi
          </div>
        ) : leads.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-10 text-center">
            <Inbox className="h-8 w-8 text-[var(--text-muted)]" />
            <p className="text-sm text-[var(--text-muted)]">
              So&apos;rovlar topilmadi
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-left text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                  <th className="px-5 py-3">Muassasa</th>
                  <th className="px-5 py-3">Bog&apos;lanish</th>
                  <th className="px-5 py-3">Manba</th>
                  <th className="px-5 py-3">Ehtiyoj</th>
                  <th className="px-5 py-3">Kelgan vaqt</th>
                  <th className="px-5 py-3">Holat</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="border-b border-[var(--border)] align-top last:border-0 hover:bg-[var(--bg-hover)]"
                  >
                    <td className="px-5 py-4">
                      <div className="font-medium text-[var(--text-primary)]">
                        {lead.institutionName}
                      </div>
                      <div className="mt-0.5 text-xs text-[var(--text-muted)]">
                        {[lead.region, lead.orgType]
                          .filter(Boolean)
                          .join(" · ") || "Hudud ko'rsatilmagan"}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-medium text-[var(--text-primary)]">
                        {lead.contactName}
                      </div>
                      <a
                        href={`tel:${lead.phone}`}
                        className="mt-1 flex items-center gap-1 text-xs text-indigo-500 hover:underline"
                      >
                        <Phone className="h-3 w-3" /> {lead.phone}
                      </a>
                      {lead.telegramUsername && (
                        <div className="mt-1 text-xs text-[var(--text-muted)]">
                          @{lead.telegramUsername}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] px-2.5 py-1 text-xs text-[var(--text-primary)]">
                        {lead.source === "WEB_FORM" ? (
                          <Globe2 className="h-3.5 w-3.5" />
                        ) : (
                          <MessageCircle className="h-3.5 w-3.5" />
                        )}
                        {lead.source === "WEB_FORM" ? "Veb-sayt" : "Telegram"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-[var(--text-muted)]">
                      <div>
                        {lead.staffCount
                          ? `${lead.staffCount} xodim`
                          : "Xodimlar soni noma'lum"}
                      </div>
                      <div className="mt-1">
                        Tarif: {lead.plan || "kelishiladi"}
                      </div>
                      {lead.faceId != null && (
                        <div className="mt-1">
                          FaceID: {lead.faceId ? "kerak" : "kerak emas"}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4 text-xs text-[var(--text-muted)]">
                      {formatDate(lead.createdAt)}
                    </td>
                    <td className="px-5 py-4">
                      <select
                        value={lead.status}
                        disabled={statusMutation.isPending}
                        onChange={(event) =>
                          statusMutation.mutate({
                            id: lead.id,
                            nextStatus: event.target.value as LeadStatus,
                          })
                        }
                        className={`rounded-full border px-2.5 py-1.5 text-xs font-medium outline-none ${STATUS_STYLES[lead.status]}`}
                      >
                        {Object.entries(STATUS_LABELS).map(([value, label]) => (
                          <option
                            key={value}
                            value={value}
                            className="bg-[var(--bg-card)] text-[var(--text-primary)]"
                          >
                            {label}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-[var(--border)] px-5 py-3">
            <span className="text-xs text-[var(--text-muted)]">
              Jami: {meta.total}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                className="rounded-lg border border-[var(--border)] p-1.5 text-[var(--text-muted)] disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs text-[var(--text-primary)]">
                {page} / {meta.totalPages}
              </span>
              <button
                disabled={page >= meta.totalPages}
                onClick={() =>
                  setPage((value) => Math.min(meta.totalPages, value + 1))
                }
                className="rounded-lg border border-[var(--border)] p-1.5 text-[var(--text-muted)] disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
