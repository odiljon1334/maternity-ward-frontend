"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useTheme } from "next-themes";
import {
  LayoutDashboard, Users, ClipboardList, CalendarDays, DollarSign, Eye, ScanFace,
  Palmtree, Wallet, Gift, BookOpen, UserCircle, Power, LayoutGrid, Check, LogOut,
  ChevronRight, Moon, Sun,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";
import { useEmployeeToday, type TodayState } from "@/hooks/useEmployeeToday";

// Rolga qarab ko'rsatiladigan bottom nav itemlari
const NAV_ITEMS_DEFAULT = [
  { href: "/dashboard",            label: "Bosh",     icon: LayoutDashboard },
  { href: "/dashboard/employees",  label: "Xodimlar", icon: Users },
  { href: "/dashboard/attendance", label: "Davomat",  icon: ClipboardList },
  { href: "/dashboard/schedules",  label: "Grafik",   icon: CalendarDays },
  { href: "/dashboard/payroll",    label: "Maosh",    icon: DollarSign },
];

const NAV_ITEMS_MINISTRY = [
  { href: "/dashboard/ministry", label: "Panel",     icon: Eye },
  { href: "/dashboard/cameras",  label: "Kameralar", icon: Eye },
];

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuthStore();

  if (user?.role === "EMPLOYEE") return <EmployeeBottomNav pathname={pathname} />;

  const items = user?.role === "MINISTRY" ? NAV_ITEMS_MINISTRY : NAV_ITEMS_DEFAULT;
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-[var(--border)] bg-[var(--bg-card)] pb-[env(safe-area-inset-bottom)] sm:hidden">
      {items.map(({ href, label, icon: Icon }) => {
        const active = href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
              active ? "text-indigo-400" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]",
            )}
          >
            <Icon className={cn("h-5 w-5 transition-transform", active && "scale-110")} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

// ─── Xodim: Davomat · Grafik · [Kamera] · Ta'til · Ko'proq (dizayn kanvasi) ──

const CHECKIN_HREF = "/dashboard/my-checkin";

const MORE_ITEMS = [
  { href: "/dashboard/my-payroll",      label: "Maoshim",        sub: "Oylik hisob-kitobi",                 icon: Wallet },
  { href: "/dashboard/my-compensation", label: "Bonus va avans", sub: "So'rov yuborish, holatini ko'rish",  icon: Gift },
  { href: "/dashboard/labor-law",       label: "Mehnat huquqi",  sub: "Mehnat kodeksi bo'yicha qisqacha",   icon: BookOpen },
  { href: "/dashboard/profile",         label: "Profilim",       sub: "Ma'lumotlar, parol, bildirishnomalar", icon: UserCircle },
];

/** Markaziy tugma ko'rinishi bugungi holatga qarab */
const FAB: Record<TodayState, { bg: string; shadow: string; text: string; icon: string; label: string }> = {
  in:   { bg: "#4338CA", shadow: "rgba(67,56,202,0.35)",  text: "var(--ci-indigo-text)", icon: "#ffffff", label: "Kelish" },
  out:  { bg: "#C2410C", shadow: "rgba(194,65,12,0.32)",  text: "var(--ci-orange-text)", icon: "#ffffff", label: "Ketish" },
  done: { bg: "#0F766E", shadow: "rgba(15,118,110,0.3)",  text: "var(--ci-teal-text)",   icon: "#ffffff", label: "Tugadi" },
  off:  { bg: "#D5D8E4", shadow: "rgba(15,18,34,0.08)",   text: "var(--ci-faint)",       icon: "#5B6078", label: "Dam olish" },
};

function TabLink({ href, label, icon, active }: { href: string; label: string; icon: ReactNode; active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex w-[62px] flex-col items-center gap-[5px] text-[11px] font-bold transition-colors",
        active ? "text-[var(--ci-indigo-text)]" : "text-[var(--ci-faint)]",
      )}
    >
      {icon}
      {label}
    </Link>
  );
}

