"use client";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Mail, X } from "lucide-react";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";

// Odiljon so'rovi (2026-09-19): "Director uchun ham superadmin uchun ham
// email verification qo'shish kerak". Kelishilgan qattiqlik darajasi:
// FAQAT ESLATMA — login yoki boshqa hech qanday amal bloklanmaydi, faqat
// shu yengil banner ko'rsatiladi (sessiya davomida "x" bilan yopish mumkin,
// keyingi safar yana ko'rinadi — butunlay yo'qolib ketmaydi).
const DISMISSED_KEY = "email_verify_reminder_dismissed";
const REMINDER_ROLES = ["SUPER_ADMIN", "DIRECTOR"];

export function EmailVerificationReminder() {
  const user = useAuthStore((s) => s.user);
  const [dismissed, setDismissed] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      setDismissed(sessionStorage.getItem(DISMISSED_KEY) === "true");
    } catch {
      /* sessionStorage yo'q bo'lsa ham bannerni ko'rsatishda davom etamiz */
    }
  }, []);

  const shouldCheck = !!user && REMINDER_ROLES.includes(user.role);

  const { data: profile } = useQuery({
    queryKey: ["email-verify-status"],
    queryFn: () => authApi.profile(),
    enabled: shouldCheck,
    staleTime: 5 * 60_000,
  });

  if (!mounted || !shouldCheck || dismissed) return null;
  if (!profile) return null;
  if (profile.email && profile.emailVerifiedAt) return null;

  const handleDismiss = () => {
    try {
      sessionStorage.setItem(DISMISSED_KEY, "true");
    } catch {
      /* silent */
    }
    setDismissed(true);
  };

  return (
    <div className="flex items-center gap-3 border-b border-amber-500/20 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-700 dark:text-amber-400">
      <Mail className="h-4 w-4 shrink-0" />
      <p className="flex-1">
        {profile.email
          ? "Email manzilingiz hali tasdiqlanmagan."
          : "Xavfsizlik uchun email manzilingizni qo'shing va tasdiqlang."}{" "}
        <Link href="/dashboard/profile" className="font-medium underline underline-offset-2">
          Hozir tasdiqlash
        </Link>
      </p>
      <button
        onClick={handleDismiss}
        className="shrink-0 text-amber-700/70 hover:text-amber-700 dark:text-amber-400/70 dark:hover:text-amber-400"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
