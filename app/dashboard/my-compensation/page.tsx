"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { toast } from "sonner";
import { HandCoins, MessageSquareText, Trophy } from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { compensationApi } from "@/lib/api";
import { formatMoney } from "@/lib/utils";

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
  const now = dayjs();
  const [month, setMonth] = useState(now.month() + 1);
  const [year, setYear] = useState(now.year());
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const params = { month, year };
  const { data: adjustments = [] } = useQuery({ queryKey: ["my-adjustments", params], queryFn: () => compensationApi.myAdjustments(params) });
  const { data: advances = [] } = useQuery({ queryKey: ["my-advances", params], queryFn: () => compensationApi.myAdvances(params) });
  const request = useMutation({
    mutationFn: () => compensationApi.requestMyAdvance({ month, year, amount: Number(amount), note }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["my-advances"] }); setAmount(""); setNote(""); toast.success("Avans so‘rovi yuborildi"); },
    onError: (e: any) => toast.error(e?.response?.data?.message || "So‘rov yuborilmadi"),
  });

  const explain = async (item: any) => {
    const explanation = window.prompt("Tushuntirishingizni to‘liq kiriting");
    if (!explanation) return;
    try {
      await compensationApi.submitExplanation(item.id, explanation);
      qc.invalidateQueries({ queryKey: ["my-adjustments"] });
      toast.success("Tushuntirish yuborildi");
    } catch (e: any) { toast.error(e?.response?.data?.message || "Yuborilmadi"); }
  };

  const acknowledge = async (item: any) => {
    if (!window.confirm(`Buyruq ${item.orderNumber || ""} bilan tanishganingizni tasdiqlaysizmi?`)) return;
    try {
      await compensationApi.acknowledgeAdjustment(item.id);
      qc.invalidateQueries({ queryKey: ["my-adjustments"] });
      toast.success("Tanishganingiz qayd etildi");
    } catch (e: any) { toast.error(e?.response?.data?.message || "Tasdiqlanmadi"); }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0d17]">
      <Topbar title="Bonus va avans" subtitle="KPI, mukofot, tushuntirish va avanslarim" />
      <main className="p-4 sm:p-6 space-y-5 max-w-5xl mx-auto">
        <div className="card p-4 flex gap-3">
          <select className="input-field w-36" value={month} onChange={(e) => setMonth(+e.target.value)}>{Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}-oy</option>)}</select>
          <input className="input-field w-32" type="number" value={year} onChange={(e) => setYear(+e.target.value)} />
        </div>

        <section className="card p-5">
          <div className="flex items-center gap-2 mb-4"><HandCoins className="w-5 h-5 text-emerald-500" /><h2 className="font-bold">Avans so‘rash</h2></div>
          <div className="grid sm:grid-cols-3 gap-3">
            <input className="input-field" type="number" placeholder="Summa" value={amount} onChange={(e) => setAmount(e.target.value)} />
            <input className="input-field" placeholder="Sabab yoki izoh" value={note} onChange={(e) => setNote(e.target.value)} />
            <button className="btn-primary" disabled={!amount || request.isPending} onClick={() => request.mutate()}>So‘rov yuborish</button>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="font-bold flex items-center gap-2"><Trophy className="w-5 h-5 text-amber-500" /> KPI, mukofot va ushlanmalar</h2>
          {(adjustments as any[]).length === 0 && <div className="card p-6 text-sm text-slate-500">Bu davr uchun yozuv yo‘q.</div>}
          {(adjustments as any[]).map((item) => <div key={item.id} className="card p-4 flex flex-col sm:flex-row sm:items-center gap-3"><div className="flex-1"><b>{labels[item.type] || item.type}</b><p className="text-sm text-slate-500 mt-1">{item.reason} · {labels[item.status] || item.status}</p></div><b>{formatMoney(item.approvedAmount ?? item.proposedAmount)}</b>{item.status === "PENDING_EXPLANATION" && <button className="btn-primary" onClick={() => explain(item)}><MessageSquareText className="w-4 h-4" /> Tushuntirish berish</button>}{item.status === "PENDING_ACKNOWLEDGEMENT" && <button className="btn-primary" onClick={() => acknowledge(item)}>Buyruq bilan tanishdim</button>}</div>)}
        </section>

        <section className="space-y-3">
          <h2 className="font-bold flex items-center gap-2"><HandCoins className="w-5 h-5 text-emerald-500" /> Avanslarim</h2>
          {(advances as any[]).length === 0 && <div className="card p-6 text-sm text-slate-500">Bu davr uchun avans yo‘q.</div>}
          {(advances as any[]).map((item) => <div key={item.id} className="card p-4 flex items-center gap-3"><div className="flex-1"><b>{item.note || "Avans"}</b><p className="text-sm text-slate-500 mt-1">{labels[item.status] || item.status}</p></div><b>{formatMoney(item.paidAmount ?? item.approvedAmount ?? item.requestedAmount)}</b></div>)}
        </section>
      </main>
    </div>
  );
}
