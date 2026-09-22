import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  ShieldCheck,
  BarChart3,
  History,
  Inbox,
} from "lucide-react";

export interface PanelNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: "soon";
}

/**
 * Superadmin boshqaruv paneli navigatsiyasi.
 * Reja.md — FAZA 5 bandlariga mos: har bir link o'sha bandning
 * frontend sahifasiga to'g'ri keladi. Tugallanmagan sahifalargina
 * "tez orada" belgisi bilan ComingSoon skeletiga ega.
 */
export const PANEL_NAV: PanelNavItem[] = [
  { href: "/panel", label: "Umumiy ko'rinish", icon: LayoutDashboard },
  { href: "/panel/hospitals", label: "Shifoxonalar", icon: Building2 },
  { href: "/panel/users", label: "Foydalanuvchilar", icon: Users },
  { href: "/panel/leads", label: "Yangi so'rovlar", icon: Inbox },
  { href: "/panel/payments", label: "To'lovlar", icon: CreditCard },
  {
    href: "/panel/subscriptions",
    label: "Daromad tahlili",
    icon: BarChart3,
  },
  {
    href: "/panel/permissions",
    label: "Ruxsatlar",
    icon: ShieldCheck,
  },
  { href: "/panel/audit", label: "Audit log", icon: History, badge: "soon" },
];
