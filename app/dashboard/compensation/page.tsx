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
import {
  Button,
  ConfirmDialog,
  Dialog,
  Field,
  Input,
  Select,
  StatePanel,
  Surface,
  Textarea,
} from "@/components/ui";

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
  const [adjustmentDecision, setAdjustmentDecision] = useState<null | {
    item: any;
    decision: "APPROVED" | "REJECTED";
    reason: string;
    orderNumber: string;
    orderDate: string;
    explanationRefused: boolean;
    refusalActReference: string;
  }>(null);
  const [advanceDecision, setAdvanceDecision] = useState<null | { item: any; decision: "APPROVED" | "REJECTED" }>(null);
  const [paymentItem, setPaymentItem] = useState<any>(null);
  const [paymentReference, setPaymentReference] = useState("");

  const params = { month, year, targetHospitalId };
  const {
    data: employeeResult,
    isLoading: employeesLoading,
    isError: employeesError,
    isFetching: employeesFetching,
    refetch: refetchEmployees,
  } = useQuery({
    queryKey: ["compensation-employees", targetHospitalId],
    queryFn: () => employeesApi.list({ limit: 500, targetHospitalId }),
  });
  const employees: any[] = employeeResult?.data ?? employeeResult?.employees ?? employeeResult ?? [];
  const {
    data: adjustments = [],
    isLoading: adjustmentsLoading,
    isError: adjustmentsError,
    isFetching: adjustmentsFetching,
    refetch: refetchAdjustments,
  } = useQuery({
    queryKey: ["compensation-adjustments", params],
    queryFn: () => compensationApi.adjustments(params),
  });
  const {
    data: advances = [],
    isLoading: advancesLoading,
    isError: advancesError,
    isFetching: advancesFetching,
    refetch: refetchAdvances,
  } = useQuery({
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

  const decideAdjustmentMutation = useMutation({
    mutationFn: async () => {
      if (!adjustmentDecision) return;
      const { item, decision, reason, orderNumber, orderDate, explanationRefused, refusalActReference } = adjustmentDecision;
      const body: any = { decision, decisionReason: reason.trim() };
      if (decision === "APPROVED") body.approvedAmount = Number(item.proposedAmount);
      if (decision === "APPROVED" && item.type === "DISCIPLINARY_FINE") {
        body.orderNumber = orderNumber.trim();
        body.orderDate = orderDate;
        body.finePercent = 30;
        if (!item.employeeExplanation) {
          body.explanationRefused = explanationRefused;
          if (explanationRefused) body.refusalActReference = refusalActReference.trim();
        }
      }
      return compensationApi.decideAdjustment(item.id, body, { targetHospitalId });
    },
    onSuccess: () => {
      setAdjustmentDecision(null);
      refresh();
      toast.success("Qaror saqlandi");
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Qaror saqlanmadi"),
  });

  const decideAdvanceMutation = useMutation({
    mutationFn: ({ item, decision }: { item: any; decision: "APPROVED" | "REJECTED" }) =>
      compensationApi.decideAdvance(item.id, {
        decision,
        approvedAmount: decision === "APPROVED" ? Number(item.requestedAmount) : undefined,
      }, { targetHospitalId }),
    onSuccess: () => {
      setAdvanceDecision(null);
      refresh();
      toast.success("Qaror saqlandi");
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Qaror saqlanmadi"),
  });

  const markPaidMutation = useMutation({
    mutationFn: () => compensationApi.markAdvancePaid(paymentItem.id, {
      paidAmount: Number(paymentItem.approvedAmount),
      paymentReference: paymentReference.trim(),
    }, { targetHospitalId }),
    onSuccess: () => {
      setPaymentItem(null);
      setPaymentReference("");
      refresh();
      toast.success("Avans to‘landi deb belgilandi");
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Saqlanmadi"),
  });

  const openAdjustmentDecision = (item: any, decision: "APPROVED" | "REJECTED") => {
    setAdjustmentDecision({
      item,
      decision,
      reason: "",
      orderNumber: "",
      orderDate: dayjs().format("YYYY-MM-DD"),
      explanationRefused: false,
      refusalActReference: "",
    });
  };

  const total = useMemo(() => (adjustments as any[]).filter((x) => x.status === "APPROVED").reduce((s, x) => s + Number(x.approvedAmount || 0), 0), [adjustments]);
  const policyMeta = TYPE_HELP[form.type] ?? TYPE_HELP.ONE_TIME_AWARD;
  const canCreateAdjustment =
    !!form.employeeId &&
    (form.type === "OVERTIME_PAY" || !!form.amount) &&
    !!form.reason.trim() &&
    (!policyMeta.required || !!form.policyReference.trim()) &&
    !createAdjustment.isPending;
  const isFineApproval = adjustmentDecision?.decision === "APPROVED" && adjustmentDecision?.item?.type === "DISCIPLINARY_FINE";
  const canSubmitAdjustmentDecision = Boolean(
    adjustmentDecision?.reason.trim() &&
    (!isFineApproval || (
      adjustmentDecision?.orderNumber.trim() &&
      adjustmentDecision?.orderDate &&
      (!adjustmentDecision?.explanationRefused || adjustmentDecision?.refusalActReference.trim())
    )),
  );

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <Topbar
        title="KPI, jarima va avans"
        subtitle="Qonuniy asos va qaror auditi bilan hisob-kitob"
      />
      <main className="mx-auto max-w-7xl space-y-5 p-4 sm:p-6">
        <Surface className="flex flex-col gap-4 p-4 sm:flex-row sm:items-end">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Oy">
              <Select
                className="min-w-36"
                value={month}
                onChange={(e) => setMonth(+e.target.value)}
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>{i + 1}-oy</option>
                ))}
              </Select>
            </Field>
            <Field label="Yil">
              <Input
                className="min-w-32"
                type="number"
                value={year}
                onChange={(e) => setYear(+e.target.value)}
              />
            </Field>
          </div>
          <div className="sm:ml-auto rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
            <p className="text-xs font-medium text-emerald-500">Tasdiqlangan yozuvlar</p>
            <p className="mt-0.5 text-lg font-bold text-theme">{formatMoney(total)}</p>
          </div>
        </Surface>

        {employeesError && (
          <StatePanel
            kind="error"
            title="Xodimlar ro‘yxatini yuklab bo‘lmadi"
            description="Yangi KPI, jarima yoki avans yozuvi yaratish uchun ro‘yxatni qayta yuklang."
            actionLabel="Qayta urinish"
            onAction={() => void refetchEmployees()}
            actionLoading={employeesFetching}
            className="min-h-32"
          />
        )}

        <div className="flex flex-wrap gap-2">
          <Button
            variant={tab === "adjustments" ? "primary" : "secondary"}
            onClick={() => setTab("adjustments")}
          >
            <Trophy className="h-4 w-4" /> KPI va tuzatishlar
          </Button>
          <Button
            variant={tab === "advances" ? "primary" : "secondary"}
            onClick={() => setTab("advances")}
          >
            <HandCoins className="h-4 w-4" /> Avanslar
          </Button>
        </div>

        {tab === "adjustments" ? (
          <>
            <Surface className="overflow-hidden">
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
                  <Field label={<span className="flex items-center gap-1.5"><UserRound className="h-3.5 w-3.5" /> Xodim</span>} className="xl:col-span-4">
                    <Select
                      disabled={employeesLoading || employeesError}
                      value={form.employeeId}
                      onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                    >
                      <option value="">Xodimni tanlang</option>
                      {employees.map((employee) => (
                        <option key={employee.id} value={employee.id}>{employee.fullName}</option>
                      ))}
                    </Select>
                  </Field>

                  <Field label="Hisob turi" className="xl:col-span-4">
                    <Select
                      value={form.type}
                      onChange={(e) => setForm({ ...form, type: e.target.value, policyReference: "" })}
                    >
                      {TYPES.map((type) => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </Select>
                  </Field>

                  <Field label={<span className="flex items-center gap-1.5"><Calculator className="h-3.5 w-3.5" /> Summa</span>} className="xl:col-span-4">
                    <Input
                      type="number"
                      min="0"
                      disabled={form.type === "OVERTIME_PAY"}
                      placeholder={form.type === "OVERTIME_PAY" ? "Davomatdan avtomatik hisoblanadi" : "Masalan: 500 000"}
                      value={form.amount}
                      onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    />
                  </Field>

                  <Field label="Sabab" className="md:col-span-2 xl:col-span-7">
                    <Textarea
                      placeholder="Nima sababdan berilayotgani yoki ushlab qolinayotganini aniq yozing"
                      value={form.reason}
                      onChange={(e) => setForm({ ...form, reason: e.target.value })}
                    />
                  </Field>

                  <Field
                    label={<span className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" /> {policyMeta.label}</span>}
                    required={policyMeta.required}
                    hint={policyMeta.help}
                    className="md:col-span-2 xl:col-span-5"
                  >
                    <Input
                      placeholder={policyMeta.placeholder}
                      value={form.policyReference}
                      onChange={(e) => setForm({ ...form, policyReference: e.target.value })}
                    />
                  </Field>
                </div>

                <div className="flex flex-col gap-3 rounded-xl border border-indigo-500/20 bg-indigo-500/10 p-4 sm:flex-row sm:items-center">
                  <Info className="h-5 w-5 shrink-0 text-indigo-400" />
                  <p className="flex-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    <b>Hujjat/band nima?</b> Bu qaror qaysi tasdiqlangan qoida yoki buyruqqa asoslanganini ko‘rsatadi. Hujjat hali mavjud bo‘lmasa, intizomiy jarimani shoshilmasdan faqat qonuniy workflow orqali rasmiylashtiring.
                  </p>
                  <Button
                    className="shrink-0"
                    disabled={!canCreateAdjustment}
                    loading={createAdjustment.isPending}
                    onClick={() => createAdjustment.mutate()}
                  >
                    <Plus className="h-4 w-4" />
                    Yozuv yaratish
                  </Button>
                </div>
              </div>
            </Surface>

            <section className="space-y-3">
              {adjustmentsLoading && <StatePanel kind="loading" title="Hisob-kitob yozuvlari yuklanmoqda" />}
              {adjustmentsError && (
                <StatePanel
                  kind="error"
                  title="Hisob-kitob yozuvlarini yuklab bo‘lmadi"
                  actionLabel="Qayta urinish"
                  onAction={() => void refetchAdjustments()}
                  actionLoading={adjustmentsFetching}
                />
              )}
              {!adjustmentsLoading && !adjustmentsError && (adjustments as any[]).length === 0 && (
                <StatePanel
                  title="Bu davr uchun yozuv yo‘q"
                  description="Yangi KPI, mukofot yoki qonuniy tuzatish yuqoridagi forma orqali yaratiladi."
                  icon={Scale}
                />
              )}
              {!adjustmentsError && (adjustments as any[]).map((item) => (
                <Surface key={item.id} className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center">
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
                      <Button variant="secondary" onClick={() => openAdjustmentDecision(item, "REJECTED")}>
                        <XCircle className="h-4 w-4" /> Rad
                      </Button>
                      <Button onClick={() => openAdjustmentDecision(item, "APPROVED")}>
                        <CheckCircle2 className="h-4 w-4" /> Tasdiq
                      </Button>
                    </div>
                  )}
                </Surface>
              ))}
            </section>
          </>
        ) : (
          <>
            <Surface className="overflow-hidden">
              <div className="border-b border-theme bg-gradient-to-r from-emerald-500/10 to-cyan-500/5 px-5 py-4">
                <h2 className="flex items-center gap-2 font-bold text-theme">
                  <HandCoins className="h-5 w-5 text-emerald-500" /> Yangi avans so‘rovi
                </h2>
              </div>
              <div className="grid gap-4 p-5 md:grid-cols-3 xl:grid-cols-4">
                <Field label="Xodim">
                  <Select disabled={employeesLoading || employeesError} value={advance.employeeId} onChange={(e) => setAdvance({ ...advance, employeeId: e.target.value })}>
                    <option value="">Xodimni tanlang</option>
                    {employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.fullName}</option>)}
                  </Select>
                </Field>
                <Field label="Avans summasi">
                  <Input type="number" min="0" placeholder="Masalan: 1 000 000" value={advance.amount} onChange={(e) => setAdvance({ ...advance, amount: e.target.value })} />
                </Field>
                <Field label="Izoh">
                  <Input placeholder="Ixtiyoriy izoh" value={advance.note} onChange={(e) => setAdvance({ ...advance, note: e.target.value })} />
                </Field>
                <Button className="self-end" disabled={!advance.employeeId || !advance.amount} loading={createAdvance.isPending} onClick={() => createAdvance.mutate()}>
                  <Plus className="h-4 w-4" /> So‘rov yaratish
                </Button>
              </div>
            </Surface>
            <section className="space-y-3">
              {advancesLoading && <StatePanel kind="loading" title="Avans so‘rovlari yuklanmoqda" />}
              {advancesError && (
                <StatePanel
                  kind="error"
                  title="Avans so‘rovlarini yuklab bo‘lmadi"
                  actionLabel="Qayta urinish"
                  onAction={() => void refetchAdvances()}
                  actionLoading={advancesFetching}
                />
              )}
              {!advancesLoading && !advancesError && (advances as any[]).length === 0 && (
                <StatePanel title="Bu davr uchun avans so‘rovi yo‘q" icon={HandCoins} />
              )}
              {!advancesError && (advances as any[]).map((item) => (
                <Surface key={item.id} className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
                  <HandCoins className="h-5 w-5 text-emerald-500" />
                  <div className="flex-1">
                    <b className="text-theme">{item.employee?.fullName}</b>
                    <p className="text-sm text-muted">{item.note || "Avans"} · {STATUS[item.status] || item.status}</p>
                  </div>
                  <b className="text-theme">{formatMoney(item.paidAmount ?? item.approvedAmount ?? item.requestedAmount)}</b>
                  {item.status === "REQUESTED" && (
                    <div className="flex gap-2">
                      <Button variant="secondary" onClick={() => setAdvanceDecision({ item, decision: "REJECTED" })}>Rad</Button>
                      <Button onClick={() => setAdvanceDecision({ item, decision: "APPROVED" })}>Tasdiq</Button>
                    </div>
                  )}
                  {item.status === "APPROVED" && <Button onClick={() => { setPaymentItem(item); setPaymentReference(""); }}>To‘landi</Button>}
                </Surface>
              ))}
            </section>
          </>
        )}
      </main>

      <Dialog
        open={Boolean(adjustmentDecision)}
        onClose={() => setAdjustmentDecision(null)}
        title={adjustmentDecision?.decision === "APPROVED" ? "Hisob-kitobni tasdiqlash" : "Hisob-kitobni rad etish"}
        description={`${adjustmentDecision?.item?.employee?.fullName ?? "Xodim"} bo‘yicha qaror asosini kiriting.`}
        footer={(
          <>
            <Button variant="secondary" onClick={() => setAdjustmentDecision(null)} disabled={decideAdjustmentMutation.isPending}>Bekor qilish</Button>
            <Button
              variant={adjustmentDecision?.decision === "REJECTED" ? "danger" : "primary"}
              disabled={!canSubmitAdjustmentDecision}
              loading={decideAdjustmentMutation.isPending}
              onClick={() => decideAdjustmentMutation.mutate()}
            >
              Qarorni saqlash
            </Button>
          </>
        )}
      >
        {adjustmentDecision && <div className="space-y-4">
          <Field label={adjustmentDecision.decision === "APPROVED" ? "Qaror asosi" : "Rad etish sababi"} required>
            <Textarea
              value={adjustmentDecision.reason}
              onChange={(e) => setAdjustmentDecision({ ...adjustmentDecision, reason: e.target.value })}
              placeholder="Qarorning aniq asosini yozing"
              autoFocus
            />
          </Field>
          {isFineApproval && <>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Buyruq raqami" required>
                <Input value={adjustmentDecision.orderNumber} onChange={(e) => setAdjustmentDecision({ ...adjustmentDecision, orderNumber: e.target.value })} placeholder="Masalan: 12-J" />
              </Field>
              <Field label="Buyruq sanasi" required>
                <Input type="date" value={adjustmentDecision.orderDate} onChange={(e) => setAdjustmentDecision({ ...adjustmentDecision, orderDate: e.target.value })} />
              </Field>
            </div>
            {!adjustmentDecision.item.employeeExplanation && <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-3">
              <label className="flex cursor-pointer items-start gap-3 text-sm text-[var(--text-secondary)]">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 accent-indigo-600"
                  checked={adjustmentDecision.explanationRefused}
                  onChange={(e) => setAdjustmentDecision({ ...adjustmentDecision, explanationRefused: e.target.checked, refusalActReference: "" })}
                />
                Xodim tushuntirish berishdan bosh tortgani dalolatnoma bilan qayd etilgan
              </label>
              {adjustmentDecision.explanationRefused && <Field label="Dalolatnoma raqami" required className="mt-3">
                <Input value={adjustmentDecision.refusalActReference} onChange={(e) => setAdjustmentDecision({ ...adjustmentDecision, refusalActReference: e.target.value })} />
              </Field>}
            </div>}
          </>}
        </div>}
      </Dialog>

      <ConfirmDialog
        open={Boolean(advanceDecision)}
        onClose={() => setAdvanceDecision(null)}
        onConfirm={() => advanceDecision && decideAdvanceMutation.mutate(advanceDecision)}
        title={advanceDecision?.decision === "APPROVED" ? "Avans tasdiqlansinmi?" : "Avans rad etilsinmi?"}
        description={`${advanceDecision?.item?.employee?.fullName ?? "Xodim"} — ${formatMoney(advanceDecision?.item?.requestedAmount ?? 0)}`}
        confirmLabel={advanceDecision?.decision === "APPROVED" ? "Tasdiqlash" : "Rad etish"}
        tone={advanceDecision?.decision === "APPROVED" ? "primary" : "danger"}
        loading={decideAdvanceMutation.isPending}
      />

      <Dialog
        open={Boolean(paymentItem)}
        onClose={() => { setPaymentItem(null); setPaymentReference(""); }}
        title="Avans to‘lovini qayd etish"
        description={`${paymentItem?.employee?.fullName ?? "Xodim"} uchun bank yoki to‘lov hujjati raqamini kiriting.`}
        footer={(
          <>
            <Button variant="secondary" onClick={() => { setPaymentItem(null); setPaymentReference(""); }} disabled={markPaidMutation.isPending}>Bekor qilish</Button>
            <Button disabled={!paymentReference.trim()} loading={markPaidMutation.isPending} onClick={() => markPaidMutation.mutate()}>To‘landi deb belgilash</Button>
          </>
        )}
      >
        <Field label="To‘lov hujjati raqami" required>
          <Input value={paymentReference} onChange={(e) => setPaymentReference(e.target.value)} placeholder="Masalan: BANK-2026-09-001" autoFocus />
        </Field>
      </Dialog>
    </div>
  );
}
