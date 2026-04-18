"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { paymentsApi, hospitalsApi } from "@/lib/api";
import { Topbar } from "@/components/layout/Topbar";
import { useAuthStore } from "@/stores/auth";
import { useForm } from "react-hook-form";
import {
  CreditCard, Plus, Building2, CheckCircle2, Clock, AlertCircle,
  X, Edit2, TrendingUp, Wallet,
} from "lucide-react";
import { cn, isSuperLike } from "@/lib/utils";

// ── Utils ────────────────────────────────────────
function formatAmount(n: number) {
  return n.toLocaleString("uz-UZ") + " so'm";
}

function periodLabel(period: string) {
  if (!period) return "";
  const [y, m] = period.split("-");
  const months = ["Yanvar","Fevral","Mart","Aprel","May","Iyun","Iyul","Avgust","Sentabr","Oktabr","Noyabr","Dekabr"];
  return `${months[parseInt(m) - 1]} ${y}`;
}

type OverviewItem = {
  id: string; name: string; code: string;
  employeeCount: number; expectedAmount: number; paidAmount: number;
  remainingAmount: number; status: "PAID" | "PENDING" | "OVERDUE";
  period: string; recentPayments: any[];
};

// ── Status Badge ─────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  if (status === "PAID")
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"><CheckCircle2 className="w-3 h-3" /> To'langan</span>;
  if (status === "PENDING")
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/15 text-amber-400 border border-amber-500/25"><Clock className="w-3 h-3" /> Kutilmoqda</span>;
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/15 text-red-400 border border-red-500/25"><AlertCircle className="w-3 h-3" /> Qarzdor</span>;
}

// ── Add Payment Modal ────────────────────────────
type PayForm = { hospitalId: string; payerName: string; amount: number; type: "MONTHLY" | "ANNUAL" | "OTHER"; note?: string };

