"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { toast } from "sonner";
import { AlertTriangle, Ban, Check, Megaphone, Send, UserRound, X } from "lucide-react";
import { departmentsApi, employeesApi, openShiftsApi, shiftsApi, type OpenShiftInput } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/FormControls";
import { cn } from "@/lib/utils";
import { useConfirmation } from "@/components/ui";

type HospitalParams = { targetHospitalId?: string } | undefined;

type Candidate = {
  employeeId: string;
  fullName: string;
  positionName: string | null;
  positionMatch: boolean;
  eligible: boolean;
  blockers: string[];
  warnings: string[];
  telegramLinked: boolean;
};

type OpenShiftRow = {
  id: string;
  date: string;
  status: "OPEN" | "CLAIMED" | "FILLED" | "CANCELLED";
  expired: boolean;
  note: string | null;
  claimedAt: string | null;
  department: { name: string };
  shift: { name: string; startTime: string; endTime: string };
  absentEmployee: { fullName: string } | null;
  claimedBy: { fullName: string } | null;
  offers: Array<{ employeeId: string; notifiedAt: string | null; response: "ACCEPTED" | "DECLINED" | null }>;
};

export type OpenShiftPrefill = Partial<OpenShiftInput> | null;

function errorMessage(error: unknown, fallback: string) {
  const message = (error as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
  return Array.isArray(message) ? message.join(". ") : message || fallback;
}

const STATUS_META: Record<OpenShiftRow["status"], { label: string; className: string }> = {
  OPEN: { label: "Kutilmoqda", className: "bg-sky-500/10 text-sky-700 dark:text-sky-300" },
  CLAIMED: { label: "Tasdiq kutmoqda", className: "bg-amber-500/10 text-amber-700 dark:text-amber-300" },
  FILLED: { label: "To‘ldirildi", className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" },
  CANCELLED: { label: "Bekor qilingan", className: "bg-slate-500/10 text-slate-500" },
};

/**
 * Bo'sh smenani birjaga chiqarish oynasi: smena tanlanadi → tizim bo'limdagi
 * xodimlarni tekshiradi (ta'til, o'z smenasi, vaqt kesishuvi, dam) → mudir
 * kimga yuborishni belgilaydi.
 */
export function OpenShiftDialog({
  open,
  onClose,
  prefill,
  params,
  postCoverage = false,
}: {
  open: boolean;
  onClose: () => void;
  prefill: OpenShiftPrefill;
  params: HospitalParams;
  /** Post rejali muassasa: "kim o'rniga" majburiy, smena post rejadan olinadi */
  postCoverage?: boolean;
}) {
  const qc = useQueryClient();
  const [departmentId, setDepartmentId] = useState("");
  const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [shiftId, setShiftId] = useState("");
  const [absentEmployeeId, setAbsentEmployeeId] = useState<string | undefined>();
  const [note, setNote] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open) return;
    setDepartmentId(prefill?.departmentId ?? "");
    setDate(prefill?.date ?? dayjs().format("YYYY-MM-DD"));
    setShiftId(prefill?.shiftId ?? "");
    setAbsentEmployeeId(prefill?.absentEmployeeId);
    setNote("");
    setSelected(new Set());
  }, [open, prefill]);

  const { data: departments = [] } = useQuery<Array<{ id: string; name: string }>>({
    queryKey: ["departments", params?.targetHospitalId],
    queryFn: () => departmentsApi.list(params),
    enabled: open,
  });
  const { data: shifts = [] } = useQuery<Array<{ id: string; name: string; startTime: string; endTime: string }>>({
    queryKey: ["shifts", params?.targetHospitalId],
    queryFn: () => shiftsApi.list(params),
    enabled: open,
  });

  // Bo'limdagi xodimlar — "kim o'rniga" ro'yxati uchun
  const { data: departmentEmployees = [] } = useQuery<Array<{ id: string; fullName: string }>>({
    queryKey: ["open-shift-dept-employees", params?.targetHospitalId, departmentId],
    queryFn: () =>
      employeesApi
        .list({ departmentId, limit: 1000, employeeStatus: "ACTIVE", ...(params ?? {}) })
        .then((r: { data?: Array<{ id: string; fullName: string }> }) => r?.data ?? []),
    enabled: open && !!departmentId,
  });

  const input: OpenShiftInput | null = !departmentId || !date
    ? null
    : postCoverage
      ? absentEmployeeId ? { departmentId, date, absentEmployeeId } : null
      : shiftId ? { departmentId, shiftId, date, ...(absentEmployeeId && { absentEmployeeId }) } : null;

  const preview = useQuery<{ candidates: Candidate[]; shift?: { id: string; name: string; startTime: string; endTime: string } }>({
    queryKey: ["open-shift-preview", params?.targetHospitalId, input],
    queryFn: () => openShiftsApi.preview(input!, params),
    enabled: open && !!input,
    retry: false,
  });
  const candidates = useMemo(() => preview.data?.candidates ?? [], [preview.data]);

  // Mos keladiganlar avtomatik belgilanadi; mudir keraksizlarini olib tashlaydi.
  useEffect(() => {
    setSelected(new Set(candidates.filter((c) => c.eligible).map((c) => c.employeeId)));
  }, [candidates]);

  const create = useMutation({
    mutationFn: () => openShiftsApi.create({ ...input!, employeeIds: Array.from(selected), note: note.trim() || undefined }, params),
    onSuccess: () => {
      toast.success(`Bo‘sh smena ${selected.size} xodimga yuborildi`);
      qc.invalidateQueries({ queryKey: ["open-shifts"] });
      onClose();
    },
    onError: (error) => toast.error(errorMessage(error, "Bo‘sh smena e’lon qilinmadi"), { duration: 8000 }),
  });

  const linkedCount = candidates.filter((c) => selected.has(c.employeeId) && c.telegramLinked).length;

  const toggle = (id: string) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Bo‘sh smenani birjaga chiqarish"
      description="Taklif shu bo‘limdagi bo‘sh xodimlarga yuboriladi. Birinchi rozi bo‘lgan xodim band qiladi, siz tasdiqlagach grafikka yoziladi."
      className="max-w-2xl"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Bekor qilish</Button>
          <Button onClick={() => create.mutate()} loading={create.isPending} disabled={!input || !selected.size}>
            <Send className="h-4 w-4" /> {selected.size ? `${selected.size} xodimga yuborish` : "Xodim tanlang"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Bo‘lim">
            <Select value={departmentId} onChange={(event) => setDepartmentId(event.target.value)} className="text-xs">
              <option value="">Tanlang</option>
              {departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
            </Select>
          </Field>
          <Field label="Sana">
            <Input type="date" value={date} min={dayjs().format("YYYY-MM-DD")} max={dayjs().add(14, "day").format("YYYY-MM-DD")} onChange={(event) => setDate(event.target.value)} className="text-xs" />
          </Field>
          {postCoverage ? (
            <Field label="Smena">
              <div className="flex min-h-10 items-center rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] px-3 text-xs text-[var(--text-secondary)]">
                {preview.data?.shift ? `${preview.data.shift.startTime}–${preview.data.shift.endTime} · post rejadan` : "Post rejadan olinadi"}
              </div>
            </Field>
          ) : (
            <Field label="Smena">
              <Select value={shiftId} onChange={(event) => setShiftId(event.target.value)} className="text-xs">
                <option value="">Tanlang</option>
                {shifts.map((shift) => <option key={shift.id} value={shift.id}>{shift.name} {shift.startTime}–{shift.endTime}</option>)}
              </Select>
            </Field>
          )}
        </div>
        <Field label={postCoverage ? "Kim o‘rniga (majburiy)" : "Kim o‘rniga (ixtiyoriy)"}>
          <Select value={absentEmployeeId ?? ""} onChange={(event) => setAbsentEmployeeId(event.target.value || undefined)} className="text-xs" disabled={!departmentId}>
            <option value="">{postCoverage ? "Kelmagan xodimni tanlang" : "Tanlanmagan"}</option>
            {departmentEmployees.map((employee) => <option key={employee.id} value={employee.id}>{employee.fullName}</option>)}
          </Select>
        </Field>
        {!!absentEmployeeId && (
          <p className="flex items-center gap-2 rounded-xl bg-[var(--bg-secondary)] px-3 py-2 text-xs text-[var(--text-secondary)]">
            <UserRound className="h-4 w-4" />
            {postCoverage
              ? "Shu xodimning post rejadagi smenasi boshqa xodimga o‘tkaziladi (tasdiqlangan “o‘rnini bosish”), post rejaning o‘zi o‘zgarmaydi."
              : "Kelmagan xodim o‘rniga — u ro‘yxatga kiritilmaydi."}
          </p>
        )}

        {!input ? (
          <p className="rounded-xl border border-dashed border-[var(--border)] p-4 text-center text-xs text-[var(--text-muted)]">{postCoverage ? "Bo‘lim, sana va kelmagan xodimni tanlang — mos xodimlar ko‘rsatiladi." : "Bo‘lim, sana va smenani tanlang — mos xodimlar ko‘rsatiladi."}</p>
        ) : preview.isLoading ? (
          <p className="p-4 text-center text-xs text-[var(--text-muted)]">Xodimlar tekshirilmoqda…</p>
        ) : preview.isError ? (
          <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-700 dark:text-rose-300">{errorMessage(preview.error, "Xodimlarni tekshirib bo‘lmadi")}</p>
        ) : (
          <div>
            <div className="mb-2 flex items-center justify-between text-[11px] text-[var(--text-muted)]">
              <span>{candidates.filter((c) => c.eligible).length} ta mos · {candidates.filter((c) => !c.eligible).length} ta band</span>
              <span>Telegram orqali: {linkedCount} ta · qolganlari web saytda ko‘radi</span>
            </div>
            <div className="max-h-72 space-y-1.5 overflow-y-auto pr-1">
              {candidates.map((candidate) => (
                <label
                  key={candidate.employeeId}
                  className={cn(
                    "flex items-start gap-3 rounded-xl border border-[var(--border)] px-3 py-2.5",
                    candidate.eligible ? "cursor-pointer hover:bg-[var(--bg-hover)]" : "opacity-60",
                  )}
                >
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4"
                    disabled={!candidate.eligible}
                    checked={selected.has(candidate.employeeId)}
                    onChange={() => toggle(candidate.employeeId)}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-semibold text-[var(--text-primary)]">
                      {candidate.fullName}
                      {candidate.positionMatch && <span className="ml-2 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700 dark:text-emerald-300">Lavozimi mos</span>}
                    </span>
                    <span className="block text-[10px] text-[var(--text-muted)]">
                      {candidate.positionName || "—"}{candidate.telegramLinked ? "" : " · Telegram ulanmagan"}
                    </span>
                    {candidate.blockers.map((text) => <span key={text} className="mt-0.5 flex items-center gap-1 text-[10px] text-rose-600 dark:text-rose-300"><Ban className="h-3 w-3" />{text}</span>)}
                    {candidate.warnings.map((text) => <span key={text} className="mt-0.5 flex items-center gap-1 text-[10px] text-amber-700 dark:text-amber-300"><AlertTriangle className="h-3 w-3" />{text}</span>)}
                  </span>
                </label>
              ))}
              {!candidates.length && <p className="p-4 text-center text-xs text-[var(--text-muted)]">Bu bo‘limda boshqa faol xodim yo‘q.</p>}
            </div>
          </div>
        )}

        <Field label="Izoh (ixtiyoriy)">
          <Textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={300} rows={2} placeholder="Masalan: tug‘ruq bloki, doya kerak" className="text-xs" />
        </Field>
      </div>
    </Dialog>
  );
}

