"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Users, CalendarDays, ClipboardList,
  DollarSign, FileBarChart2, Settings, LogOut,
  Activity, ChevronLeft, ChevronRight, Building2, Bell,
  CreditCard, UserPlus, Shield, Send, Eye, X, Video,
} from "lucide-react";
import { cn, getInitials, getAvatarColor } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";
import { useMobileMenu } from "@/contexts/mobile-menu";
import { useState, useEffect } from "react";

const mainNavItems = [
  { href: "/dashboard/ministry",    label: "Vazirlik Paneli",    icon: Eye,            roles: ["MINISTRY"] },
  { href: "/dashboard",             label: "Dashboard",          icon: LayoutDashboard, roles: ["SUPER_ADMIN", "ASSISTANT_ADMIN", "ADMIN", "DIRECTOR", "DEPARTMENT_HEAD"] },
  { href: "/dashboard/employees",   label: "Xodimlar",           icon: Users,           roles: ["SUPER_ADMIN", "ASSISTANT_ADMIN", "ADMIN", "DIRECTOR", "DEPARTMENT_HEAD"] },
  { href: "/dashboard/schedules",   label: "Grafik",             icon: CalendarDays,    roles: ["SUPER_ADMIN", "ASSISTANT_ADMIN", "ADMIN", "DIRECTOR", "DEPARTMENT_HEAD"] },
  { href: "/dashboard/attendance",  label: "Davomat",            icon: ClipboardList,   roles: ["SUPER_ADMIN", "ASSISTANT_ADMIN", "ADMIN", "DIRECTOR", "DEPARTMENT_HEAD"] },
  { href: "/dashboard/cameras",    label: "Kameralar",          icon: Video,           roles: ["SUPER_ADMIN", "ASSISTANT_ADMIN", "ADMIN", "DIRECTOR"] },
  { href: "/dashboard/payroll",     label: "Maosh",              icon: DollarSign,      roles: ["SUPER_ADMIN", "ASSISTANT_ADMIN", "ADMIN", "DIRECTOR", "DEPARTMENT_HEAD"] },
  { href: "/dashboard/reports",     label: "Hisobotlar",         icon: FileBarChart2,   roles: ["SUPER_ADMIN", "ASSISTANT_ADMIN", "ADMIN", "DIRECTOR", "DEPARTMENT_HEAD"] },
  { href: "/dashboard/hospitals",   label: "Kasalxonalar",       icon: Building2,       roles: ["SUPER_ADMIN", "ASSISTANT_ADMIN"] },
  { href: "/dashboard/payments",    label: "To'lovlar",          icon: CreditCard,      roles: ["SUPER_ADMIN", "ASSISTANT_ADMIN"] },
  { href: "/dashboard/notifications", label: "Bildirishnomalar", icon: Bell,            roles: ["SUPER_ADMIN", "ASSISTANT_ADMIN"] },
  { href: "/dashboard/audit-logs",  label: "Audit Log",          icon: Shield,          roles: ["SUPER_ADMIN"] },
  { href: "/dashboard/telegram",    label: "Telegram",           icon: Send,            roles: ["SUPER_ADMIN"] },
];

export function Sidebar() {
  const pathname = usePathname();
  const router   = useRouter();
  const { user, logout } = useAuthStore();
  const { open: mobileOpen, close } = useMobileMenu();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted]     = useState(false);

  useEffect(() => setMounted(true), []);

  // Navigatsiya qilinganda mobile menyu yopilsin
  useEffect(() => { close(); }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const navItems = mainNavItems.filter(
    (item) => !item.roles || (mounted && user?.role && item.roles.includes(user.role))
  );

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <>
      {/* ── Mobile backdrop ──────────────────────────────────── */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity lg:hidden",
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={close}
      />

      {/* ── Sidebar ──────────────────────────────────────────── */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col h-full transition-transform duration-300",
          "bg-[var(--sidebar-bg)] border-r border-[var(--border)]",
          // Mobile: drawer — show/hide via transform
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          // Desktop: always visible, sticky, relative
          "lg:relative lg:translate-x-0 lg:h-screen lg:sticky lg:top-0",
          // Width
          "w-72 lg:w-auto",
          collapsed ? "lg:w-16" : "lg:w-64"
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-[var(--border)]">
          <div className="flex-shrink-0 p-1.5 rounded-lg bg-indigo-600">
            <Activity className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <span className="font-bold text-white text-sm leading-tight">
              MaternityCare
            </span>
          )}
          {/* Desktop collapse toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "hidden lg:block ml-auto p-1 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-colors",
              collapsed && "mx-auto"
            )}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
          {/* Mobile close button */}
          <button
            onClick={close}
            className="lg:hidden ml-auto p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "nav-item",
                  active && "active",
                  collapsed && "lg:justify-center lg:px-0"
                )}
                title={collapsed ? label : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className={cn(collapsed && "lg:hidden")}>{label}</span>
                {active && !collapsed && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400 hidden lg:block" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="px-2 pb-4 space-y-0.5 border-t border-[var(--border)] pt-4">
          {mounted && user?.role === "SUPER_ADMIN" && (
            <Link
              href="/register"
              className={cn(
                "nav-item text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10",
                collapsed && "lg:justify-center lg:px-0"
              )}
              title={collapsed ? "Admin yaratish" : undefined}
            >
              <UserPlus className="w-5 h-5 flex-shrink-0" />
              <span className={cn(collapsed && "lg:hidden")}>Admin yaratish</span>
            </Link>
          )}

          {mounted && user?.role !== "MINISTRY" && (
            <Link
              href="/dashboard/settings"
              className={cn("nav-item", collapsed && "lg:justify-center lg:px-0")}
              title={collapsed ? "Sozlamalar" : undefined}
            >
              <Settings className="w-5 h-5 flex-shrink-0" />
              <span className={cn(collapsed && "lg:hidden")}>Sozlamalar</span>
            </Link>
          )}

          <button
            onClick={handleLogout}
            className={cn(
              "nav-item w-full text-left text-red-400 hover:text-red-300 hover:bg-red-500/10",
              collapsed && "lg:justify-center lg:px-0"
            )}
            title={collapsed ? "Chiqish" : undefined}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span className={cn(collapsed && "lg:hidden")}>Chiqish</span>
          </button>
        </div>

        {/* User profile */}
        {user && (
          <div className={cn(
            "flex items-center gap-3 px-3 py-3 border-t border-[var(--border)]",
            collapsed && "lg:justify-center"
          )}>
            <div className={cn(
              "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white",
              getAvatarColor(user.username)
            )}>
              {getInitials(user.username)}
            </div>
            <div className={cn("min-w-0", collapsed && "lg:hidden")}>
              <p className="text-sm font-medium text-white truncate">{user.username}</p>
              <p className="text-xs text-gray-500 truncate">{user.role}</p>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
