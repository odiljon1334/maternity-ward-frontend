"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { toast } from "sonner";
import {
  Calculator,
  CheckCircle2,
  FileText,
  HandCoins,
  Info,
  Plus,
  Scale,
  Trophy,
  UserRound,
  XCircle,
} from "lucide-react";
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

const TYPE_HELP: Record<
  string,
  { label: string; placeholder: string; help: string; required: boolean }
> = {
  OVERTIME_PAY: {
    label: "Rozilik yoki buyruq hujjati",
    placeholder: "Masalan: Buyruq №12-A, 22.09.2026",
    help: "Qo‘shimcha ishga jalb qilish asosi va xodim roziligini ko‘rsatuvchi hujjat. Majburiy.",
    required: true,
  },
  CONTRACTUAL_KPI_BONUS: {
    label: "KPI nizomi va mezon bandi",
    placeholder: "Masalan: KPI nizomi 4.2-band",
    help: "Bonus qaysi tasdiqlangan KPI mezoni bo‘yicha hisoblanganini kiriting. Majburiy.",
    required: true,
  },
  ONE_TIME_AWARD: {
    label: "Mukofot asosi",
    placeholder: "Masalan: Direktor buyrug‘i №18-M",
    help: "Bir martalik mukofotga asos bo‘lgan buyruq yoki ichki hujjat. Hozircha ixtiyoriy.",
    required: false,
  },
  DISCIPLINARY_FINE: {
    label: "Ichki mehnat tartibi bandi",
    placeholder: "Masalan: IMTQ 7.3-band",
    help: "Qoidabuzarlik yozilgan ichki tartib bandi. 30%dan yuqori jarimada bu maydon majburiy bo‘ladi.",
    required: false,
  },
  OTHER_LAWFUL_DEDUCTION: {
    label: "Huquqiy asos yoki hujjat",
    placeholder: "Masalan: Ijro hujjati №245",
    help: "Ushlab qolishga ruxsat beruvchi rozilik, ijro hujjati yoki boshqa qonuniy asos.",
    required: false,
  },
};

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
  const policyMeta = TYPE_HELP[form.type] ?? TYPE_HELP.ONE_TIME_AWARD;
  const canCreateAdjustment =
    !!form.employeeId &&
    (form.type === "OVERTIME_PAY" || !!form.amount) &&
    !!form.reason.trim() &&
    (!policyMeta.required || !!form.policyReference.trim()) &&
    !createAdjustment.isPending;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#080b16]">
      <Topbar
        title="KPI, jarima va avans"
        subtitle="Qonuniy asos va qaror auditi bilan hisob-kitob"
      />
      <main className="mx-auto max-w-7xl space-y-5 p-4 sm:p-6">
        <section className="card flex flex-col gap-4 p-4 sm:flex-row sm:items-end">
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-muted">Oy</span>
              <select
                className="input-field min-w-36"
                value={month}
                onChange={(e) => setMonth(+e.target.value)}
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>{i + 1}-oy</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-muted">Yil</span>
              <input
                className="input-field min-w-32"
                type="number"
                value={year}
                onChange={(e) => setYear(+e.target.value)}
              />
            </label>
          </div>
          <div className="sm:ml-auto rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
            <p className="text-xs font-medium text-emerald-500">Tasdiqlangan yozuvlar</p>
            <p className="mt-0.5 text-lg font-bold text-theme">{formatMoney(total)}</p>
          </div>
        </section>

        <div className="flex flex-wrap gap-2">
          <button
            className={tab === "adjustments" ? "btn-primary" : "btn-secondary"}
            onClick={() => setTab("adjustments")}
          >
            <Trophy className="h-4 w-4" /> KPI va tuzatishlar
          </button>
          <button
            className={tab === "advances" ? "btn-primary" : "btn-secondary"}
            onClick={() => setTab("advances")}
          >
            <HandCoins className="h-4 w-4" /> Avanslar
          </button>
        </div>

        {tab === "adjustments" ? (
          <>
            <section className="card overflow-hidden">
              <div className="border-b border-theme bg-gradient-to-r from-indigo-500/10 to-violet-500/5 px-5 py-4">
                <h2 className="flex items-center gap-2 font-bold text-theme">
                  <Plus className="h-5 w-5 text-indigo-500" /> Yangi hisob-kitob yozuvi
                </h2>
                <p className="mt-1 text-sm text-muted">
                  Har bir bonus yoki ushlanma sabab va tasdiqlovchi hujjat bilan qayd etiladi.
                </p>
              </div>

              <div className="space-y-5 p-5">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-12">
                  <label className="block xl:col-span-4">
                    <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-muted">
                      <UserRound className="h-3.5 w-3.5" /> Xodim
                    </span>
                    <select
                      className="input-field"
                      value={form.employeeId}
                      onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                    >
                      <option value="">Xodimni tanlang</option>
                      {employees.map((employee) => (
                        <option key={employee.id} value={employee.id}>{employee.fullName}</option>
                      ))}
                    </select>
                  </label>

                  <label className="block xl:col-span-4">
                    <span className="mb-1.5 block text-xs font-semibold text-muted">Hisob turi</span>
                    <select
                      className="input-field"
                      value={form.type}
                      onChange={(e) => setForm({ ...form, type: e.target.value, policyReference: "" })}
                    >
                      {TYPES.map((type) => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </label>

                  <label className="block xl:col-span-4">
                    <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-muted">
                      <Calculator className="h-3.5 w-3.5" /> Summa
                    </span>
                    <input
                      className="input-field disabled:cursor-not-allowed disabled:opacity-60"
                      type="number"
                      min="0"
                      disabled={form.type === "OVERTIME_PAY"}
                      placeholder={form.type === "OVERTIME_PAY" ? "Davomatdan avtomatik hisoblanadi" : "Masalan: 500 000"}
                      value={form.amount}
                      onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    />
                  </label>

                  <label className="block md:col-span-2 xl:col-span-7">
                    <span className="mb-1.5 block text-xs font-semibold text-muted">Sabab</span>
                    <textarea
                      className="input-field min-h-24 resize-y"
                      placeholder="Nima sababdan berilayotgani yoki ushlab qolinayotganini aniq yozing"
                      value={form.reason}
                      onChange={(e) => setForm({ ...form, reason: e.target.value })}
                    />
                  </label>

                  <label className="block md:col-span-2 xl:col-span-5">
                    <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-muted">
                      <FileText className="h-3.5 w-3.5" /> {policyMeta.label}
                      {policyMeta.required && <span className="text-red-400">*</span>}
                    </span>
                    <input
                      className="input-field"
                      placeholder={policyMeta.placeholder}
                      value={form.policyReference}
                      onChange={(e) => setForm({ ...form, policyReference: e.target.value })}
                    />
                    <p className="mt-2 text-xs leading-5 text-muted">{policyMeta.help}</p>
                  </label>
                </div>

                <div className="flex flex-col gap-3 rounded-xl border border-indigo-500/20 bg-indigo-500/10 p-4 sm:flex-row sm:items-center">
                  <Info className="h-5 w-5 shrink-0 text-indigo-400" />
                  <p className="flex-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    <b>Hujjat/band nima?</b> Bu qaror qaysi tasdiqlangan qoida yoki buyruqqa asoslanganini ko‘rsatadi. Hujjat hali mavjud bo‘lmasa, intizomiy jarimani shoshilmasdan faqat qonuniy workflow orqali rasmiylashtiring.
                  </p>
                  <button
                    className="btn-primary shrink-0"
                    disabled={!canCreateAdjustment}
                    onClick={() => createAdjustment.mutate()}
                  >
                    <Plus className="h-4 w-4" />
                    {createAdjustment.isPending ? "Saqlanmoqda..." : "Yozuv yaratish"}
                  </button>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              {(adjustments as any[]).length === 0 && (
                <div className="card p-8 text-center">
                  <Scale className="mx-auto h-8 w-8 text-slate-400" />
                  <p className="mt-3 font-semibold text-theme">Bu davr uchun yozuv yo‘q</p>
                  <p className="mt-1 text-sm text-muted">Yangi KPI, mukofot yoki qonuniy tuzatish yuqoridagi forma orqali yaratiladi.</p>
                </div>
              )}
              {(adjustments as any[]).map((item) => (
                <article key={item.id} className="card flex flex-col gap-4 p-4 lg:flex-row lg:items-center">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                    <Scale className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <b className="text-theme">{item.employee?.fullName}</b>
                      <span className="badge-blue">{STATUS[item.status] || item.status}</span>
                    </div>
                    <p className="mt-1 text-sm text-muted">
                      {TYPES.find((type) => type.value === item.type)?.label} · {item.reason}
                    </p>
                    {item.policyReference && (
                      <p className="mt-1 text-xs text-indigo-400">Asos: {item.policyReference}</p>
                    )}
                  </div>
                  <b className="text-lg text-theme">{formatMoney(item.approvedAmount ?? item.proposedAmount)}</b>
                  {["PENDING_APPROVAL", "PENDING_EXPLANATION"].includes(item.status) && (
                    <div className="flex gap-2">
                      <button className="btn-secondary" onClick={() => decideAdjustment(item, "REJECTED")}>
                        <XCircle className="h-4 w-4" /> Rad
                      </button>
                      <button className="btn-primary" onClick={() => decideAdjustment(item, "APPROVED")}>
                        <CheckCircle2 className="h-4 w-4" /> Tasdiq
                      </button>
                    </div>
                  )}
                </article>
              ))}
            </section>
          </>
        ) : (
          <>
            <section className="card overflow-hidden">
              <div className="border-b border-theme bg-gradient-to-r from-emerald-500/10 to-cyan-500/5 px-5 py-4">
                <h2 className="flex items-center gap-2 font-bold text-theme">
                  <HandCoins className="h-5 w-5 text-emerald-500" /> Yangi avans so‘rovi
                </h2>
              </div>
              <div className="grid gap-4 p-5 md:grid-cols-3 xl:grid-cols-4">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-muted">Xodim</span>
                  <select className="input-field" value={advance.employeeId} onChange={(e) => setAdvance({ ...advance, employeeId: e.target.value })}>
                    <option value="">Xodimni tanlang</option>
                    {employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.fullName}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-muted">Avans summasi</span>
                  <input className="input-field" type="number" min="0" placeholder="Masalan: 1 000 000" value={advance.amount} onChange={(e) => setAdvance({ ...advance, amount: e.target.value })} />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-muted">Izoh</span>
                  <input className="input-field" placeholder="Ixtiyoriy izoh" value={advance.note} onChange={(e) => setAdvance({ ...advance, note: e.target.value })} />
                </label>
                <button className="btn-primary self-end" disabled={!advance.employeeId || !advance.amount || createAdvance.isPending} onClick={() => createAdvance.mutate()}>
                  <Plus className="h-4 w-4" /> So‘rov yaratish
                </button>
              </div>
            </section>
            <section className="space-y-3">
              {(advances as any[]).length === 0 && (
                <div className="card p-8 text-center text-sm text-muted">Bu davr uchun avans so‘rovi yo‘q.</div>
              )}
              {(advances as any[]).map((item) => (
                <article key={item.id} className="card flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
                  <HandCoins className="h-5 w-5 text-emerald-500" />
                  <div className="flex-1">
                    <b className="text-theme">{item.employee?.fullName}</b>
                    <p className="text-sm text-muted">{item.note || "Avans"} · {STATUS[item.status] || item.status}</p>
                  </div>
                  <b className="text-theme">{formatMoney(item.paidAmount ?? item.approvedAmount ?? item.requestedAmount)}</b>
                  {item.status === "REQUESTED" && (
                    <div className="flex gap-2">
                      <button className="btn-secondary" onClick={() => decideAdvance(item, "REJECTED")}>Rad</button>
                      <button className="btn-primary" onClick={() => decideAdvance(item, "APPROVED")}>Tasdiq</button>
                    </div>
                  )}
                  {item.status === "APPROVED" && <button className="btn-primary" onClick={() => markPaid(item)}>To‘landi</button>}
                </article>
              ))}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
