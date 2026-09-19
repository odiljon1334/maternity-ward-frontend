import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  ShieldCheck,
  BarChart3,
  History,
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
 * frontend sahifasiga to'g'ri keladi. Hozircha faqat "/panel" (Umumiy
 * ko'rinish) to'liq ishlaydi — qolganlari "tez orada" belgisi bilan
 * ComingSoon skeletiga ega (404 bo'lmasligi uchun).
 */
export const PANEL_NAV: PanelNavItem[] = [
  { href: "/panel", label: "Umumiy ko'rinish", icon: LayoutDashboard },
  { href: "/panel/hospitals", label: "Shifoxonalar", icon: Building2 },
  { href: "/panel/users", label: "Foydalanuvchilar", icon: Users },
  { href: "/panel/payments", label: "To'lovlar", icon: CreditCard, badge: "soon" },
  { href: "/panel/subscriptions", label: "Daromad tahlili", icon: BarChart3, badge: "soon" },
  { href: "/panel/permissions", label: "Ruxsatlar", icon: ShieldCheck, badge: "soon" },
  { href: "/panel/audit", label: "Audit log", icon: History, badge: "soon" },
];
