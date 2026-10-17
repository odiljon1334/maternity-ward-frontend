"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { toast } from "sonner";
import { Hand, Megaphone } from "lucide-react";
import { openShiftsApi } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Surface } from "@/components/ui/Surface";

type Offer = {
  id: string;
  date: string;
  status: "OPEN" | "CLAIMED";
  claimedByMe: boolean;
  myResponse: "ACCEPTED" | "DECLINED" | null;
  note: string | null;
  department: { name: string };
  shift: { name: string; startTime: string; endTime: string };
  absentEmployee: { fullName: string } | null;
};

function errorMessage(error: unknown, fallback: string) {
  const message = (error as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
  return Array.isArray(message) ? message.join(". ") : message || fallback;
}

/**
 * Xodimga kelgan bo'sh smena takliflari. Telegrami ulanmagan xodim ham
 * shu yerda "Olaman" deya oladi. Taklif bo'lmasa hech narsa ko'rinmaydi.
 */
export function MyOpenShiftOffers() {
  const qc = useQueryClient();
  const { data: offers = [] } = useQuery<Offer[]>({
    queryKey: ["my-open-shifts"],
    queryFn: () => openShiftsApi.my(),
    refetchInterval: 60_000,
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["my-open-shifts"] });

  const claim = useMutation({
    mutationFn: (id: string) => openShiftsApi.claim(id),
    onSuccess: () => {
      toast.success("Smena siz uchun band qilindi — rahbar tasdig‘i kutilmoqda");
      refresh();
    },
    onError: (error) => {
      toast.error(errorMessage(error, "Smenani olib bo‘lmadi"));
      refresh();
    },
  });
  const decline = useMutation({
    mutationFn: (id: string) => openShiftsApi.decline(id),
    onSuccess: refresh,
    onError: (error) => toast.error(errorMessage(error, "Amal bajarilmadi")),
  });

  const visible = offers.filter((offer) => offer.myResponse !== "DECLINED");
  if (!visible.length) return null;

  return (
    <Surface className="space-y-3 border-amber-500/30 p-5">
      <h2 className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)]">
        <Megaphone className="h-4 w-4 text-amber-500" /> Bo‘sh smena takliflari
      </h2>
      {visible.map((offer) => (
        <div key={offer.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] p-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              {dayjs(offer.date).format("DD.MM.YYYY")} · {offer.shift.startTime}–{offer.shift.endTime}
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              {offer.department.name}
              {offer.absentEmployee ? ` · ${offer.absentEmployee.fullName} o‘rniga` : ""}
              {offer.note ? ` · ${offer.note}` : ""}
            </p>
          </div>
          {offer.claimedByMe ? (
            <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-700 dark:text-amber-300">Siz oldingiz — tasdiq kutilmoqda</span>
          ) : (
            <>
              <Button size="sm" loading={claim.isPending && claim.variables === offer.id} onClick={() => claim.mutate(offer.id)}>
                <Hand className="h-4 w-4" /> Olaman
              </Button>
              <Button size="sm" variant="ghost" onClick={() => decline.mutate(offer.id)}>Yo‘q</Button>
            </>
          )}
        </div>
      ))}
      <p className="text-[11px] text-[var(--text-muted)]">Birinchi rozi bo‘lgan xodim band qiladi. Rahbar tasdiqlagach smena grafigingizga yoziladi.</p>
    </Surface>
  );
}
