"use client";
import Link from "next/link";
import type { ReactNode } from "react";
import { Bell, ChevronLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { notificationsApi } from "@/lib/api";
import { Topbar } from "@/components/layout/Topbar";
import { cn } from "@/lib/utils";

/**
 * Xodim sahifalari uchun umumiy qobiq (check-in dizayni bilan bir xil).
 *
 * Mobilda: yumshoq fon, katta sarlavha (kesilmaydi — kerak bo'lsa ikki
 * qatorga o'tadi), bildirishnoma tugmasi. Ichidagi `.card`, `--text-*`
 * ranglari check-in palitrasiga o'tadi (globals.css → `.ci-screen`).
 * Kompyuterda: odatiy Topbar.
 */
export function EmployeeScreen({
  title,
  subtitle,
  backHref,
  action,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  /** "Ko'proq" menyusidan ochiladigan sahifalarda orqaga qaytish */
  backHref?: string;
  /** Sarlavha yonidagi qo'shimcha tugma (masalan "Yangi so'rov") */
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const { data: unread = 0 } = useQuery({
    queryKey: ["notif-count"],
    queryFn: () => notificationsApi.unreadCount(),
    refetchInterval: 30_000,
    staleTime: 15_000,
  });

  return (
    <div className="ci ci-screen min-h-full bg-[var(--ci-bg)] font-jakarta text-[var(--ci-ink)] sm:bg-transparent sm:font-sans sm:text-[var(--text-primary)]">
      <div className="hidden sm:block">
        <Topbar title={title} subtitle={subtitle} />
      </div>

      <header className="flex items-start gap-3 px-5 pb-2 pt-5 sm:hidden">
        {backHref && (
          <Link
            href={backHref}
            aria-label="Orqaga"
            className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[14px] border border-[var(--ci-border)] bg-[var(--ci-card)] text-[var(--ci-ink)]"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="break-words text-[22px] font-extrabold leading-tight tracking-[-0.4px]">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-0.5 line-clamp-2 text-[12.5px] font-medium text-[var(--ci-muted)]">
              {subtitle}
            </p>
          )}
        </div>
        {action}
        <Link
          href="/dashboard/notifications"
          aria-label="Bildirishnomalar"
          className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[14px] border border-[var(--ci-border)] bg-[var(--ci-card)] text-[var(--ci-ink)]"
        >
          <Bell className="h-5 w-5" />
          {(unread as number) > 0 && (
            <span className="absolute right-[10px] top-2 box-content h-2 w-2 rounded-full border-2 border-[var(--ci-card)] bg-[var(--ci-orange)]" />
          )}
        </Link>
      </header>

      <div className={cn("pb-6", className)}>{children}</div>
    </div>
  );
}
