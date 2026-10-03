"use client";
import { useState } from "react";
import { toast } from "sonner";
import { BadgeCheck, Copy, MailWarning } from "lucide-react";
import { usersApi } from "@/lib/api";

export const EMAIL_FILTER_LABELS: Record<string, string> = {
  true: "Email tasdiqlangan",
  false: "Email tasdiqlanmagan",
};

/** Jadval katagi: email va tasdiqlanganlik belgisi */
export function UserEmailCell({ email, verifiedAt }: { email?: string | null; verifiedAt?: string | null }) {
  if (!email) return <span className="text-xs text-[var(--text-muted)]">—</span>;
  return (
    <div className="flex items-center gap-1.5">
      {verifiedAt ? (
        <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-500" aria-label="Tasdiqlangan" />
      ) : (
        <MailWarning className="h-4 w-4 shrink-0 text-amber-500" aria-label="Tasdiqlanmagan" />
      )}
      <span className="break-all text-[var(--text-primary)]">{email}</span>
    </div>
  );
}

/**
 * Joriy filtrlar bo'yicha email'i tasdiqlangan foydalanuvchilar manzillarini
 * vergul bilan nusxalaydi (masalan, Google Play testerlari ro'yxati uchun).
 */
export function CopyVerifiedEmailsButton({ filters }: { filters: { search?: string; role?: string; status?: string } }) {
  const [busy, setBusy] = useState(false);
  const copy = async () => {
    setBusy(true);
    try {
      const res = await usersApi.list({ ...filters, emailVerified: "true", page: 1, limit: 500 });
      const emails = Array.from(
        new Set(((res?.data ?? []) as { email?: string | null }[]).map((u) => u.email).filter(Boolean)),
      ) as string[];
      if (!emails.length) {
        toast.info("Email'i tasdiqlangan foydalanuvchi topilmadi");
        return;
      }
      await navigator.clipboard.writeText(emails.join(", "));
      const more = (res?.meta?.total ?? 0) > emails.length ? ` (birinchi ${emails.length} tasi)` : "";
      toast.success(`${emails.length} ta email nusxalandi${more}`);
    } catch {
      toast.error("Nusxalab bo'lmadi");
    } finally {
      setBusy(false);
    }
  };
  return (
    <button onClick={copy} disabled={busy} className="btn-ghost flex items-center gap-1.5 px-3 py-2 text-xs disabled:opacity-50">
      <Copy className="h-3.5 w-3.5" />
      Tasdiqlangan emaillarni nusxalash
    </button>
  );
}
