"use client";
import { useTheme } from "next-themes";
import { Sun, Moon, Bell, Building2, X, CheckCheck } from "lucide-react";
import { useAuthStore } from "@/stores/auth";
import { getAvatarColor, getInitials, isSuperLike } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { telegramApi, notificationsApi } from "@/lib/api";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface TopbarProps {
  title: string;
  subtitle?: string;
}

const TYPE_ICONS: Record<string, string> = {
  PAYMENT: "💰",
  SYSTEM: "📢",
  ALERT: "⚠️",
};

function NotificationDropdown({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const ref = useRef<HTMLDivElement>(null);

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications", "dropdown"],
    queryFn: () => notificationsApi.list({ limit: 8 }),
    refetchInterval: 30_000,
  });

  const markReadMut = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["notif-count"] });
    },
  });

  const markAllMut = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["notif-count"] });
    },
  });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const list = notifications as any[];
  const unread = list.filter((n) => !n.isRead).length;

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-2 w-96 card z-50 shadow-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-[var(--text-muted)]" />
          <span className="font-semibold text-sm text-[var(--text-primary)]">Bildirishnomalar</span>
          {unread > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500 text-white">
              {unread}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unread > 0 && (
            <button
              onClick={() => markAllMut.mutate()}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              <CheckCheck className="w-3.5 h-3.5" /> Hammasini o&apos;qi
            </button>
          )}
          <Link
            href="/dashboard/notifications"
            onClick={onClose}
            className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            Barchasi →
          </Link>
        </div>
      </div>

      {/* List */}
      <div className="max-h-80 overflow-y-auto">
        {list.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">
            Bildirishnomalar yo&apos;q
          </p>
        ) : (
          list.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.isRead && markReadMut.mutate(n.id)}
              className={cn(
                "px-4 py-3 border-b border-[var(--border)] cursor-pointer hover:bg-[var(--bg-hover)] transition-colors",
                !n.isRead && "bg-indigo-500/5 border-l-2 border-l-indigo-500"
              )}
            >
              <div className="flex items-start gap-2">
                <span className="text-base flex-shrink-0 mt-0.5">
                  {TYPE_ICONS[n.type] || "🔔"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[var(--text-primary)] leading-tight">{n.title}</p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5 leading-relaxed">{n.message}</p>
                  <p className="text-xs text-[var(--text-muted)]/60 mt-1">
                    {new Date(n.createdAt).toLocaleString("uz-UZ", {
                      day: "2-digit", month: "2-digit",
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </p>
                </div>
                {!n.isRead && (
                  <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0 mt-1.5" />
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function Topbar({ title, subtitle }: TopbarProps) {
  const { theme, setTheme } = useTheme();
  const { user, selectedHospital, setSelectedHospital } = useAuthStore();
  const [notifOpen, setNotifOpen] = useState(false);

  const isSuperAdmin = isSuperLike(user?.role);
  const isDirector = user?.role === "DIRECTOR";

  const { data: tgStatus } = useQuery({
    queryKey: ["telegram-status"],
    queryFn: () => telegramApi.status(),
    enabled: isDirector,
    staleTime: 60_000,
  });

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["notif-count"],
    queryFn: () => notificationsApi.unreadCount(),
    enabled: isSuperAdmin,
    refetchInterval: 30_000,
    staleTime: 15_000,
  });

  return (
    <div>
      {/* SUPER_ADMIN: selected hospital banner */}
      {isSuperAdmin && selectedHospital && (
        <div className="flex items-center gap-2 px-6 py-2 bg-indigo-600/20 border-b border-indigo-500/30 text-sm">
          <Building2 className="w-4 h-4 text-indigo-400 flex-shrink-0" />
          <span className="text-indigo-300 font-medium">{selectedHospital.name}</span>
          <span className="text-indigo-400/60 text-xs">({selectedHospital.code})</span>
          <span className="text-indigo-400/50 text-xs ml-1">— shu kasalxona ma&apos;lumotlari ko&apos;rsatilmoqda</span>
          <div className="flex items-center gap-2 ml-auto">
            <Link
              href="/dashboard/hospitals"
              className="text-xs text-indigo-400 hover:text-indigo-300 underline transition-colors"
            >
              O&apos;zgartirish
            </Link>
            <button
              onClick={() => setSelectedHospital(null)}
              className="p-0.5 rounded text-indigo-400/60 hover:text-indigo-300 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      <header className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[var(--bg-secondary)]">
        <div>
          <h1 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h1>
          {subtitle && <p className="text-sm text-[var(--text-muted)]">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-2">
          {/* TG status — only DIRECTOR */}
          {isDirector && tgStatus !== undefined && (
            <div
              title={tgStatus.active ? `Telegram bot ulangan (${tgStatus.count} ta)` : "Telegram bot ulanmagan"}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                tgStatus.active
                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                  : "bg-[var(--bg-hover)] text-[var(--text-muted)] border border-[var(--border)]"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${tgStatus.active ? "bg-emerald-400" : "bg-gray-500"}`} />
              TG {tgStatus.active ? "Active" : "Inactive"}
            </div>
          )}

          {/* Theme toggle */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Notification Bell — SUPER_ADMIN only */}
          {isSuperAdmin && (
            <div className="relative">
              <button
                onClick={() => setNotifOpen((v) => !v)}
                className="relative p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
              >
                <Bell className="w-4 h-4" />
                {(unreadCount as number) > 0 && (
                  <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-indigo-500 text-white text-[10px] font-bold leading-none">
                    {(unreadCount as number) > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>
              {notifOpen && <NotificationDropdown onClose={() => setNotifOpen(false)} />}
            </div>
          )}

          {/* Avatar */}
          {user && (
            <div className="flex items-center gap-2 pl-2 border-l border-[var(--border)]">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white ${getAvatarColor(user.username)}`}>
                {getInitials(user.username)}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-[var(--text-primary)]">{user.username}</p>
                <p className="text-xs text-[var(--text-muted)]">{user.role}</p>
              </div>
            </div>
          )}
        </div>
      </header>
    </div>
  );
}