function AddPaymentModal({ open, onClose, hospitals, preHospitalId, preAmount }: {
  open: boolean; onClose: () => void; hospitals: any[]; preHospitalId?: string; preAmount?: number;
}) {
  const qc = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<PayForm>({
    defaultValues: { hospitalId: preHospitalId || "", type: "MONTHLY", amount: preAmount || 0 },
  });

  const mutation = useMutation({
    mutationFn: (d: PayForm) => paymentsApi.create(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payments-overview"] });
      qc.invalidateQueries({ queryKey: ["payments-list"] });
      toast.success("To'lov qo'shildi");
      reset();
      onClose();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Xatolik"),
  });

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <h2 className="font-semibold text-[var(--text-primary)]">To'lov qo'shish</h2>
          <button onClick={onClose} className="btn-ghost p-1.5"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Kasalxona *</label>
            <select {...register("hospitalId", { required: true })} className="input-field">
              <option value="">Tanlang...</option>
              {hospitals.map((h: any) => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">To'lovchi ismi *</label>
            <input {...register("payerName", { required: "Ism shart" })} className="input-field" placeholder="Aziza Karimova" />
            {errors.payerName && <p className="text-xs text-red-400 mt-1">{errors.payerName.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Summa (so'm) *</label>
              <input {...register("amount", { required: true, valueAsNumber: true, min: 1 })} type="number" className="input-field" placeholder="20000" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Turi</label>
              <select {...register("type")} className="input-field">
                <option value="MONTHLY">Oylik</option>
                <option value="ANNUAL">Yillik</option>
                <option value="OTHER">Boshqa</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Izoh</label>
            <input {...register("note")} className="input-field" placeholder="Ixtiyoriy izoh..." />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Bekor qilish</button>
            <button type="submit" disabled={mutation.isPending} className="btn-primary flex-1">
              {mutation.isPending ? "Saqlanmoqda..." : "Qo'shish"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Edit Payment Modal ───────────────────────────
function EditPaymentModal({ open, onClose, payment }: { open: boolean; onClose: () => void; payment: any }) {
  const qc = useQueryClient();
  const { register, handleSubmit } = useForm({ defaultValues: { amount: Number(payment?.amount), note: payment?.note || "" } });

  const mutation = useMutation({
    mutationFn: (d: { amount: number; note: string }) => paymentsApi.update(payment.id, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payments-overview"] });
      qc.invalidateQueries({ queryKey: ["payments-list"] });
      toast.success("To'lov yangilandi");
      onClose();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Xatolik"),
  });

  if (!open || !payment) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <h2 className="font-semibold text-[var(--text-primary)]">To'lovni tahrirlash</h2>
          <button onClick={onClose} className="btn-ghost p-1.5"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit((d) => mutation.mutate({ amount: Number(d.amount), note: d.note }))} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Summa (so'm)</label>
            <input {...register("amount", { valueAsNumber: true, min: 1 })} type="number" className="input-field" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Izoh</label>
            <input {...register("note")} className="input-field" />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Bekor</button>
            <button type="submit" disabled={mutation.isPending} className="btn-primary flex-1">Saqlash</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────
export default function PaymentsPage() {
  const { user } = useAuthStore();
  const isSuperAdmin = isSuperLike(user?.role);
  const [addModal, setAddModal] = useState<{ open: boolean; hospitalId?: string; amount?: number }>({ open: false });
  const [editPayment, setEditPayment] = useState<any>(null);
  const [selectedHospital, setSelectedHospital] = useState<string | null>(null);

  const { data: overview = [], isLoading } = useQuery<OverviewItem[]>({
    queryKey: ["payments-overview"],
    queryFn: () => paymentsApi.overview(),
  });

  const { data: hospitals = [] } = useQuery({
    queryKey: ["hospitals"],
    queryFn: () => hospitalsApi.list(),
  });

  const { data: paymentsList = [] } = useQuery({
    queryKey: ["payments-list", selectedHospital],
    queryFn: () => paymentsApi.list({ hospitalId: selectedHospital || undefined, limit: 50 }),
  });

  // Summary totals
  const totalExpected = overview.reduce((s, h) => s + h.expectedAmount, 0);
  const totalPaid = overview.reduce((s, h) => s + h.paidAmount, 0);
  const pendingCount = overview.filter((h) => h.status === "PENDING").length;
  const overdueCount = overview.filter((h) => h.status === "OVERDUE").length;

  return (
    <div>
      <Topbar title="To'lovlar boshqaruvi" subtitle="Kasalxonalar obuna to'lovlari" />

      <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Jami kutilgan", value: formatAmount(totalExpected), icon: Wallet, color: "bg-indigo-500" },
            { label: "To'langan", value: formatAmount(totalPaid), icon: CheckCircle2, color: "bg-emerald-500" },
            { label: "Kutilayotgan", value: `${pendingCount} ta`, icon: Clock, color: "bg-amber-500" },
            { label: "Qarzdor", value: `${overdueCount} ta`, icon: AlertCircle, color: "bg-red-500" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="card p-4 flex items-center gap-3">
              <div className={cn("p-2.5 rounded-xl flex-shrink-0", color)}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)]">{label}</p>
                <p className="text-base font-bold text-[var(--text-primary)]">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Hospital Cards */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">
              Kasalxonalar holati — {overview[0] ? periodLabel(overview[0].period) : ""}
            </h2>
            <button
              onClick={() => setAddModal({ open: true })}
              className="btn-primary"
            >
              <Plus className="w-4 h-4" /> To'lov qo'shish
            </button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="card p-5 h-40 animate-pulse bg-[var(--bg-hover)]" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(overview as OverviewItem[]).map((h) => (
                <div
                  key={h.id}
                  className={cn(
                    "card p-5 flex flex-col gap-3 border-l-4",
                    h.status === "PAID" ? "border-l-emerald-500" :
                    h.status === "PENDING" ? "border-l-amber-500" : "border-l-red-500"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-indigo-600 flex-shrink-0">
                        <Building2 className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[var(--text-primary)] leading-tight">{h.name}</p>
                        <p className="text-xs font-mono text-indigo-400">{h.code}</p>
                      </div>
                    </div>
                    <StatusBadge status={h.status} />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-[var(--bg-hover)] rounded-lg p-2">
                      <p className="text-[var(--text-muted)]">Hodimlar</p>
                      <p className="font-bold text-[var(--text-primary)]">{h.employeeCount} ta</p>
                    </div>
                    <div className="bg-[var(--bg-hover)] rounded-lg p-2">
                      <p className="text-[var(--text-muted)]">Kutilgan</p>
                      <p className="font-bold text-[var(--text-primary)]">{formatAmount(h.expectedAmount)}</p>
                    </div>
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2">
                      <p className="text-emerald-400">To'langan</p>
                      <p className="font-bold text-emerald-400">{formatAmount(h.paidAmount)}</p>
                    </div>
                    {h.status !== "PAID" && (
                      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2">
                        <p className="text-red-400">Qolgan</p>
                        <p className="font-bold text-red-400">{formatAmount(h.remainingAmount)}</p>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => setAddModal({ open: true, hospitalId: h.id, amount: h.remainingAmount || h.expectedAmount })}
                    className="btn-secondary text-xs w-full justify-center"
                  >
                    <Plus className="w-3.5 h-3.5" /> To'lov qo'shish
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment History */}
        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">To'lovlar tarixi</h2>
            </div>
            <select
              className="input-field text-xs py-1 w-48"
              value={selectedHospital || ""}
              onChange={(e) => setSelectedHospital(e.target.value || null)}
            >
              <option value="">Barcha kasalxonalar</option>
              {(hospitals as any[]).map((h: any) => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  {["Kasalxona", "To'lovchi", "Summa", "Turi", "Davr", "Sana", ...(isSuperAdmin ? [""] : [])].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs text-[var(--text-muted)] font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(paymentsList as any[]).length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">
                      Hali to'lovlar yo'q
                    </td>
                  </tr>
                ) : (
                  (paymentsList as any[]).map((p: any) => (
                    <tr key={p.id} className="border-b border-[var(--border)] hover:bg-[var(--bg-hover)] transition-colors">
                      <td className="px-4 py-3 font-medium text-[var(--text-primary)]">
                        {p.hospital?.name || "—"}
                      </td>
                      <td className="px-4 py-3 text-[var(--text-muted)]">{p.payerName}</td>
                      <td className="px-4 py-3 font-semibold text-emerald-400">
                        {formatAmount(Number(p.amount))}
                      </td>
                      <td className="px-4 py-3 text-[var(--text-muted)] capitalize">
                        {p.type === "MONTHLY" ? "Oylik" : p.type === "ANNUAL" ? "Yillik" : "Boshqa"}
                      </td>
                      <td className="px-4 py-3 text-[var(--text-muted)]">
                        {p.period ? periodLabel(p.period) : "—"}
                      </td>
                      <td className="px-4 py-3 text-[var(--text-muted)] text-xs">
                        {new Date(p.createdAt).toLocaleDateString("uz-UZ")}
                      </td>
                      {isSuperAdmin && (
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setEditPayment(p)}
                            className="btn-ghost p-1.5"
                            title="Tahrirlash"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AddPaymentModal
        open={addModal.open}
        onClose={() => setAddModal({ open: false })}
        hospitals={hospitals as any[]}
        preHospitalId={addModal.hospitalId}
        preAmount={addModal.amount}
      />
      <EditPaymentModal
        open={!!editPayment}
        onClose={() => setEditPayment(null)}
        payment={editPayment}
      />
    </div>
  );
}
