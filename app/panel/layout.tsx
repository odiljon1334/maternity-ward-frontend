"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth";
import { PanelShell } from "@/components/panel/PanelShell";

/**
 * /panel — Superadmin boshqaruv paneli (Reja.md, FAZA 5).
 *
 * Odiljon bilan kelishilganidek (2026-09-19), bu ALOHIDA subdomain
 * (admin.clinicuk24.com) emas — xuddi shu loyiha ichida, oddiy
 * /panel yo'li orqali, login/parol bilan kiriladigan bo'lim. Himoya
 * ikki qatlamli:
 *   1. `middleware.ts` — /panel PUBLIC_PATHS'da yo'q, shuning uchun
 *      auth_token cookie bo'lmasa /login'ga qaytaradi (mavjud mexanizm,
 *      o'zgartirish shart emas edi).
 *   2. Shu layout — token bor-yo'qligidan tashqari, rolni ham
 *      tekshiradi.
 *
 * ⚠️ 2026-09-19'da qattiqlashtirildi: /panel endi FAQAT SUPER_ADMIN
 * uchun (Odiljonning aniq talabi — "Superadmin kirgan panelga
 * assistant admin kira olmaydi"). ASSISTANT_ADMIN endi bu yerga
 * kirmaydi — ular o'zlariga biriktirilgan shifoxonalar bilan mavjud
 * /dashboard/hospitals sahifasida ishlaydi (Reja.md'da tafsilot bor).
 */

const ALLOWED_ROLES = ["SUPER_ADMIN"];

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration(() => setHydrated(true));
    if (useAuthStore.persist.hasHydrated()) setHydrated(true);
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!token) {
      router.replace("/login");
      return;
    }
    if (user && !ALLOWED_ROLES.includes(user.role)) {
      router.replace("/dashboard");
    }
  }, [hydrated, token, user, router]);

  const authorized = !!token && (!user || ALLOWED_ROLES.includes(user.role));
  if (!hydrated || !authorized) return null;

  return <PanelShell>{children}</PanelShell>;
}
