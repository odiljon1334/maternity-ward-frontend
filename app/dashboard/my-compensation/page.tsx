"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { toast } from "sonner";
import { HandCoins, MessageSquareText, Trophy } from "lucide-react";
import { compensationApi } from "@/lib/api";
import { formatMoney } from "@/lib/utils";
import { Button, Field, Input, Select, StatePanel, Surface, useConfirmation } from "@/components/ui";
import { EmployeeScreen } from "@/components/employee/EmployeeScreen";

const labels: Record<string, string> = {
  CONTRACTUAL_KPI_BONUS: "KPI bonusi",
  ONE_TIME_AWARD: "Bir martalik mukofot",
  DISCIPLINARY_FINE: "Intizomiy jarima ishi",
  OTHER_LAWFUL_DEDUCTION: "Qonuniy ushlanma",
  PENDING_EXPLANATION: "Tushuntirish kutilmoqda",
  PENDING_APPROVAL: "Rahbar qarori kutilmoqda",
  PENDING_ACKNOWLEDGEMENT: "Buyruq bilan tanishish kutilmoqda",
  APPROVED: "Tasdiqlangan",
  REJECTED: "Rad etilgan",
  REQUESTED: "So‘rov yuborilgan",
  PAID: "To‘langan",
};

export default function MyCompensationPage() {
  const qc = useQueryClient();
  const { confirm, prompt } = useConfirmation();
  const now = dayjs();
  const [month, setMonth] = useState(now.month() + 1);
  const [year, setYear] = useState(now.year());
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const params = { month, year };
  const adjustmentsQuery = useQuery({ queryKey: ["my-adjustments", params], queryFn: () => compensationApi.myAdjustments(params) });
  const advancesQuery = useQuery({ queryKey: ["my-advances", params], queryFn: () => compensationApi.myAdvances(params) });
  const adjustments = adjustmentsQuery.data ?? [];
  const advances = advancesQuery.data ?? [];
  const request = useMutation({
    mutationFn: () => compensationApi.requestMyAdvance({ month, year, amount: Number(amount), note }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["my-advances"] }); setAmount(""); setNote(""); toast.success("Avans so‘rovi yuborildi"); },
    onError: (e: any) => toast.error(e?.response?.data?.message || "So‘rov yuborilmadi"),
  });

  const explain = async (item: any) => {
    const explanation = await prompt({
      title: "Tushuntirish yuborish",
      description: "Tushuntirishingiz qaror auditi bilan saqlanadi.",
      label: "Tushuntirish",
      placeholder: "Holat bo‘yicha to‘liq tushuntirish yozing",
      confirmLabel: "Yuborish",
    });
    if (!explanation) return;
    try {
      await compensationApi.submitExplanation(item.id, explanation);
      qc.invalidateQueries({ queryKey: ["my-adjustments"] });
      toast.success("Tushuntirish yuborildi");
    } catch (e: any) { toast.error(e?.response?.data?.message || "Yuborilmadi"); }
  };

  const acknowledge = async (item: any) => {
    const approved = await confirm({
      title: "Buyruq bilan tanishdingizmi?",
      description: `Buyruq ${item.orderNumber || "raqamsiz"} bilan tanishganingiz audit tarixida qayd etiladi.`,
      confirmLabel: "Tanishdim",
    });
    if (!approved) return;
    try {
      await compensationApi.acknowledgeAdjustment(item.id);
      qc.invalidateQueries({ queryKey: ["my-adjustments"] });
      toast.success("Tanishganingiz qayd etildi");
    } catch (e: any) { toast.error(e?.response?.data?.message || "Tasdiqlanmadi"); }
  };

  return (
    <EmployeeScreen title="Bonus va avans" subtitle="KPI, mukofot, tushuntirish va avanslarim">
      <main className="px-4 pt-2 sm:p-6 space-y-4 sm:space-y-5 max-w-5xl mx-auto">
        <Surface className="grid gap-3 p-4 sm:grid-cols-2">
          <Field label="Oy">
            <Select value={month} onChange={(e) => setMonth(+e.target.value)}>{Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}-oy</option>)}</Select>
          </Field>
          <Field label="Yil">
            <Input type="number" value={year} onChange={(e) => setYear(+e.target.value)} />
          </Field>
        </Surface>

        <Surface as="section" className="p-5">
          <div className="flex items-center gap-2 mb-4"><HandCoins className="w-5 h-5 text-emerald-500" /><h2 className="font-bold">Avans so‘rash</h2></div>
          <div className="grid sm:grid-cols-3 gap-3">
            <Input aria-label="Avans summasi" type="number" min="1" placeholder="Summa" value={amount} onChange={(e) => setAmount(e.target.value)} />
            <Input aria-label="Avans sababi" placeholder="Sabab yoki izoh" value={note} onChange={(e) => setNote(e.target.value)} />
            <Button disabled={!amount} loading={request.isPending} loadingLabel="Yuborilmoqda..." onClick={() => request.mutate()}>So‘rov yuborish</Button>
          </div>
        </Surface>

        <section className="space-y-3">
          <h2 className="font-bold flex items-center gap-2"><Trophy className="w-5 h-5 text-amber-500" /> KPI, mukofot va ushlanmalar</h2>
          {adjustmentsQuery.isLoading && <StatePanel kind="loading" title="Yozuvlar yuklanmoqda" />}
          {adjustmentsQuery.isError && <StatePanel kind="error" title="Yozuvlarni yuklab bo‘lmadi" actionLabel="Qayta urinish" onAction={() => void adjustmentsQuery.refetch()} />}
          {!adjustmentsQuery.isLoading && !adjustmentsQuery.isError && (adjustments as any[]).length === 0 && <StatePanel title="Bu davr uchun yozuv yo‘q" />}
          {(adjustments as any[]).map((item) => <Surface key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3"><div className="flex-1"><b>{labels[item.type] || item.type}</b><p className="text-sm text-[var(--text-muted)] mt-1">{item.reason} · {labels[item.status] || item.status}</p></div><b>{formatMoney(item.approvedAmount ?? item.proposedAmount)}</b>{item.status === "PENDING_EXPLANATION" && <Button onClick={() => void explain(item)}><MessageSquareText className="w-4 h-4" /> Tushuntirish berish</Button>}{item.status === "PENDING_ACKNOWLEDGEMENT" && <Button onClick={() => void acknowledge(item)}>Buyruq bilan tanishdim</Button>}</Surface>)}
        </section>

        <section className="space-y-3">
          <h2 className="font-bold flex items-center gap-2"><HandCoins className="w-5 h-5 text-emerald-500" /> Avanslarim</h2>
          {advancesQuery.isLoading && <StatePanel kind="loading" title="Avanslar yuklanmoqda" />}
          {advancesQuery.isError && <StatePanel kind="error" title="Avanslarni yuklab bo‘lmadi" actionLabel="Qayta urinish" onAction={() => void advancesQuery.refetch()} />}
          {!advancesQuery.isLoading && !advancesQuery.isError && (advances as any[]).length === 0 && <StatePanel title="Bu davr uchun avans yo‘q" />}
          {(advances as any[]).map((item) => <Surface key={item.id} className="p-4 flex items-center gap-3"><div className="flex-1"><b>{item.note || "Avans"}</b><p className="text-sm text-[var(--text-muted)] mt-1">{labels[item.status] || item.status}</p></div><b>{formatMoney(item.paidAmount ?? item.approvedAmount ?? item.requestedAmount)}</b></Surface>)}
        </section>
      </main>
    </EmployeeScreen>
  );
}
