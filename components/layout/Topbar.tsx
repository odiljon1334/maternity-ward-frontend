/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
"use client";
import { useTheme } from "next-themes";
import { Sun, Moon, Bell, Building2, X, CheckCheck, Menu } from "lucide-react";
import { useAuthStore } from "@/stores/auth";
import { getAvatarColor, getInitials, isSuperLike, cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { telegramApi, notificationsApi, authApi, photoUrl } from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useMobileMenu } from "@/contexts/mobile-menu";

interface TopbarProps {
  title: string;
  subtitle?: string;
}

const TYPE_ICONS: Record<string, string> = {
  PAYMENT: "💰",
  SYSTEM: "📢",
  ALERT: "⚠️",
};

/** Notification metadata.kind asosida qaysi sahifaga o'tish kerakligini aniqlaydi */
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

function NotificationDropdown({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const router = useRouter();
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

  const handleItemClick = (n: any) => {
    if (!n.isRead) markReadMut.mutate(n.id);
    const url = resolveNotificationUrl(n);
    if (url) {
      onClose();
      router.push(url);
    }
  };

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
      className="fixed sm:absolute left-4 right-4 sm:left-auto sm:right-0 top-[4.5rem] sm:top-full sm:mt-3 w-auto sm:w-96 rounded-3xl bg-white dark:bg-zinc-900 border border-[var(--border)] z-50 shadow-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] bg-[var(--bg-main)]/50">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-indigo-400" />
          <span className="font-black text-xs uppercase tracking-wider text-[var(--text-primary)]">Bildirishnomalar</span>
          {unread > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-600 text-white shadow-md shadow-indigo-500/25">
              {unread}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {unread > 0 && (
            <button
              onClick={() => markAllMut.mutate()}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5" /> Hammasini o&apos;qish
            </button>
          )}
          <Link
            href="/dashboard/notifications"
            onClick={onClose}
            className="text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            Barchasi →
          </Link>
        </div>
      </div>

      {/* List */}
      <div className="max-h-80 overflow-y-auto divide-y divide-[var(--border)]">
        {list.length === 0 ? (
          <p className="px-4 py-12 text-center text-xs font-medium text-[var(--text-muted)]">
            Bildirishnomalar yo&apos;q
          </p>
        ) : (
          list.map((n) => (
            <div
              key={n.id}
              onClick={() => handleItemClick(n)}
              className={cn(
                "p-4 cursor-pointer hover:bg-[var(--bg-hover)] transition-colors relative",
                !n.isRead && "bg-indigo-500/5 border-l-4 border-l-indigo-500"
              )}
            >
              <div className="flex items-start gap-3">
                <span className="text-lg flex-shrink-0 p-2 rounded-2xl bg-[var(--bg-main)] border border-[var(--border)]">
                  {TYPE_ICONS[n.type] || "🔔"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-[var(--text-primary)] leading-tight">{n.title}</p>
                  <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">{n.message}</p>
                  <p className="text-[10px] font-semibold text-[var(--text-muted)]/60 mt-1.5">
                    {new Date(n.createdAt).toLocaleString("uz-UZ", {
                      day: "2-digit", month: "2-digit",
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </p>
                </div>
                {!n.isRead && (
                  <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0 mt-1 shadow-md shadow-indigo-500/50" />
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
  const { toggle: toggleMenu } = useMobileMenu();
  const [notifOpen, setNotifOpen] = useState(false);
  const qc = useQueryClient();

  const isSuperAdmin = isSuperLike(user?.role);
  const isDirector = user?.role === "DIRECTOR";

  // Service Worker push kelganda (PUSH_RECEIVED) badge/ro'yxatni darhol yangilash —
  // 30 soniyalik pollingni kutmasdan
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    const handler = (event: MessageEvent) => {
      if (event.data?.type === "PUSH_RECEIVED") {
        qc.invalidateQueries({ queryKey: ["notif-count"] });
        qc.invalidateQueries({ queryKey: ["notifications"] });
      }
    };
    navigator.serviceWorker.addEventListener("message", handler);
    return () => navigator.serviceWorker.removeEventListener("message", handler);
  }, [qc]);

  // Xodim profil ma'lumotlarini olish (rasm chiqishi uchun)
  const { data: profile } = useQuery({
    queryKey: ["auth-profile"],
    queryFn: () => authApi.profile(),
  });

  const emp = (profile as any)?.employee;
  const fullName = emp
    ? `${emp.lastName || ""} ${emp.firstName || ""}`.trim() || user?.username
    : user?.username;
  const roleName = emp?.position?.name || user?.role || "EMPLOYEE";
  const userPhoto = emp?.photoUrl ? photoUrl(emp.photoUrl) : null;

  const { data: tgStatus } = useQuery({
    queryKey: ["telegram-status"],
    queryFn: () => telegramApi.status(),
    enabled: isDirector,
    staleTime: 60_000,
  });

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["notif-count"],
    queryFn: () => notificationsApi.unreadCount(),
    enabled: !!user,
    refetchInterval: 30_000,
    staleTime: 15_000,
  });

  return (
    <div>
      {/* SUPER_ADMIN: selected hospital banner */}
      {isSuperAdmin && selectedHospital && (
        <div className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600/10 border-b border-indigo-500/20 text-xs backdrop-blur-md">
          <Building2 className="w-4 h-4 text-indigo-400 flex-shrink-0" />
          <span className="text-indigo-300 font-bold">{selectedHospital.name}</span>
          <span className="text-indigo-400/60 font-mono">({selectedHospital.code})</span>
          <span className="text-indigo-400/50 ml-1 hidden sm:inline">— shu kasalxona ma&apos;lumotlari ko&apos;rsatilmoqda</span>
          <div className="flex items-center gap-3 ml-auto">
            <Link
              href="/dashboard/hospitals"
              className="text-indigo-400 hover:text-indigo-300 underline font-semibold transition-colors"
            >
              O&apos;zgartirish
            </Link>
            <button
              onClick={() => setSelectedHospital(null)}
              className="p-1 rounded-xl bg-indigo-500/10 text-indigo-400/80 hover:text-indigo-300 hover:bg-indigo-500/20 transition-all cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-30 flex items-center gap-3 justify-between px-4 lg:px-6 py-3.5 lg:py-4 border-b border-[var(--border)] bg-[var(--bg-primary)]/80 backdrop-blur-2xl shadow-sm shadow-black/5">
        <div className="flex items-center gap-3 min-w-0">
          {/* Hamburger — mobile only */}
          <button
            onClick={toggleMenu}
            className="lg:hidden flex-shrink-0 p-2.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all cursor-pointer shadow-sm"
            aria-label="Menyuni ochish"
          >
            <Menu className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <h1 className="text-base lg:text-lg font-black text-[var(--text-primary)] truncate tracking-tight">{title}</h1>
            {subtitle && <p className="text-xs text-[var(--text-muted)] truncate font-medium mt-0.5">{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* TG status — only DIRECTOR */}
          {isDirector && tgStatus !== undefined && (
            <div
              title={tgStatus.active ? `Telegram bot ulangan (${tgStatus.count} ta)` : "Telegram bot ulanmagan"}
              className={cn(
                "hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold border transition-all shadow-sm",
                tgStatus.active
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "bg-[var(--bg-card)] text-[var(--text-muted)] border-[var(--border)]"
              )}
            >
              <span className={cn("w-2 h-2 rounded-full", tgStatus.active ? "bg-emerald-400 shadow-md shadow-emerald-500/50 animate-pulse" : "bg-gray-500")} />
              TG {tgStatus.active ? "Active" : "Inactive"}
            </div>
          )}

          {/* Theme toggle */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all cursor-pointer shadow-sm"
            title="Mavzuni o'zgartirish"
          >
            {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
          </button>

          {/* Notification Bell — barcha rollar uchun */}
          {user && (
            <div className="relative">
              <button
                onClick={() => setNotifOpen((v) => !v)}
                className="relative p-2.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all cursor-pointer shadow-sm"
                title="Bildirishnomalar"
              >
                <Bell className="w-4 h-4" />
                {(unreadCount as number) > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-indigo-600 text-white text-[10px] font-black leading-none shadow-lg shadow-indigo-500/50">
                    {(unreadCount as number) > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>
              {notifOpen && <NotificationDropdown onClose={() => setNotifOpen(false)} />}
            </div>
          )}

          {/* Avatar & User Info */}
          {user && (
            <div className="flex items-center gap-3 pl-3 border-l border-[var(--border)]">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-extrabold text-[var(--text-primary)] leading-none">{fullName}</p>
                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mt-1">{roleName}</p>
              </div>

              <div className="relative w-10 h-10 rounded-2xl overflow-hidden border border-indigo-500/30 bg-indigo-500/10 flex items-center justify-center shadow-lg shadow-indigo-500/10 flex-shrink-0">
                {userPhoto ? (
                  <img src={userPhoto} alt={fullName} className="w-full h-full object-cover" />
                ) : (
                  <div className={cn("w-full h-full flex items-center justify-center text-xs font-black text-white", getAvatarColor(user.username))}>
                    {getInitials(fullName || user.username)}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </header>
    </div>
  );
}