function EmployeeBottomNav({ pathname }: { pathname: string }) {
  const router = useRouter();
  const { logout } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const [moreOpen, setMoreOpen] = useState(false);
  const { state } = useEmployeeToday();
  const fab = FAB[state];
  const moreActive = MORE_ITEMS.some((i) => pathname.startsWith(i.href));

  useEffect(() => setMoreOpen(false), [pathname]);

  const iconCls = "h-[23px] w-[23px]";
  return (
    <div className="ci font-jakarta sm:hidden">
      <nav
        aria-label="Asosiy menyu"
        className="fixed inset-x-0 bottom-0 z-40 rounded-t-[26px] border-t border-[var(--ci-border)] bg-[var(--ci-card)] pb-[env(safe-area-inset-bottom)] shadow-[var(--ci-shadow)]"
      >
        <div className="flex h-[68px] items-end justify-around px-2 pb-2.5">
          <TabLink href="/dashboard/my-attendance" label="Davomat" active={pathname.startsWith("/dashboard/my-attendance")} icon={<ClipboardList className={iconCls} />} />
          <TabLink href="/dashboard/my-schedule" label="Grafik" active={pathname.startsWith("/dashboard/my-schedule")} icon={<CalendarDays className={iconCls} />} />

          {/* Markaziy kamera tugmasi — bar ustidan ko'tarilgan */}
          <Link
            href={CHECKIN_HREF}
            aria-label={`Check-in: ${fab.label}`}
            className="flex w-[88px] flex-col items-center gap-1.5 self-end"
          >
            <span
              className="-mt-9 flex h-[68px] w-[68px] items-center justify-center rounded-full border-[6px] border-[var(--ci-bg)] transition active:scale-95"
              style={{ background: fab.bg, color: fab.icon, boxShadow: `0 10px 22px ${fab.shadow}` }}
            >
              {state === "done" ? <Check className="h-[30px] w-[30px]" strokeWidth={3} />
                : state === "out" ? <LogOut className="h-[26px] w-[26px]" strokeWidth={2.4} />
                : <ScanFace className="h-7 w-7" strokeWidth={2.2} />}
            </span>
            <span className="text-[11px] font-extrabold" style={{ color: fab.text }}>{fab.label}</span>
          </Link>

          <TabLink href="/dashboard/my-leaves" label="Ta'til" active={pathname.startsWith("/dashboard/my-leaves")} icon={<Palmtree className={iconCls} />} />
          <button
            type="button"
            onClick={() => setMoreOpen((v) => !v)}
            aria-expanded={moreOpen}
            className={cn(
              "flex w-[62px] flex-col items-center gap-[5px] text-[11px] font-bold transition-colors",
              moreActive || moreOpen ? "text-[var(--ci-indigo-text)]" : "text-[var(--ci-faint)]",
            )}
          >
            <LayoutGrid className={iconCls} />
            Ko&apos;proq
          </button>
        </div>
      </nav>

      {moreOpen && (
        // Pastki menyu (z-40) ochiq qoladi — "Ko'proq" faol ko'rinadi, boshqa bo'limga bir bosishda o'tiladi
        <div className="fixed inset-0 z-30" role="dialog" aria-modal="true" aria-label="Ko'proq">
          <button
            type="button"
            aria-label="Yopish"
            onClick={() => setMoreOpen(false)}
            className="absolute inset-0 bg-[rgba(15,18,34,0.45)]"
          />
          <div className="absolute inset-x-0 bottom-[calc(68px+env(safe-area-inset-bottom))] max-h-[calc(100dvh-140px)] overflow-y-auto rounded-t-[28px] bg-[var(--ci-card)] px-5 pb-9 pt-2.5 text-[var(--ci-ink)]">
            <div className="mx-auto mb-2.5 h-[5px] w-10 rounded-full bg-[var(--ci-border)]" />
            <p className="mb-0.5 text-[17px] font-extrabold">Ko&apos;proq</p>
            {MORE_ITEMS.map(({ href, label, sub, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3.5 border-b border-[var(--ci-border)] py-[13px]"
              >
                <span className={cn(
                  "flex h-[42px] w-[42px] flex-shrink-0 items-center justify-center rounded-[13px]",
                  pathname.startsWith(href) ? "bg-[var(--ci-indigo-tint)] text-[var(--ci-indigo-text)]" : "bg-[var(--ci-soft)]",
                )}>
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-bold">{label}</span>
                  <span className="block text-[12.5px] text-[var(--ci-muted)]">{sub}</span>
                </span>
                <ChevronRight className="h-[18px] w-[18px] text-[var(--ci-muted)]" />
              </Link>
            ))}
            <button
              type="button"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="flex w-full items-center gap-3.5 border-b border-[var(--ci-border)] py-[13px] text-left"
            >
              <span className="flex h-[42px] w-[42px] flex-shrink-0 items-center justify-center rounded-[13px] bg-[var(--ci-soft)]">
                {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-bold">{theme === "dark" ? "Kunduzgi rejim" : "Tungi rejim"}</span>
                <span className="block text-[12.5px] text-[var(--ci-muted)]">Ekran ranglarini almashtirish</span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMoreOpen(false);
                logout();
                router.push("/login");
              }}
              className="flex w-full items-center gap-3.5 py-[13px] text-left text-[var(--ci-orange-text)]"
            >
              <span className="flex h-[42px] w-[42px] flex-shrink-0 items-center justify-center rounded-[13px] bg-[var(--ci-orange-tint)]">
                <Power className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-bold">Chiqish</span>
                <span className="block text-[12.5px] text-[var(--ci-muted)]">Hisobdan chiqish</span>
              </span>
              <ChevronRight className="h-[18px] w-[18px] text-[var(--ci-muted)]" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
