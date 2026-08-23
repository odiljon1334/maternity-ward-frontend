/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { notificationsApi, hospitalsApi } from "@/lib/api";
import { Topbar } from "@/components/layout/Topbar";
import { useForm } from "react-hook-form";
import {
  Bell, Send, Trash2, CheckCheck, X, Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";
import { useRouter } from "next/navigation";

const TYPE_ICONS: Record<string, string> = { PAYMENT: "💰", SYSTEM: "📢", ALERT: "⚠️" };
const TYPE_LABELS: Record<string, string> = { PAYMENT: "To'lov", SYSTEM: "Tizim", ALERT: "Ogohlantirish" };

/** Notification metadata.kind asosida qaysi sahifaga o'tish kerakligini aniqlaydi
 *  (Topbar.tsx dagi bir xil nomli funksiya bilan mos — ikkalasida ham saqlanadi,
 *  chunki umumiy lib fayli berilmagan) */
function resolveNotificationUrl(n: any): string | null {
  const kind = n?.metadata?.kind;
  const leaveId = n?.metadata?.leaveId;
  switch (kind) {
    case "leave-new":
      return leaveId ? `/dashboard/leaves?highlight=${leaveId}` : "/dashboard/leaves";
    case "leave-reviewed":
      return leaveId ? `/dashboard/my-leaves?highlight=${leaveId}` : "/dashboard/my-leaves";
    case "payroll":
      return "/dashboard/my-payroll";
    case "checkin-reminder":
    case "checkout-reminder":
      return "/dashboard/my-checkin";
    default:
      return null;
  }
}

// ─── Telegram Send Modal ─────────────────────────
type TgForm = { message: string };

function TelegramSendModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<TgForm>();
  const [selectedHospIds, setSelectedHospIds] = useState<string[]>([]);
  const [sendAll, setSendAll] = useState(false);
  const message = watch("message", "");

  const { data: hospitals = [] } = useQuery({
    queryKey: ["hospitals"],
    queryFn: hospitalsApi.list,
    enabled: open,
  });

  const mutation = useMutation({
    mutationFn: (d: TgForm) => notificationsApi.sendTelegram({
      hospitalIds: sendAll ? "all" : selectedHospIds,
      message: d.message,
    }),
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["notif-count"] });
      toast.success(`${res.sentCount} ta direktorga xabar yuborildi`);
      reset();
      setSelectedHospIds([]);
      setSendAll(false);
      onClose();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Xatolik"),
  });

  const toggleHosp = (id: string) =>
    setSelectedHospIds((prev) =>
      prev.includes(id) ? prev.filter((h) => h !== id) : [...prev, id]
    );

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <Send className="w-4 h-4 text-sky-400" />
            <h2 className="font-semibold text-[var(--text-primary)]">Telegram xabar yuborish</h2>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-2">Kimga yuborish *</label>
            <button
              type="button"
              onClick={() => { setSendAll((v) => !v); setSelectedHospIds([]); }}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium mb-2 transition-colors",
                sendAll
                  ? "border-indigo-500/60 bg-indigo-500/10 text-indigo-300"
                  : "border-[var(--border)] bg-[var(--bg-hover)] text-[var(--text-muted)]"
              )}
            >
              <Building2 className="w-4 h-4" />
              Barcha kasalxonalar
              {sendAll && <span className="ml-auto text-xs text-indigo-400">✓ Tanlangan</span>}
            </button>

            {!sendAll && (
              <div className="space-y-1 max-h-36 overflow-y-auto">
                {(hospitals as any[]).map((h) => (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => toggleHosp(h.id)}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors text-left",
                      selectedHospIds.includes(h.id)
                        ? "border-sky-500/60 bg-sky-500/10 text-sky-300"
                        : "border-[var(--border)] bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    )}
                  >
                    <span className={cn(
                      "w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center text-xs",
                      selectedHospIds.includes(h.id) ? "border-sky-400 bg-sky-500 text-white" : "border-[var(--border)]"
                    )}>
                      {selectedHospIds.includes(h.id) && "✓"}
                    </span>
                    <span className="font-medium text-xs truncate">{h.name}</span>
                    <span className="ml-auto font-mono text-xs opacity-60">{h.code}</span>
                  </button>
                ))}
              </div>
            )}
            {!sendAll && selectedHospIds.length === 0 && (
              <p className="text-xs text-amber-400 mt-1">Kamida bitta kasalxona tanlang</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
              Xabar matni *
              <span className="ml-2 text-[var(--text-muted)]/60">{message.length}/500</span>
            </label>
            <textarea
              {...register("message", { required: "Xabar kerak", maxLength: 500 })}
              rows={4}
              className="input-field text-sm resize-none"
              placeholder="To'lov muddati o'tib ketdi. Iltimos, tezda to'lovni amalga oshiring..."
            />
            {errors.message && <p className="text-xs text-red-400 mt-1">{errors.message.message}</p>}
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 text-sm">Bekor</button>
            <button
              type="submit"
              disabled={mutation.isPending || (!sendAll && selectedHospIds.length === 0)}
              className="btn-primary flex-1 text-sm gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              {mutation.isPending ? "Yuborilmoqda..." : "Yuborish"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────
export default function NotificationsPage() {
  const qc = useQueryClient();
  const router = useRouter();
  const [tgModal, setTgModal] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const { user } = useAuthStore();
  // Backend /notifications/send-telegram faqat shu rollarga ochiq —
  // frontendda ham shunga mos ravishda tugmani yashiramiz
  const canBroadcast = user?.role === "SUPER_ADMIN" || user?.role === "ASSISTANT_ADMIN";

  // Push kelganda (Service Worker orqali) ro'yxatni darhol yangilash
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    const handler = (event: MessageEvent) => {
      if (event.data?.type === "PUSH_RECEIVED") {
        qc.invalidateQueries({ queryKey: ["notifications"] });
        qc.invalidateQueries({ queryKey: ["notif-count"] });
      }
    };
    navigator.serviceWorker.addEventListener("message", handler);
    return () => navigator.serviceWorker.removeEventListener("message", handler);
  }, [qc]);

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications", filter],
    queryFn: () => notificationsApi.list({ unreadOnly: filter === "unread", limit: 100 }),
    refetchInterval: 30_000,
  });

  const markReadMut = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const handleRowClick = (n: any) => {
    if (!n.isRead) markReadMut.mutate(n.id);
    const url = resolveNotificationUrl(n);
    if (url) router.push(url);
  };

  const markAllMut = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["notif-count"] });
      toast.success("Barchasi o'qildi deb belgilandi");
    },
  });

  const deleteNotifMut = useMutation({
    mutationFn: (id: string) => notificationsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["notif-count"] });
    },
  });

  const notifList = notifications as any[];
  const unreadCount = notifList.filter((n) => !n.isRead).length;

  return (
    <div>
      <Topbar title="Bildirishnomalar" subtitle="Tizim xabarnomalar va Telegram yuborish" />

      <div className="p-4 lg:p-6 space-y-4 lg:space-y-5">
        {/* Header actions */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 p-1 rounded-lg border border-[var(--border)] bg-[var(--bg-hover)]">
            <button
              onClick={() => setFilter("all")}
              className={cn("px-2.5 py-1 rounded text-xs font-medium transition-colors",
                filter === "all" ? "bg-[var(--bg-primary)] text-[var(--text-primary)]" : "text-[var(--text-muted)]"
              )}
            >
              Barchasi
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={cn("px-2.5 py-1 rounded text-xs font-medium transition-colors",
                filter === "unread" ? "bg-[var(--bg-primary)] text-[var(--text-primary)]" : "text-[var(--text-muted)]"
              )}
            >
              O&apos;qilmagan {unreadCount > 0 && `(${unreadCount})`}
            </button>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={() => markAllMut.mutate()}
                disabled={markAllMut.isPending}
                className="btn-secondary text-xs gap-1.5"
              >
                <CheckCheck className="w-3.5 h-3.5" /> Hammasini o&apos;qi
              </button>
            )}
            {canBroadcast && (
              <button onClick={() => setTgModal(true)} className="btn-primary text-xs gap-1.5">
                <Send className="w-3.5 h-3.5" /> Telegram yuborish
              </button>
            )}
          </div>
        </div>

        {/* Notifications list */}
        <div className="card">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-[var(--text-muted)]">Yuklanmoqda...</div>
          ) : notifList.length === 0 ? (
            <div className="p-12 text-center">
              <Bell className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-3 opacity-40" />
              <p className="text-sm text-[var(--text-muted)]">
                {filter === "unread" ? "O'qilmagan bildirishnomalar yo'q" : "Bildirishnomalar yo'q"}
              </p>
            </div>
          ) : (
            <div>
              {notifList.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleRowClick(n)}
                  className={cn(
                    "flex items-start gap-3 px-5 py-4 border-b border-[var(--border)] hover:bg-[var(--bg-hover)] transition-colors group",
                    !n.isRead && "bg-indigo-500/5 border-l-2 border-l-indigo-500",
                    resolveNotificationUrl(n) && "cursor-pointer"
                  )}
                >
                  <span className="text-xl flex-shrink-0 mt-0.5">{TYPE_ICONS[n.type] || "🔔"}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className={cn("text-sm font-medium", !n.isRead ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]")}>
                          {n.title}
                        </p>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5 leading-relaxed">{n.message}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className={cn(
                            "text-xs px-1.5 py-0.5 rounded font-medium",
                            n.type === "PAYMENT" ? "bg-emerald-500/15 text-emerald-400" :
                            n.type === "ALERT" ? "bg-amber-500/15 text-amber-400" :
                            "bg-sky-500/15 text-sky-400"
                          )}>
                            {TYPE_LABELS[n.type]}
                          </span>
                          {n.hospital && (
                            <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                              <Building2 className="w-3 h-3" /> {n.hospital.name}
                            </span>
                          )}
                          <span className="text-xs text-[var(--text-muted)]/50">
                            {new Date(n.createdAt).toLocaleString("uz-UZ", {
                              day: "2-digit", month: "2-digit", year: "numeric",
                              hour: "2-digit", minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!n.isRead && (
                          <button
                            onClick={(e) => { e.stopPropagation(); markReadMut.mutate(n.id); }}
                            className="p-1.5 rounded text-[var(--text-muted)] hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                            title="O'qildi"
                          >
                            <CheckCheck className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canBroadcast && (
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteNotifMut.mutate(n.id); }}
                            className="p-1.5 rounded text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            title="O'chirish"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  {!n.isRead && <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0 mt-2" />}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <TelegramSendModal open={tgModal} onClose={() => setTgModal(false)} />
    </div>
  );
}
