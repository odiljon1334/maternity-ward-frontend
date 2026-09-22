"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { toast } from "sonner";
import { CheckCircle2, HandCoins, Plus, Scale, Trophy, XCircle } from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { compensationApi, employeesApi } from "@/lib/api";
import { formatMoney, isSuperLike } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";

const TYPES = [
  { value: "OVERTIME_PAY", label: "Tasdiqlangan overtime to‘lovi" },
  { value: "CONTRACTUAL_KPI_BONUS", label: "Shartli KPI bonusi" },
  { value: "ONE_TIME_AWARD", label: "Bir martalik mukofot" },
  { value: "DISCIPLINARY_FINE", label: "Intizomiy jarima" },
  { value: "OTHER_LAWFUL_DEDUCTION", label: "Boshqa qonuniy ushlanma" },
];

const STATUS: Record<string, string> = {
  PENDING_EXPLANATION: "Xodim tushuntirishi kutilmoqda",
  PENDING_APPROVAL: "Qaror kutilmoqda",
  PENDING_ACKNOWLEDGEMENT: "Xodim buyruq bilan tanishishi kutilmoqda",
  APPROVED: "Tasdiqlangan",
  REJECTED: "Rad etilgan",
  PAID: "To‘langan",
  REQUESTED: "So‘ralgan",
  APPLIED: "Payrollga qo‘llangan",
};

