"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Users, CalendarDays, ClipboardList,
  DollarSign, FileBarChart2, Settings, LogOut,
  Activity, ChevronLeft, ChevronRight, Building2, Bell,
  CreditCard, UserPlus, Shield, Send, Eye, X, Video, 
  ScanFace, UserCircle, Palmtree, BarChart2, Wallet, Bot, Archive,
  Sparkles
} from "lucide-react";
import { cn, getInitials, getAvatarColor } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";
import { useMobileMenu } from "@/contexts/mobile-menu";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { authApi, photoUrl } from "@/lib/api";

type NavItem = {
  href:   string;
  label:  string;
  icon:   React.ElementType;
  roles:  string[];
  exact?: boolean;
};

const mainNavItems: NavItem[] = [
  { href: "/dashboard/ministry",          label: "Vazirlik Paneli",    icon: Eye,            exact: true,  roles: ["MINISTRY"] },
  { href: "/dashboard/my-checkin",        label: "Check-in",           icon: ScanFace,       exact: true,  roles: ["EMPLOYEE"] },
  { href: "/dashboard/my-attendance",     label: "Mening davomatim",   icon: ClipboardList,  exact: false, roles: ["EMPLOYEE"] },
  { href: "/dashboard/my-schedule",       label: "Mening grafigim",    icon: CalendarDays,   exact: false, roles: ["EMPLOYEE"] },
  { href: "/dashboard/my-leaves",         label: "Ta'til so'rovlari",  icon: Palmtree,       exact: false, roles: ["EMPLOYEE"] },
  { href: "/dashboard/my-payroll",        label: "Maoshim",            icon: Wallet,         exact: false, roles: ["EMPLOYEE"] },
  { href: "/dashboard/profile",           label: "Profilim",           icon: UserCircle,     exact: false, roles: ["EMPLOYEE"] },
  { href: "/dashboard",                   label: "Dashboard",          icon: LayoutDashboard, exact: true, roles: ["SUPER_ADMIN", "ASSISTANT_ADMIN", "ADMIN", "DIRECTOR", "DEPARTMENT_HEAD"] },
  { href: "/dashboard/employees",         label: "Xodimlar",           icon: Users,          exact: true,  roles: ["SUPER_ADMIN", "ASSISTANT_ADMIN", "ADMIN", "DIRECTOR", "DEPARTMENT_HEAD"] },
  { href: "/dashboard/employees/archive", label: "Xodimlar arxivi",    icon: Archive,        exact: false, roles: ["SUPER_ADMIN", "ASSISTANT_ADMIN", "ADMIN", "DIRECTOR", "DEPARTMENT_HEAD"] },
  { href: "/dashboard/schedules",         label: "Grafik",             icon: CalendarDays,   exact: false, roles: ["SUPER_ADMIN", "ASSISTANT_ADMIN", "ADMIN", "DIRECTOR", "DEPARTMENT_HEAD"] },
  { href: "/dashboard/attendance",        label: "Davomat",            icon: ClipboardList,  exact: false, roles: ["SUPER_ADMIN", "ASSISTANT_ADMIN", "ADMIN", "DIRECTOR", "DEPARTMENT_HEAD"] },
  { href: "/dashboard/leaves",            label: "Ta'til so'rovlari",  icon: Palmtree,       exact: false, roles: ["SUPER_ADMIN", "ASSISTANT_ADMIN", "ADMIN", "DIRECTOR", "DEPARTMENT_HEAD"] },
  { href: "/dashboard/cameras",           label: "Kameralar",          icon: Video,          exact: false, roles: ["MINISTRY"] },
  { href: "/dashboard/payroll",           label: "Maosh",              icon: DollarSign,     exact: false, roles: ["SUPER_ADMIN", "ASSISTANT_ADMIN", "ADMIN", "DIRECTOR", "DEPARTMENT_HEAD"] },
  { href: "/dashboard/analytics",         label: "Chuqur tahlil",      icon: BarChart2,      exact: false, roles: ["SUPER_ADMIN", "ASSISTANT_ADMIN", "ADMIN", "DIRECTOR", "DEPARTMENT_HEAD"] },
  { href: "/dashboard/reports",           label: "Hisobotlar",         icon: FileBarChart2,  exact: false, roles: ["SUPER_ADMIN", "ASSISTANT_ADMIN", "ADMIN", "DIRECTOR", "DEPARTMENT_HEAD"] },
  { href: "/dashboard/hospitals",         label: "Kasalxonalar",       icon: Building2,      exact: false, roles: ["SUPER_ADMIN", "ASSISTANT_ADMIN"] },
  { href: "/dashboard/payments",          label: "To'lovlar",          icon: CreditCard,     exact: false, roles: ["SUPER_ADMIN",] },
  { href: "/dashboard/notifications",     label: "Bildirishnomalar",   icon: Bell,           exact: false, roles: ["SUPER_ADMIN", "ASSISTANT_ADMIN"] },
  { href: "/dashboard/audit-logs",        label: "Audit Log",          icon: Shield,         exact: false, roles: ["SUPER_ADMIN"] },
  { href: "/dashboard/telegram",          label: "Telegram",           icon: Send,           exact: false, roles: ["SUPER_ADMIN"] },
  { href: "/agent",                       label: "AI Agent",           icon: Bot,            exact: false, roles: ["SUPER_ADMIN", "ASSISTANT_ADMIN", "ADMIN", "DIRECTOR"] },
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

  // Xodim profil ma'lumotlarini to'g'ridan-to'g'ri olish (Login o'rniga ism chiqishi uchun)
  const { data: profile } = useQuery({
    queryKey: ["auth-profile"],
    queryFn: () => authApi.profile(),
    enabled: mounted && !!user,
  });
  
  const emp = (profile as any)?.employee;
  
  const fullName = emp?.fullName 
    ? emp.fullName 
    : emp && (emp.firstName || emp.lastName)
    ? `${emp.lastName || ""} ${emp.firstName || ""}`.trim()
    : (user?.username || "Foydalanuvchi");

  const roleName = emp?.position?.name || user?.role || "";
  const userPhoto = emp?.photoUrl ? photoUrl(emp.photoUrl) : null;

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
          "fixed inset-0 z-40 bg-black/60 backdrop-blur-md transition-opacity lg:hidden",
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={close}
      />

      {/* ── Sidebar ──────────────────────────────────────────── */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col h-full transition-all duration-300",
          "bg-[var(--sidebar-bg)] backdrop-blur-2xl border-r border-[var(--border)] shadow-2xl shadow-black/25",
          // Mobile: drawer
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          // Desktop: sticky
          "lg:relative lg:translate-x-0 lg:h-screen lg:sticky lg:top-0",
          // Width
          "w-72 lg:w-auto",
          collapsed ? "lg:w-20" : "lg:w-72"
        )}
      >
       {/* Logo */}
       <div className="flex items-center gap-3 px-5 py-5 border-b border-[var(--border)] relative overflow-hidden">
          <div className="absolute -right-6 -top-6 opacity-10 pointer-events-none text-indigo-400">
            <Sparkles className="w-20 h-20" />
          </div>

          <div className="flex-shrink-0 p-2.5 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-500/30 border border-indigo-400/20">
            <Activity className="w-5 h-5" />
          </div>

          {!collapsed && (
            <div className="min-w-0">
              <span className="font-black text-white text-sm tracking-tight block truncate">
                MaternityCare
              </span>
              <span className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest block">
                Enterprise
              </span>
            </div>
          )}

          {/* Desktop collapse toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "hidden lg:flex items-center justify-center ml-auto p-2 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all cursor-pointer shadow-sm",
              collapsed && "mx-auto"
            )}
            title={collapsed ? "Kengaytirish" : "Yig'ish"}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* Mobile close button */}
          <button
            onClick={close}
            className="lg:hidden ml-auto p-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const { href, label, icon: Icon } = item;
            const active = item.exact
              ? pathname === href
              : pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all group relative",
                  active
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 border border-indigo-400/20"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] border border-transparent",
                  collapsed && "lg:justify-center lg:px-0 lg:py-3.5"
                )}
                title={collapsed ? label : undefined}
              >
                <Icon className={cn("w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110", active ? "text-white" : "text-indigo-400")} />
                <span className={cn("truncate", collapsed && "lg:hidden")}>{label}</span>
                {active && !collapsed && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white hidden lg:block shadow-md shadow-white" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="px-3 pb-3 space-y-1.5 border-t border-[var(--border)] pt-4">
          {mounted && user?.role === "SUPER_ADMIN" && (
            <Link
              href="/register"
              className={cn(
                "flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 border border-transparent transition-all",
                collapsed && "lg:justify-center lg:px-0"
              )}
              title={collapsed ? "Admin yaratish" : undefined}
            >
              <UserPlus className="w-5 h-5 flex-shrink-0" />
              <span className={cn(collapsed && "lg:hidden")}>Admin yaratish</span>
            </Link>
          )}

          {mounted && user?.role !== "MINISTRY" && user?.role !== "EMPLOYEE" && (
            <Link
              href="/dashboard/settings"
              className={cn(
                "flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] border border-transparent transition-all",
                collapsed && "lg:justify-center lg:px-0"
              )}
              title={collapsed ? "Sozlamalar" : undefined}
            >
              <Settings className="w-5 h-5 flex-shrink-0" />
              <span className={cn(collapsed && "lg:hidden")}>Sozlamalar</span>
            </Link>
          )}

          <button
            onClick={handleLogout}
            className={cn(
              "w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-transparent transition-all cursor-pointer",
              collapsed && "lg:justify-center lg:px-0"
            )}
            title={collapsed ? "Chiqish" : undefined}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span className={cn(collapsed && "lg:hidden")}>Chiqish</span>
          </button>
        </div>

        {/* User profile (Bottom) */}
        {user && (
          <div className={cn(
            "flex items-center gap-3 px-3.5 py-4 border-t border-[var(--border)] bg-[var(--bg-main)]/50",
            collapsed && "lg:justify-center lg:px-0"
          )}>
            <div className="relative w-10 h-10 rounded-2xl overflow-hidden border border-indigo-500/30 bg-indigo-500/10 flex items-center justify-center shadow-md flex-shrink-0">
              {userPhoto ? (
                <img src={userPhoto} alt={fullName} className="w-full h-full object-cover" />
              ) : (
                <div className={cn("w-full h-full flex items-center justify-center text-xs font-black text-white", getAvatarColor(fullName))}>
                  {getInitials(fullName)}
                </div>
              )}
            </div>

            <div className={cn("min-w-0 flex-1", collapsed && "lg:hidden")}>
              <p className="text-xs font-extrabold text-white truncate">{fullName}</p>
              <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider truncate mt-0.5">{roleName || user.role}</p>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}