/** Operativ markazdagi bo'sh smenalar ro'yxati: holat, tasdiqlash, bekor qilish. */
export function OpenShiftBoard({ params, onCreate }: { params: HospitalParams; onCreate: () => void }) {
  const qc = useQueryClient();
  const { confirm } = useConfirmation();
  const { data: rows = [], isLoading } = useQuery<OpenShiftRow[]>({
    queryKey: ["open-shifts", params?.targetHospitalId],
    queryFn: () => openShiftsApi.list(params),
    refetchInterval: 30_000,
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["open-shifts"] });
    qc.invalidateQueries({ queryKey: ["operational-center"] });
  };
  const review = useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: "APPROVED" | "REJECTED" }) => openShiftsApi.review(id, decision, params),
    onSuccess: (_, { decision }) => {
      toast.success(decision === "APPROVED" ? "Tasdiqlandi — smena grafikka yozildi" : "Rad etildi — smena yana ochiq");
      refresh();
    },
    onError: (error) => toast.error(errorMessage(error, "Amal bajarilmadi"), { duration: 8000 }),
  });
  const cancel = useMutation({
    mutationFn: (id: string) => openShiftsApi.cancel(id, params),
    onSuccess: () => {
      toast.success("Bo‘sh smena bekor qilindi");
      refresh();
    },
    onError: (error) => toast.error(errorMessage(error, "Bekor qilinmadi")),
  });

  const active = rows.filter((row) => !row.expired && (row.status === "OPEN" || row.status === "CLAIMED"));
  const recent = rows.filter((row) => !active.includes(row)).slice(0, 8);

  return (
    <article className="ui-surface overflow-hidden shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border)] px-5 py-4">
        <div>
          <h2 className="flex items-center gap-2 text-base font-black text-[var(--text-primary)]">
            <Megaphone className="h-5 w-5 text-indigo-500" /> Bo‘sh smena birjasi
          </h2>
          <p className="mt-1 text-xs text-[var(--text-muted)]">Bo‘sh qolgan smenani xodimlarga taklif qiling — birinchi rozi bo‘lgan oladi, siz tasdiqlaysiz.</p>
        </div>
        <Button size="sm" onClick={onCreate}><Megaphone className="h-4 w-4" /> Bo‘sh smena e’lon qilish</Button>
      </div>

      {isLoading ? (
        <p className="p-5 text-xs text-[var(--text-muted)]">Yuklanmoqda…</p>
      ) : !rows.length ? (
        <p className="p-5 text-xs text-[var(--text-muted)]">Hozircha bo‘sh smena e’lon qilinmagan.</p>
      ) : (
        <div className="divide-y divide-[var(--border)]">
          {[...active, ...recent].map((row) => {
            const meta = row.expired ? { label: "Muddati o‘tdi", className: "bg-slate-500/10 text-slate-500" } : STATUS_META[row.status];
            const declined = row.offers.filter((offer) => offer.response === "DECLINED").length;
            const notified = row.offers.filter((offer) => offer.notifiedAt).length;
            const canAct = !row.expired && (row.status === "OPEN" || row.status === "CLAIMED");
            return (
              <div key={row.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-[var(--text-primary)]">
                    {dayjs(row.date).format("DD.MM")} · {row.shift.startTime}–{row.shift.endTime} · {row.department.name}
                  </p>
                  <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
                    {row.absentEmployee ? `${row.absentEmployee.fullName} o‘rniga · ` : ""}
                    {row.offers.length} xodimga taklif ({notified} tasi Telegramda){declined ? ` · ${declined} rad etdi` : ""}
                  </p>
                  {row.claimedBy && (
                    <p className="mt-1 text-xs font-semibold text-amber-700 dark:text-amber-300">
                      {row.claimedBy.fullName} {row.status === "FILLED" ? "ishlaydi" : "oldi"}{row.claimedAt ? ` · ${dayjs(row.claimedAt).format("HH:mm")}` : ""}
                    </p>
                  )}
                </div>
                <span className={cn("rounded-full px-2.5 py-1 text-[10px] font-bold", meta.className)}>{meta.label}</span>
                {canAct && row.status === "CLAIMED" && (
                  <>
                    <Button size="sm" variant="success" loading={review.isPending} onClick={() => review.mutate({ id: row.id, decision: "APPROVED" })}><Check className="h-4 w-4" /> Tasdiqlash</Button>
                    <Button size="sm" variant="secondary" onClick={() => review.mutate({ id: row.id, decision: "REJECTED" })}>Rad etish</Button>
                  </>
                )}
                {canAct && (
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label="Bekor qilish"
                    onClick={async () => {
                      const approved = await confirm({
                        title: "Bo‘sh smena bekor qilinsinmi?",
                        description: "Xodimlar endi bu smenani ola olmaydi. Grafik o‘zgarmaydi.",
                        confirmLabel: "Bekor qilish",
                        tone: "danger",
                      });
                      if (approved) cancel.mutate(row.id);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </article>
  );
}
