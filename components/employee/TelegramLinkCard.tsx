"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2, Send } from "lucide-react";
import { telegramApi } from "@/lib/api";
import { Button } from "@/components/ui/Button";

function errorMessage(error: unknown, fallback: string) {
  const message = (error as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
  return Array.isArray(message) ? message.join(". ") : message || fallback;
}

/**
 * Xodimning shaxsiy Telegramini ulash (web va PWA).
 *
 * Ilgari bu faqat mobil ilovada bor edi — PWA orqali kirgan xodim
 * Telegram'ini ulay olmasdi va bo'sh smena takliflari, eslatmalar unga
 * kelmasdi. Bir martalik havola 15 daqiqa amal qiladi; bot ochilgach
 * "Start" bosiladi.
 *
 * `compact` — boshqa sahifalarda (masalan "Mening grafigim") faqat ulanmagan
 * xodimga qisqa eslatma sifatida.
 */
export function TelegramLinkCard({ compact = false }: { compact?: boolean }) {
  const qc = useQueryClient();
  const { data, isError } = useQuery({
    queryKey: ["telegram-me"],
    queryFn: () => telegramApi.me(),
    retry: false,
    refetchOnWindowFocus: true,
  });

  const link = useMutation({
    mutationFn: () => telegramApi.createMyLink(),
    onSuccess: ({ url }) => {
      // So'rovdan keyin ochilgani uchun brauzer (ayniqsa iOS PWA) yangi
      // oynani bloklashi mumkin — unda shu oynaning o'zida ochiladi.
      const opened = window.open(url, "_blank");
      if (opened) opened.opener = null;
      else window.location.href = url;
      toast.success("Telegram ochildi — botda «Start» ni bosing, keyin shu sahifaga qayting");
    },
    onError: (error) => toast.error(errorMessage(error, "Havola yaratilmadi")),
  });
  const unlink = useMutation({
    mutationFn: () => telegramApi.unlinkMe(),
    onSuccess: () => {
      toast.success("Telegram uzildi");
      qc.invalidateQueries({ queryKey: ["telegram-me"] });
    },
    onError: (error) => toast.error(errorMessage(error, "Uzib bo‘lmadi")),
  });

  // Xodim profili yo'q foydalanuvchi (masalan super admin) — ko'rsatilmaydi
  if (isError || !data) return null;
  if (compact && data.linked) return null;

  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-sky-500/30 bg-sky-500/10 px-4 py-3 text-sm text-sky-800 dark:text-sky-200">
        <Send className="h-4 w-4 flex-shrink-0" />
        <span className="min-w-0 flex-1">Telegram’ni ulang — bo‘sh smena takliflari va eslatmalar darhol keladi.</span>
        <Button size="sm" onClick={() => link.mutate()} loading={link.isPending} disabled={!data.botAvailable}>
          Ulash
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-[var(--bg-card)] border border-[var(--border)] p-6 shadow-xl space-y-4">
      <div className="flex items-center gap-2 pb-3 border-b border-[var(--border)]">
        <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
          <Send className="w-4 h-4" />
        </div>
        <span className="font-black text-sm text-[var(--text-primary)] uppercase tracking-wider">Telegram</span>
      </div>
      {data.linked ? (
        <div className="flex flex-wrap items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          <span className="flex-1 text-sm text-[var(--text-primary)]">
            Ulangan{data.botUsername ? ` — @${data.botUsername}` : ""}. Eslatmalar va bo‘sh smena takliflari Telegram’ga keladi.
          </span>
          <Button size="sm" variant="ghost" onClick={() => unlink.mutate()} loading={unlink.isPending}>
            Uzish
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-[var(--text-secondary)]">
            Telegram’ni ulang: kelish-ketish eslatmalari va bo‘sh smena takliflari («Olaman» tugmasi bilan) shu yerga keladi.
          </p>
          <Button onClick={() => link.mutate()} loading={link.isPending} disabled={!data.botAvailable}>
            <Send className="h-4 w-4" /> Telegram’ni ulash
          </Button>
          {!data.botAvailable && <p className="text-xs text-[var(--text-muted)]">Telegram bot hozircha sozlanmagan.</p>}
        </div>
      )}
    </div>
  );
}
