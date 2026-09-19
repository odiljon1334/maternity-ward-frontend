"use client";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Menu, Search, Bell, ChevronRight, LogOut, ShieldCheck } from "lucide-react";
import { PANEL_NAV } from "./panel-nav";
import { useAuthStore } from "@/stores/auth";
import { EmailVerificationReminder } from "@/components/dashboard/EmailVerificationReminder";

export function PanelShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [open, setOpen] = useState(false);

  const current = PANEL_NAV.find((n) => n.href === pathname)?.label ?? "Boshqaruv paneli";

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  return (
    <div className="min-h-screen bg-[#f4f6fb] dark:bg-[#0b0e1a]">
      {/* Sidebar — atayin doim qorong'i (mavzudan qat'iy nazar), "real admin panel"
          taassurotini beruvchi barqaror vizual identifikatsiya sifatida */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-64 flex-col -translate-x-full bg-gradient-to-b from-[#151b2e] to-[#0b0e1a] px-4 py-6 transition-transform duration-200 lg:translate-x-0 ${
          open ? "translate-x-0" : ""
        }`}
      >
        <Link href="/panel" onClick={() => setOpen(false)} className="mb-8 flex items-center gap-2.5 px-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600">
            <ShieldCheck className="h-5 w-5 text-white" />
          </span>
          <span className="leading-tight">
            <div className="text-[15px] font-semibold text-white">MaternityCare</div>
            <div className="text-[9px] font-medium tracking-wider text-white/40">BOSHQARUV PANELI</div>
          </span>
        </Link>

        <div className="flex-1 overflow-y-auto">
          <div className="mb-2 px-3 text-[10px] font-semibold tracking-wider text-white/30">ASOSIY</div>
          <nav className="space-y-1">
            {PANEL_NAV.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] transition ${
                    active
                      ? "bg-white/10 text-white shadow-[inset_3px_0_0_0_#818cf8]"
                      : "text-white/60 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon className="h-[18px] w-[18px]" />
                  {item.label}
                  {item.badge === "soon" && (
                    <span className="ml-auto rounded-full bg-white/10 px-1.5 py-0.5 text-[9px] font-medium text-white/50">
                      tez orada
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-4 flex items-center gap-2.5 border-t border-white/10 pt-4">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-[11px] font-medium text-white">
            {(user?.username ?? "SA").slice(0, 2).toUpperCase()}
          </span>
          <div className="min-w-0 leading-tight">
            <div className="truncate text-[12px] font-medium text-white">{user?.username ?? "Superadmin"}</div>
            <div className="text-[10px] text-white/40">{user?.role ?? "SUPER_ADMIN"}</div>
          </div>
          <button onClick={handleLogout} aria-label="Chiqish" className="ml-auto text-white/40 hover:text-white">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>

      {open && (
        <button
          aria-label="Menyuni yopish"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
        />
      )}

      {/* Workspace */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b border-[var(--border)] bg-[var(--bg-secondary)]/90 px-5 backdrop-blur">
          <button className="text-[var(--text-muted)] lg:hidden" aria-label="Menyuni ochish" onClick={() => setOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden items-center gap-1.5 text-xs text-[var(--text-muted)] sm:flex">
            Panel <ChevronRight className="h-3 w-3" /> <span className="font-medium text-[var(--text-primary)]">{current}</span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-1.5 text-xs text-[var(--text-muted)] md:flex">
              <Search className="h-3.5 w-3.5" />
              <span>Qidirish...</span>
            </div>
            <button className="relative text-[var(--text-muted)] hover:text-[var(--text-primary)]" aria-label="Bildirishnomalar">
              <Bell className="h-[18px] w-[18px]" />
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-red-500" />
            </button>
          </div>
        </header>
        <EmailVerificationReminder />
        <main className="mx-auto max-w-[1600px] p-5 sm:p-7">{children}</main>
      </div>
    </div>
  );
}
