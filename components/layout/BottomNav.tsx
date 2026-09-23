/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import {
  LayoutDashboard, Users, ClipboardList, CalendarDays, DollarSign, Eye, ScanFace,
  Palmtree, Wallet, HandCoins, BookOpen, UserCircle, LogOut, LayoutGrid, Check, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { attendanceApi } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";

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

type NavItem = { href: string; label: string; icon: typeof Eye };

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-semibold transition-colors",
        active ? "text-indigo-500 dark:text-indigo-300" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]",
      )}
    >
      <Icon className={cn("h-5 w-5 transition-transform", active && "scale-110")} />
      <span>{item.label}</span>
    </Link>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuthStore();

  if (user?.role === "EMPLOYEE") return <EmployeeBottomNav pathname={pathname} />;

  const items = user?.role === "MINISTRY" ? NAV_ITEMS_MINISTRY : NAV_ITEMS_DEFAULT;
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-[var(--border)] bg-[var(--bg-card)] pb-[env(safe-area-inset-bottom)] sm:hidden">
      {items.map((item) => (
        <NavLink
          key={item.href}
          item={item}
          active={item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href)}
        />
      ))}
    </nav>
  );
}

// ─── Xodim uchun: Davomat · Grafik · [Kamera] · Ta'til · Ko'proq ─────────────

const EMP_LEFT: NavItem[] = [
  { href: "/dashboard/my-attendance", label: "Davomat", icon: ClipboardList },
  { href: "/dashboard/my-schedule",   label: "Grafik",  icon: CalendarDays },
];
const EMP_RIGHT: NavItem[] = [
  { href: "/dashboard/my-leaves", label: "Ta'til", icon: Palmtree },
];
const EMP_MORE: NavItem[] = [
  { href: "/dashboard/my-payroll",      label: "Maoshim",        icon: Wallet },
  { href: "/dashboard/my-compensation", label: "Bonus va avans", icon: HandCoins },
  { href: "/dashboard/labor-law",       label: "Mehnat huquqi",  icon: BookOpen },
  { href: "/dashboard/profile",         label: "Profilim",       icon: UserCircle },
];
const CHECKIN_HREF = "/dashboard/my-checkin";

/** Markaziy tugma rangi bugungi holatga qarab: kelish / ketish / tugadi */
const FAB_STATE = {
  in:   { label: "Keldim",  cls: "bg-indigo-700 shadow-indigo-700/40" },
  out:  { label: "Ketish",  cls: "bg-orange-700 shadow-orange-700/40" },
  done: { label: "Tugadi",  cls: "bg-teal-700 shadow-teal-700/40" },
} as const;

function useTodayState(): keyof typeof FAB_STATE {
  const today = dayjs();
  // Check-in sahifasi bilan bir xil kalit — kesh bo'lishiladi, qo'shimcha so'rov yo'q
  const { data } = useQuery({
    queryKey: ["my-attendance-today", today.month() + 1, today.year()],
    queryFn: () => attendanceApi.my({ month: today.month() + 1, year: today.year() }),
    select: (d: any) => {
      const todayStr = today.format("YYYY-MM-DD");
      return (d.records ?? []).find((r: any) => dayjs(r.workDate).format("YYYY-MM-DD") === todayStr) ?? null;
    },
    staleTime: 60_000,
  });
  if (data?.checkIn && data?.checkOut) return "done";
  if (data?.checkIn) return "out";
  return "in";
}

function EmployeeBottomNav({ pathname }: { pathname: string }) {
  const router = useRouter();
  const { logout } = useAuthStore();
  const [moreOpen, setMoreOpen] = useState(false);
  const state = useTodayState();
  const fab = FAB_STATE[state];
  const onCheckin = pathname.startsWith(CHECKIN_HREF);
  const moreActive = EMP_MORE.some((i) => pathname.startsWith(i.href));

  useEffect(() => setMoreOpen(false), [pathname]);

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border)] bg-[var(--bg-card)] pb-[env(safe-area-inset-bottom)] backdrop-blur-md sm:hidden">
        <div className="flex h-16 items-stretch">
          {EMP_LEFT.map((item) => (
            <NavLink key={item.href} item={item} active={pathname.startsWith(item.href)} />
          ))}

          {/* Markaziy kamera tugmasi (ko'tarilgan) */}
          <div className="relative flex flex-1 justify-center">
            <Link
              href={CHECKIN_HREF}
              aria-label={`Check-in: ${fab.label}`}
              className="absolute -top-5 flex flex-col items-center gap-1"
            >
              <span
                className={cn(
                  "flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg ring-4 ring-[var(--bg-card)] transition active:scale-95",
                  fab.cls,
                  onCheckin && "scale-105",
                )}
              >
                {state === "done" ? <Check className="h-7 w-7" strokeWidth={2.6} /> : <ScanFace className="h-7 w-7" />}
              </span>
              <span className={cn("text-[10px] font-bold", onCheckin ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]")}>
                {fab.label}
              </span>
            </Link>
          </div>

          {EMP_RIGHT.map((item) => (
            <NavLink key={item.href} item={item} active={pathname.startsWith(item.href)} />
          ))}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-semibold transition-colors",
              moreActive || moreOpen ? "text-indigo-500 dark:text-indigo-300" : "text-[var(--text-muted)]",
            )}
          >
            <LayoutGrid className="h-5 w-5" />
            <span>Ko&apos;proq</span>
          </button>
        </div>
      </nav>

      {moreOpen && (
        <div className="fixed inset-0 z-50 sm:hidden" role="dialog" aria-modal="true" aria-label="Ko'proq">
          <button
            type="button"
            aria-label="Yopish"
            onClick={() => setMoreOpen(false)}
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]"
          />
          <div className="sheet-safe absolute inset-x-0 bottom-0 rounded-t-[1.75rem] border-t border-[var(--border)] bg-[var(--bg-card)] px-4 pt-3 shadow-2xl">
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-[var(--border)]" />
            <div className="mb-2 flex items-center justify-between px-1">
              <p className="text-sm font-black text-[var(--text-primary)]">Ko&apos;proq</p>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                aria-label="Yopish"
                className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-[var(--bg-hover)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 pb-3">
              {EMP_MORE.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl border px-3.5 py-3.5 text-sm font-bold transition",
                    pathname.startsWith(href)
                      ? "border-indigo-500/40 bg-indigo-500/10 text-indigo-600 dark:text-indigo-300"
                      : "border-[var(--border)] bg-[var(--bg-main)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]",
                  )}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {label}
                </Link>
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                setMoreOpen(false);
                logout();
                router.push("/login");
              }}
              className="mb-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 py-3.5 text-sm font-bold text-rose-600 dark:text-rose-300"
            >
              <LogOut className="h-4 w-4" /> Chiqish
            </button>
          </div>
        </div>
      )}
    </>
  );
}
