/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Building2, Plus, X, UserPlus } from "lucide-react";
import { hospitalsApi, usersApi } from "@/lib/api";

// Bitta shifoxonaning "mas'ul Assistant Admin'lar" bo'limi — chip'lar +
// biriktirish/bekor qilish. Odiljon so'rovi (2026-09-19): "Assistant admin
// faqat o&apos;ziga biriktirilgan korxona/poliklinikalarni ko'rishi tahrirlashi
// kerak" — shu sahifada SUPER_ADMIN kimga qaysi shifoxonani biriktirishini
// belgilaydi.
function AssistantsCell({ hospitalId }: { hospitalId: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: assistants = [] } = useQuery({
    queryKey: ["hospital-assistants", hospitalId],
    queryFn: () => hospitalsApi.listAssistants(hospitalId),
  });

  const { data: allAssistantsData } = useQuery({
    queryKey: ["panel-users", "ASSISTANT_ADMIN"],
    queryFn: () => usersApi.list({ role: "ASSISTANT_ADMIN", limit: 100 }),
    enabled: open,
  });

  const assignedIds = new Set(assistants.map((a: any) => a.id));
  const candidates = (allAssistantsData?.data ?? []).filter(
    (u: any) => !assignedIds.has(u.id),
  );

  const assignMutation = useMutation({
    mutationFn: (userId: string) => hospitalsApi.assignAssistant(hospitalId, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hospital-assistants", hospitalId] });
      toast.success("Biriktirildi");
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Xatolik"),
  });

  const unassignMutation = useMutation({
    mutationFn: (userId: string) => hospitalsApi.unassignAssistant(hospitalId, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hospital-assistants", hospitalId] });
      toast.success("Biriktirish bekor qilindi");
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Xatolik"),
  });

  return (
    <div className="relative">
      <div className="flex flex-wrap items-center gap-1.5">
        {assistants.map((a: any) => (
          <span
            key={a.id}
            className="flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--bg-hover)] px-2 py-0.5 text-xs text-[var(--text-primary)]"
          >
            @{a.username}
            <button
              onClick={() => unassignMutation.mutate(a.id)}
              className="text-[var(--text-muted)] hover:text-red-400"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-1 rounded-full border border-dashed border-[var(--border)] px-2 py-0.5 text-xs text-[var(--text-muted)] hover:text-indigo-500"
        >
          <Plus className="h-3 w-3" /> Biriktirish
        </button>
      </div>

      {open && (
        <div className="absolute left-0 top-full z-20 mt-1 w-56 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-1.5 shadow-lg">
          {candidates.length === 0 ? (
            <p className="px-2 py-1.5 text-xs text-[var(--text-muted)]">
              Biriktirish uchun bo&apos;sh Assistant Admin yo&apos;q
            </p>
          ) : (
            candidates.map((u: any) => (
              <button
                key={u.id}
                onClick={() => {
                  assignMutation.mutate(u.id);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
              >
                <UserPlus className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                @{u.username}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function PanelHospitalsPage() {
  const { data: hospitals = [], isLoading } = useQuery({
    queryKey: ["panel-hospitals"],
    queryFn: () => hospitalsApi.list(),
  });

  return (
    <div className="space-y-6">
      <div>
        <div className="text-[10px] font-semibold tracking-wider text-indigo-500">PLATFORMA BOSHQARUVI</div>
        <h1 className="mt-1 text-[26px] font-semibold tracking-tight text-[var(--text-primary)]">
          Shifoxonalar
        </h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Barcha shifoxonalar va ularga biriktirilgan Assistant Admin&apos;lar.
        </p>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-sm text-[var(--text-muted)]">Yuklanmoqda...</div>
        ) : hospitals.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-10 text-center">
            <Building2 className="h-8 w-8 text-[var(--text-muted)]" />
            <p className="text-sm text-[var(--text-muted)]">Hech qanday shifoxona topilmadi</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-left text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                  <th className="px-5 py-3">Nomi</th>
                  <th className="px-5 py-3">Direktor</th>
                  <th className="px-5 py-3">Xodimlar</th>
                  <th className="px-5 py-3">Holat</th>
                  <th className="px-5 py-3">Mas&apos;ul Assistant Admin&apos;lar</th>
                </tr>
              </thead>
              <tbody>
                {hospitals.map((h: any) => (
                  <tr key={h.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-hover)]">
                    <td className="px-5 py-3">
                      <div className="font-medium text-[var(--text-primary)]">{h.name}</div>
                      <div className="text-xs text-[var(--text-muted)]">{h.code}</div>
                    </td>
                    <td className="px-5 py-3 text-[var(--text-primary)]">
                      {h.directorName || <span className="text-[var(--text-muted)]">Tayinlanmagan</span>}
                    </td>
                    <td className="px-5 py-3 text-[var(--text-primary)]">{h._count?.employees ?? 0}</td>
                    <td className="px-5 py-3">
                      {h.isBlocked ? (
                        <span className="rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-500">
                          Bloklangan
                        </span>
                      ) : h.isActive ? (
                        <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-500">
                          Faol
                        </span>
                      ) : (
                        <span className="rounded-full border border-slate-500/20 bg-slate-500/10 px-2.5 py-1 text-xs font-medium text-slate-400">
                          Nofaol
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <AssistantsCell hospitalId={h.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