export default function CompensationPage() {
  const qc = useQueryClient();
  const { user, selectedHospital } = useAuthStore();
  const targetHospitalId = isSuperLike(user?.role) ? selectedHospital?.id : undefined;
  const now = dayjs();
  const [month, setMonth] = useState(now.month() + 1);
  const [year, setYear] = useState(now.year());
  const [tab, setTab] = useState<"adjustments" | "advances">("adjustments");
  const [form, setForm] = useState({ employeeId: "", type: TYPES[0].value, amount: "", reason: "", policyReference: "" });
  const [advance, setAdvance] = useState({ employeeId: "", amount: "", note: "" });

  const params = { month, year, targetHospitalId };
  const { data: employeeResult } = useQuery({
    queryKey: ["compensation-employees", targetHospitalId],
    queryFn: () => employeesApi.list({ limit: 500, targetHospitalId }),
  });
  const employees: any[] = employeeResult?.data ?? employeeResult?.employees ?? employeeResult ?? [];
  const { data: adjustments = [] } = useQuery({
    queryKey: ["compensation-adjustments", params],
    queryFn: () => compensationApi.adjustments(params),
  });
  const { data: advances = [] } = useQuery({
    queryKey: ["compensation-advances", params],
    queryFn: () => compensationApi.advances(params),
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["compensation-adjustments"] });
    qc.invalidateQueries({ queryKey: ["compensation-advances"] });
    qc.invalidateQueries({ queryKey: ["payroll"] });
  };
  const createAdjustment = useMutation({
    mutationFn: () => compensationApi.createAdjustment({
      employeeId: form.employeeId,
      month,
      year,
      type: form.type,
      proposedAmount: form.type === "OVERTIME_PAY" ? 1 : Number(form.amount),
      reason: form.reason,
      policyReference: form.policyReference || undefined,
      evidence: form.type === "OVERTIME_PAY" && form.policyReference
        ? { consentOrOrderReference: form.policyReference }
        : undefined,
    }, { targetHospitalId }),
    onSuccess: () => { refresh(); setForm({ employeeId: "", type: TYPES[0].value, amount: "", reason: "", policyReference: "" }); toast.success("Yozuv yaratildi"); },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Saqlanmadi"),
  });
  const createAdvance = useMutation({
    mutationFn: () => compensationApi.createAdvance({ employeeId: advance.employeeId, month, year, amount: Number(advance.amount), note: advance.note }, { targetHospitalId }),
    onSuccess: () => { refresh(); setAdvance({ employeeId: "", amount: "", note: "" }); toast.success("Avans so‘rovi yaratildi"); },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Saqlanmadi"),
  });

  const decideAdjustment = async (item: any, decision: "APPROVED" | "REJECTED") => {
    const decisionReason = window.prompt(decision === "APPROVED" ? "Qaror asosini kiriting" : "Rad etish sababini kiriting");
    if (!decisionReason) return;
    const body: any = { decision, decisionReason };
    if (decision === "APPROVED") body.approvedAmount = Number(item.proposedAmount);
    if (decision === "APPROVED" && item.type === "DISCIPLINARY_FINE") {
      const orderNumber = window.prompt("Buyruq raqami");
      const orderDate = window.prompt("Buyruq sanasi (YYYY-MM-DD)", dayjs().format("YYYY-MM-DD"));
      if (!orderNumber || !orderDate) return;
      body.orderNumber = orderNumber;
      body.orderDate = orderDate;
      body.finePercent = 30;
      if (!item.employeeExplanation) {
        body.explanationRefused = window.confirm("Xodim tushuntirish berishdan bosh tortgani dalolatnoma bilan qayd etilganmi?");
        if (body.explanationRefused) {
          body.refusalActReference = window.prompt("Bosh tortish dalolatnomasi raqami") || undefined;
          if (!body.refusalActReference) return;
        }
      }
    }
    try {
      await compensationApi.decideAdjustment(item.id, body, { targetHospitalId });
      refresh(); toast.success("Qaror saqlandi");
    } catch (e: any) { toast.error(e?.response?.data?.message || "Qaror saqlanmadi"); }
  };

  const decideAdvance = async (item: any, decision: "APPROVED" | "REJECTED") => {
    try {
      await compensationApi.decideAdvance(item.id, { decision, approvedAmount: decision === "APPROVED" ? Number(item.requestedAmount) : undefined }, { targetHospitalId });
      refresh(); toast.success("Qaror saqlandi");
    } catch (e: any) { toast.error(e?.response?.data?.message || "Qaror saqlanmadi"); }
  };

  const markPaid = async (item: any) => {
    const reference = window.prompt("Bank/to‘lov hujjati raqami");
    if (!reference) return;
    try {
      await compensationApi.markAdvancePaid(item.id, { paidAmount: Number(item.approvedAmount), paymentReference: reference }, { targetHospitalId });
      refresh(); toast.success("Avans to‘landi deb belgilandi");
    } catch (e: any) { toast.error(e?.response?.data?.message || "Saqlanmadi"); }
  };

  const total = useMemo(() => (adjustments as any[]).filter((x) => x.status === "APPROVED").reduce((s, x) => s + Number(x.approvedAmount || 0), 0), [adjustments]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0d17]">
      <Topbar title="KPI, jarima va avans" subtitle="Qonuniy asos va qaror auditi bilan hisob-kitob" />
      <main className="p-4 sm:p-6 space-y-5">
        <div className="card p-4 flex flex-wrap items-center gap-3">
          <select className="input w-36" value={month} onChange={(e) => setMonth(+e.target.value)}>{Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}-oy</option>)}</select>
          <input className="input w-32" type="number" value={year} onChange={(e) => setYear(+e.target.value)} />
          <div className="ml-auto text-sm text-slate-500">Tasdiqlangan yozuvlar: <b>{formatMoney(total)}</b></div>
        </div>

        <div className="flex gap-2">
          <button className={tab === "adjustments" ? "btn-primary" : "btn-secondary"} onClick={() => setTab("adjustments")}><Trophy className="w-4 h-4" /> KPI va tuzatishlar</button>
          <button className={tab === "advances" ? "btn-primary" : "btn-secondary"} onClick={() => setTab("advances")}><HandCoins className="w-4 h-4" /> Avanslar</button>
        </div>

        {tab === "adjustments" ? <>
          <section className="card p-5 grid md:grid-cols-2 lg:grid-cols-6 gap-3">
            <select className="input lg:col-span-2" value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })}><option value="">Xodimni tanlang</option>{employees.map((e) => <option key={e.id} value={e.id}>{e.fullName}</option>)}</select>
            <select className="input lg:col-span-2" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>{TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</select>
            <input className="input" type="number" disabled={form.type === "OVERTIME_PAY"} placeholder={form.type === "OVERTIME_PAY" ? "Avtomatik hisoblanadi" : "Summa"} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            <input className="input" placeholder={form.type === "OVERTIME_PAY" ? "Rozilik/buyruq hujjati" : "Nizom/band"} value={form.policyReference} onChange={(e) => setForm({ ...form, policyReference: e.target.value })} />
            <input className="input lg:col-span-5" placeholder="Aniq sabab" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
            <button className="btn-primary" disabled={!form.employeeId || (form.type !== "OVERTIME_PAY" && !form.amount) || !form.reason || (form.type === "OVERTIME_PAY" && !form.policyReference) || createAdjustment.isPending} onClick={() => createAdjustment.mutate()}><Plus className="w-4 h-4" /> Yaratish</button>
          </section>
          <section className="space-y-3">{(adjustments as any[]).map((item) => <div key={item.id} className="card p-4 flex flex-col lg:flex-row lg:items-center gap-3"><Scale className="w-5 h-5 text-indigo-500" /><div className="flex-1"><b>{item.employee?.fullName}</b><div className="text-sm text-slate-500">{TYPES.find((t) => t.value === item.type)?.label} · {item.reason} · {STATUS[item.status] || item.status}</div></div><b>{formatMoney(item.approvedAmount ?? item.proposedAmount)}</b>{["PENDING_APPROVAL", "PENDING_EXPLANATION"].includes(item.status) && <div className="flex gap-2"><button className="btn-secondary" onClick={() => decideAdjustment(item, "REJECTED")}><XCircle className="w-4 h-4" /> Rad</button><button className="btn-primary" onClick={() => decideAdjustment(item, "APPROVED")}><CheckCircle2 className="w-4 h-4" /> Tasdiq</button></div>}</div>)}</section>
        </> : <>
          <section className="card p-5 grid md:grid-cols-4 gap-3">
            <select className="input" value={advance.employeeId} onChange={(e) => setAdvance({ ...advance, employeeId: e.target.value })}><option value="">Xodimni tanlang</option>{employees.map((e) => <option key={e.id} value={e.id}>{e.fullName}</option>)}</select>
            <input className="input" type="number" placeholder="Avans summasi" value={advance.amount} onChange={(e) => setAdvance({ ...advance, amount: e.target.value })} />
            <input className="input" placeholder="Izoh" value={advance.note} onChange={(e) => setAdvance({ ...advance, note: e.target.value })} />
            <button className="btn-primary" disabled={!advance.employeeId || !advance.amount || createAdvance.isPending} onClick={() => createAdvance.mutate()}><Plus className="w-4 h-4" /> So‘rov yaratish</button>
          </section>
          <section className="space-y-3">{(advances as any[]).map((item) => <div key={item.id} className="card p-4 flex flex-col lg:flex-row lg:items-center gap-3"><HandCoins className="w-5 h-5 text-emerald-500" /><div className="flex-1"><b>{item.employee?.fullName}</b><div className="text-sm text-slate-500">{item.note || "Avans"} · {STATUS[item.status] || item.status}</div></div><b>{formatMoney(item.paidAmount ?? item.approvedAmount ?? item.requestedAmount)}</b>{item.status === "REQUESTED" && <div className="flex gap-2"><button className="btn-secondary" onClick={() => decideAdvance(item, "REJECTED")}>Rad</button><button className="btn-primary" onClick={() => decideAdvance(item, "APPROVED")}>Tasdiq</button></div>}{item.status === "APPROVED" && <button className="btn-primary" onClick={() => markPaid(item)}>To‘landi</button>}</div>)}</section>
        </>}
      </main>
    </div>
  );
}
