"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Send, Search, UserPlus, X, AlertTriangle, Link2, Link2Off } from "lucide-react";
import { employeesApi, telegramApi } from "@/lib/api";
import { useConfirmation } from "@/components/ui";

/**
 * HR Telegram botga kim ulana olishini boshqarish (2026-09-23).
 *
 * Ulanish endi faqat Telegram tasdiqlagan raqam ("📱 Raqamni ulashish")
 * orqali va faqat shu ro'yxatdagi xodimlar uchun ishlaydi.
 *
 * - DIRECTOR/ADMIN: `hospitalId` yuborilmaydi — backend JWT'dan oladi.
 * - SUPER_ADMIN/ASSISTANT_ADMIN: tanlangan muassasa `hospitalId` sifatida.
 */
interface EmployeeHit {
  id: string;
  fullName: string;
  phone: string | null;
  position?: { name: string } | null;
}

type ApiError = { response?: { data?: { message?: string } } };

export function TelegramBotAccessPanel({
  hospitalId,
  sendHospitalId,
}: {
  hospitalId?: string;
  sendHospitalId: boolean;
}) {
  const qc = useQueryClient();
  const { confirm } = useConfirmation();
  const [search, setSearch] = useState("");
  const scopeId = sendHospitalId ? hospitalId : undefined;
  const queryKey = ["telegram-bot-access", hospitalId];

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => telegramApi.botAccess(scopeId),
    enabled: !!hospitalId,
    staleTime: 30_000,
  });

  const term = search.trim();
  const { data: found = [], isFetching: searching } = useQuery({
    queryKey: ["telegram-bot-access-search", hospitalId, term],
    queryFn: () =>
      employeesApi
        .list({ search: term, limit: 8, ...(scopeId ? { targetHospitalId: scopeId } : {}) })
        .then((r: { data?: unknown }) =>
          Array.isArray(r?.data) ? (r.data as EmployeeHit[]) : [],
        ),
    enabled: !!hospitalId && term.length >= 2,
    staleTime: 15_000,
  });

  const onError = (e: ApiError) =>
    toast.error(e?.response?.data?.message || "Xatolik yuz berdi");

  const setMut = useMutation({
    mutationFn: ({ employeeId, enabled }: { employeeId: string; enabled: boolean }) =>
      telegramApi.setBotAccess(employeeId, enabled, scopeId),
    onSuccess: (_r, v) => {
      qc.invalidateQueries({ queryKey });
      toast.success(v.enabled ? "Ruxsat berildi" : "Ruxsat olib tashlandi");
      if (v.enabled) setSearch("");
    },
    onError,
  });

  const revokeMut = useMutation({
    mutationFn: (subscriptionId: string) => telegramApi.revokeBotChat(subscriptionId, scopeId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey });
      toast.success("Chat uzildi");
    },
    onError,
  });

  if (!hospitalId) return null;

  const granted = data?.granted ?? [];
  const activeCount = granted.filter((g) => !g.isFired).length;
  const limit = data?.limit ?? 5;
  const full = activeCount >= limit;
  const grantedIds = new Set(granted.map((g) => g.employeeId));
  const legacyChats = data?.legacyChats ?? [];

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <Send className="w-4 h-4 text-sky-400" />
          <h3 className="font-semibold text-[var(--text-primary)]">Telegram bot ruxsati</h3>
          <span className={full ? "badge-yellow" : "badge-gray"}>
            {activeCount}/{limit}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <p className="text-xs text-[var(--text-muted)] leading-relaxed">
          Davomat xabarlari va hisobotlarini oladigan rahbarlar (direktor, o&apos;rinbosar, kadrlar
          boshlig&apos;i). Ular botda <b>/start → Tizimga ulanish → 📱 Raqamni ulashish</b> ni
          bosadi. Telegram akkauntidagi raqam xodim kartasidagi raqam bilan bir xil bo&apos;lishi
          kerak.
        </p>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-14 rounded-xl bg-[var(--bg-hover)] animate-pulse" />
            ))}
          </div>
        ) : granted.length === 0 ? (
          <div className="text-center py-5 text-sm text-[var(--text-muted)]">
            Hali hech kimga ruxsat berilmagan
          </div>
        ) : (
          <div className="space-y-2">
            {granted.map((g) => {
              const linked = g.linkedChats.length > 0;
              return (
                <div
                  key={g.employeeId}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--bg-hover)] border border-[var(--border)]"
                >
                  <div className={`p-1.5 rounded-lg ${linked ? "bg-emerald-500/15" : "bg-[var(--bg-card)]"}`}>
                    {linked ? (
                      <Link2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Link2Off className="w-4 h-4 text-[var(--text-muted)]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                      {g.fullName}
                      {g.position && (
                        <span className="text-[var(--text-muted)] font-normal"> · {g.position}</span>
                      )}
                    </p>
                    <p className="text-xs text-[var(--text-muted)] truncate">
                      {g.phone || "Telefon kiritilmagan"}
                      {" · "}
                      {linked
                        ? `Ulangan${g.linkedChats[0].username ? ` (@${g.linkedChats[0].username})` : ""}`
                        : "Hali ulanmagan"}
                    </p>
                    {(!g.hasValidPhone || g.isFired) && (
                      <p className="text-[11px] mt-0.5 text-amber-400 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        {g.isFired
                          ? "Ishdan bo'shagan"
                          : "Raqam noto'g'ri — xodim kartasida to'g'rilang"}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() =>
                      void confirm({
                        title: "Ruxsat olib tashlansinmi?",
                        description: `${g.fullName} botdan uziladi va qayta ulana olmaydi.`,
                        confirmLabel: "Olib tashlash",
                        tone: "danger",
                      }).then(
                        (ok) => ok && setMut.mutate({ employeeId: g.employeeId, enabled: false }),
                      )
                    }
                    disabled={setMut.isPending}
                    className="btn-ghost p-1.5 text-red-400 hover:bg-red-500/10"
                    title="Ruxsatni olib tashlash"
                    aria-label={`${g.fullName} ruxsatini olib tashlash`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div className="space-y-2 pt-3 border-t border-[var(--border)]">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              disabled={full}
              className="input-field text-sm pl-9"
              placeholder={full ? `Limit to'lgan (${limit} kishi)` : "Xodim ismi yoki telefoni bo'yicha qidiring"}
            />
          </div>
          {term.length >= 2 && !full && (
            <div className="space-y-1">
              {searching && found.length === 0 ? (
                <p className="text-xs text-[var(--text-muted)] px-1">Qidirilmoqda...</p>
              ) : found.length === 0 ? (
                <p className="text-xs text-[var(--text-muted)] px-1">Xodim topilmadi</p>
              ) : (
                found.map((e) => {
                  const already = grantedIds.has(e.id);
                  const noPhone = (e.phone ?? "").replace(/\D/g, "").length < 9;
                  return (
                    <div
                      key={e.id}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--bg-hover)]"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[var(--text-primary)] truncate">{e.fullName}</p>
                        <p className="text-xs text-[var(--text-muted)] truncate">
                          {e.position?.name ?? "—"} · {e.phone || "telefon yo'q"}
                        </p>
                      </div>
                      <button
                        onClick={() => setMut.mutate({ employeeId: e.id, enabled: true })}
                        disabled={already || noPhone || setMut.isPending}
                        className="btn-primary py-1 px-2.5 text-xs gap-1"
                        title={noPhone ? "Avval xodim kartasida telefon raqamini kiriting" : undefined}
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        {already ? "Qo'shilgan" : "Qo'shish"}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {legacyChats.length > 0 && (
          <div className="space-y-2 pt-3 border-t border-[var(--border)]">
            <p className="text-xs font-semibold text-[var(--text-primary)]">
              Eski usulda ulangan chatlar ({legacyChats.length})
            </p>
            <p className="text-[11px] text-[var(--text-muted)]">
              Bular raqam tasdiqlanmasdan ulangan, kimga tegishli ekani noma&apos;lum. Tanimagan
              chatni uzing.
            </p>
            {legacyChats.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[var(--bg-hover)] border border-[var(--border)]"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[var(--text-primary)] truncate">
                    {c.username ? `@${c.username}` : "Nomsiz chat"}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {new Date(c.createdAt).toLocaleDateString("uz-UZ")} dan beri
                  </p>
                </div>
                <button
                  onClick={() =>
                    void confirm({
                      title: "Chat uzilsinmi?",
                      description: "Bu chat davomat xabarlarini olishni to'xtatadi.",
                      confirmLabel: "Uzish",
                      tone: "danger",
                    }).then((ok) => ok && revokeMut.mutate(c.id))
                  }
                  disabled={revokeMut.isPending}
                  className="btn-secondary py-1 px-2.5 text-xs"
                >
                  Uzish
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
