"use client";
import { useQuery } from "@tanstack/react-query";
import { telegramApi } from "@/lib/api";
import { Topbar } from "@/components/layout/Topbar";
import { cn } from "@/lib/utils";
import {
  CheckCircle2, XCircle, Building2, Send, User, Hash, Clock,
} from "lucide-react";
import dayjs from "dayjs";

export default function TelegramPage() {
  const { data: hospitals = [], isLoading } = useQuery({
    queryKey: ["telegram-subscriptions"],
    queryFn: () => telegramApi.subscriptions(),
    refetchInterval: 30_000, // har 30 soniyada yangilash
  });

  const connected = hospitals.filter((h) => h.isConnected).length;
  const total = hospitals.length;

  return (
    <div>
      <Topbar
        title="Telegram ulanishlar"
        subtitle="Barcha kasalxonalarning Telegram bot holati"
      />

      <div className="p-6 space-y-5">
        {/* Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-[var(--text-primary)]">{total}</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">Jami kasalxonalar</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-emerald-400">{connected}</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">Ulangan</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-red-400">{total - connected}</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">Ulanmagan</p>
          </div>
        </div>

        {/* Hospital list */}
        <div className="space-y-3">
          {isLoading && [...Array(5)].map((_, i) => (
            <div key={i} className="card p-5 h-20 animate-pulse bg-[var(--bg-hover)]" />
          ))}

          {!isLoading && hospitals.map((h) => (
            <div key={h.hospitalId} className="card overflow-hidden">
              {/* Hospital header */}
              <div className={cn(
                "flex items-center justify-between px-5 py-4",
                h.isConnected ? "border-l-4 border-emerald-500" : "border-l-4 border-red-500/40"
              )}>
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                    h.isConnected ? "bg-emerald-500/15" : "bg-red-500/10"
                  )}>
                    <Building2 className={cn("w-5 h-5", h.isConnected ? "text-emerald-400" : "text-red-400/60")} />
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--text-primary)]">{h.hospitalName}</p>
                    {h.address && <p className="text-xs text-[var(--text-muted)]">{h.address}</p>}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {h.isConnected ? (
                    <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full">
                      <CheckCircle2 className="w-4 h-4" /> Ulangan
                      {h.activeCount > 1 && (
                        <span className="ml-1 text-xs bg-emerald-500/20 px-1.5 py-0.5 rounded-full">
                          {h.activeCount} ta
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-sm font-medium text-red-400/70 bg-red-500/10 px-3 py-1 rounded-full">
                      <XCircle className="w-4 h-4" /> Ulanmagan
                    </span>
                  )}
                </div>
              </div>

              {/* Subscriptions list */}
              {h.subscriptions.length > 0 && (
                <div className="border-t border-[var(--border)] divide-y divide-[var(--border)]">
                  {h.subscriptions.map((sub) => (
                    <div
                      key={sub.id}
                      className={cn(
                        "flex items-center justify-between px-5 py-3 text-sm",
                        !sub.isActive && "opacity-40"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        {/* Telegram icon */}
                        <div className="w-7 h-7 rounded-full bg-indigo-500/15 flex items-center justify-center flex-shrink-0">
                          <Send className="w-3.5 h-3.5 text-indigo-400" />
                        </div>

                        {/* Username */}
                        <div>
                          <div className="flex items-center gap-2">
                            <User className="w-3 h-3 text-[var(--text-muted)]" />
                            <span className="text-[var(--text-primary)] font-medium">
                              {sub.username ? `@${sub.username}` : "Noma'lum"}
                            </span>
                            {!sub.isActive && (
                              <span className="text-xs px-1.5 py-0.5 rounded bg-red-500/15 text-red-400">
                                Faol emas
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                              <Hash className="w-2.5 h-2.5" />
                              {sub.chatId}
                            </span>
                            <span className="text-xs text-[var(--text-muted)]">
                              {sub.role}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Connected date */}
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                          <Clock className="w-3 h-3" />
                          {dayjs(sub.createdAt).format("DD.MM.YYYY HH:mm")}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* No subscriptions */}
              {h.subscriptions.length === 0 && (
                <div className="px-5 py-3 text-xs text-[var(--text-muted)] italic border-t border-[var(--border)]">
                  Hech qanday ulanish yo&apos;q — direktor Telegram bot orqali ulashi kerak
                </div>
              )}
            </div>
          ))}

          {!isLoading && hospitals.length === 0 && (
            <div className="card p-12 text-center">
              <Send className="w-10 h-10 text-[var(--text-muted)] opacity-30 mx-auto mb-3" />
              <p className="text-[var(--text-muted)] text-sm">Kasalxonalar topilmadi</p>
            </div>
          )}
        </div>

        {/* Help */}
        <div className="card p-4 flex items-start gap-3 bg-indigo-500/5 border border-indigo-500/20">
          <Send className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-[var(--text-muted)]">
            <p className="font-medium text-indigo-400 mb-1">Qanday ulash?</p>
            <p>Direktor Telegram botga kiradi → <code className="bg-[var(--bg-hover)] px-1 rounded font-mono">/start</code> buyrug&apos;ini yuboradi → telefon raqamini ulashadi → bot avtomatik kasalxonani topadi va ulanadi.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
