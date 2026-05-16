"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, ClipboardList,
  CalendarDays, DollarSign, Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";

// Rolga qarab ko'rsatiladigan bottom nav itemlari
const NAV_ITEMS_DEFAULT = [
  { href: "/dashboard",            label: "Bosh",    icon: LayoutDashboard },
  { href: "/dashboard/employees",  label: "Xodimlar", icon: Users },
  { href: "/dashboard/attendance", label: "Davomat",  icon: ClipboardList },
  { href: "/dashboard/schedules",  label: "Grafik",   icon: CalendarDays },
  { href: "/dashboard/payroll",    label: "Maosh",    icon: DollarSign },
];

const NAV_ITEMS_MINISTRY = [
  { href: "/dashboard/ministry", label: "Panel",    icon: Eye },
  { href: "/dashboard/cameras",  label: "Kameralar", icon: Eye },
];

const NAV_ITEMS_EMPLOYEE = [
  { href: "/dashboard/my-attendance", label: "Davomatim", icon: ClipboardList },
];

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuthStore();

  const items =
    user?.role === "MINISTRY" ? NAV_ITEMS_MINISTRY :
    user?.role === "EMPLOYEE" ? NAV_ITEMS_EMPLOYEE :
    NAV_ITEMS_DEFAULT;

  return (
    <nav className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-[var(--bg-card)] border-t border-[var(--border)] flex">
      {items.map(({ href, label, icon: Icon }) => {
        const isActive =
          href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(href);

        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
              isActive
                ? "text-indigo-400"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]",
            )}
          >
            <Icon
              className={cn(
                "w-5 h-5 transition-transform",
                isActive && "scale-110",
              )}
            />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
