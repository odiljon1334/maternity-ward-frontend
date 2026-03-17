"use client";


import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Users, CalendarDays, ClipboardList,
  DollarSign, FileBarChart2, Settings, LogOut,
  Activity, ChevronLeft, ChevronRight, Building2, Bell, CreditCard, UserPlus, Shield, Send,
} from "lucide-react";
import { cn, getInitials, getAvatarColor } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";
import { useState, useEffect } from "react";

const mainNavItems = [
  { href: "/dashboard",            label: "Dashboard",   icon: LayoutDashboard, roles: null },
  { href: "/dashboard/employees",  label: "Xodimlar",    icon: Users,           roles: null },
  { href: "/dashboard/schedules",  label: "Grafik",      icon: CalendarDays,    roles: null },
  { href: "/dashboard/attendance", label: "Davomat",     icon: ClipboardList,   roles: null },
  { href: "/dashboard/payroll",    label: "Maosh",       icon: DollarSign,      roles: null },
  { href: "/dashboard/reports",    label: "Hisobotlar",  icon: FileBarChart2,   roles: null },
  { href: "/dashboard/hospitals",      label: "Kasalxonalar",     icon: Building2,  roles: ["SUPER_ADMIN", "ASSISTANT_ADMIN"] },
  { href: "/dashboard/payments",       label: "To'lovlar",        icon: CreditCard, roles: ["SUPER_ADMIN", "ASSISTANT_ADMIN"] },
  { href: "/dashboard/notifications",  label: "Bildirishnomalar", icon: Bell,       roles: ["SUPER_ADMIN", "ASSISTANT_ADMIN"] },
  { href: "/dashboard/audit-logs",     label: "Audit Log",        icon: Shield,     roles: ["SUPER_ADMIN"] },
  { href: "/dashboard/telegram",       label: "Telegram",         icon: Send,       roles: ["SUPER_ADMIN"] },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // SSR paytida faqat umumiy itemlar, mount bo'lgandan keyin role-based filter
  const navItems = mainNavItems.filter(
    (item) => !item.roles || (mounted && user?.role && item.roles.includes(user.role))
  );

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <aside
      className={cn(
        "flex flex-col h-screen sticky top-0 transition-all duration-300",
        "bg-[var(--sidebar-bg)] border-r border-[var(--border)]",
        collapsed ? "w-16" : "w-64"
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
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "ml-auto p-1 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-colors",
            collapsed && "mx-auto"
          )}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
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
                collapsed && "justify-center px-0"
              )}
              title={collapsed ? label : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{label}</span>}
              {active && !collapsed && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: settings + user */}
      <div className="px-2 pb-4 space-y-0.5 border-t border-[var(--border)] pt-4">
        {/* Admin yaratish — faqat SUPER_ADMIN uchun */}
        {mounted && user?.role === "SUPER_ADMIN" && (
          <Link
            href="/register"
            className={cn("nav-item text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10", collapsed && "justify-center px-0")}
            title={collapsed ? "Admin yaratish" : undefined}
          >
            <UserPlus className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>Admin yaratish</span>}
          </Link>
        )}

        <Link
          href="/dashboard/settings"
          className={cn("nav-item", collapsed && "justify-center px-0")}
          title={collapsed ? "Sozlamalar" : undefined}
        >
          <Settings className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Sozlamalar</span>}
        </Link>

        <button
          onClick={handleLogout}
          className={cn(
            "nav-item w-full text-left text-red-400 hover:text-red-300 hover:bg-red-500/10",
            collapsed && "justify-center px-0"
          )}
          title={collapsed ? "Chiqish" : undefined}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Chiqish</span>}
        </button>
      </div>

      {/* User profile */}
      {user && (
        <div className={cn(
          "flex items-center gap-3 px-3 py-3 border-t border-[var(--border)]",
          collapsed && "justify-center"
        )}>
          <div className={cn(
            "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white",
            getAvatarColor(user.username)
          )}>
            {getInitials(user.username)}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.username}</p>
              <p className="text-xs text-gray-500 truncate">{user.role}</p>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
