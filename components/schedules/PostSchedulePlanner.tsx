"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { Archive, Check, Clock, Download, FileSpreadsheet, Plus, RotateCcw, Save, Send, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import {
  downloadBlob,
  employeesApi,
  schedulePlanningApi,
  shiftsApi,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/FormControls";
import { ConfirmDialog, PromptDialog } from "@/components/ui/Dialog";
import { StatePanel } from "@/components/ui/StatePanel";
import { Surface } from "@/components/ui/Surface";
import { TableShell } from "@/components/ui/TableShell";

type Props = {
  targetHospitalId?: string;
  month: number;
  year: number;
  departments: any[];
  shifts: any[];
  userRole?: string;
};

const STATUS_OPTIONS = [
  { value: "STATUS:DAY_OFF", label: "D — Dam" },
  { value: "STATUS:SICK", label: "K — Kasallik" },
  { value: "STATUS:VACATION", label: "MT — Mehnat ta’tili" },
  { value: "STATUS:MATERNITY_LEAVE", label: "TT — Tug‘ruq ta’tili" },
  { value: "STATUS:TRAINING", label: "MO — Malaka oshirish" },
  { value: "STATUS:OTHER_ABSENCE", label: "B — Boshqa" },
];

const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN", "DIRECTOR"];

function requestParams(targetHospitalId?: string) {
  return targetHospitalId ? { targetHospitalId } : undefined;
}

function getErrorMessage(error: any, fallback: string) {
  const message = error?.response?.data?.message;
  return Array.isArray(message) ? message.join(". ") : message || fallback;
}

function buildShiftInterval(date: string, shift: any) {
  const start = `${date}T${shift.startTime}:00+05:00`;
  const endDate = shift.isOvernight || shift.endTime <= shift.startTime
    ? dayjs(date).add(1, "day").format("YYYY-MM-DD")
    : date;
  return { startsAt: start, endsAt: `${endDate}T${shift.endTime}:00+05:00` };
}

function calculateShiftHours(startTime: string, endTime: string) {
  if (!startTime || !endTime) return 0;
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);
  let minutes = endHour * 60 + endMinute - (startHour * 60 + startMinute);
  if (minutes <= 0) minutes += 24 * 60;
  return Math.round(minutes / 60);
}

function formatMinutes(minutes: number) {
  const hours = minutes / 60;
  return `${Number.isInteger(hours) ? hours : hours.toFixed(1)} soat`;
}

export function PostSchedulePlanner({
  targetHospitalId,
  month,
  year,
  departments,
  shifts,
  userRole,
}: Props) {
  const qc = useQueryClient();
  const params = requestParams(targetHospitalId);
  const [departmentId, setDepartmentId] = useState("");
  const [postId, setPostId] = useState("");
  const [planId, setPlanId] = useState("");
  const [cells, setCells] = useState<Record<string, string>>({});
  const [postFormOpen, setPostFormOpen] = useState(false);
  const [postName, setPostName] = useState("");
  const [postCode, setPostCode] = useState("");
  const [showArchivedPosts, setShowArchivedPosts] = useState(false);
  const [shiftFormOpen, setShiftFormOpen] = useState(false);
  const [shiftName, setShiftName] = useState("");
  const [shiftType, setShiftType] = useState("DAYTIME");
  const [shiftStartTime, setShiftStartTime] = useState("08:00");
  const [shiftEndTime, setShiftEndTime] = useState("20:00");
  const [postConfirmation, setPostConfirmation] = useState<"archive" | "delete" | null>(null);
  const [rejectPlanOpen, setRejectPlanOpen] = useState(false);
  const [rejectPlanReason, setRejectPlanReason] = useState("");

  useEffect(() => {
    if (!departmentId && departments.length) setDepartmentId(departments[0].id);
  }, [departmentId, departments]);

  const { data: posts = [], isLoading: postsLoading } = useQuery({
    queryKey: ["schedule-posts", targetHospitalId, departmentId, showArchivedPosts],
    queryFn: () => schedulePlanningApi.posts({
      ...(targetHospitalId && { targetHospitalId }),
      ...(departmentId && { departmentId }),
      ...(showArchivedPosts && { includeArchived: true }),
    }),
    enabled: !!departmentId,
  });

  useEffect(() => {
    if (!posts.some((post: any) => post.id === postId)) {
      setPostId(posts.find((post: any) => post.isActive)?.id ?? posts[0]?.id ?? "");
      setPlanId("");
    }
  }, [posts, postId]);

  const selectedPost = posts.find((post: any) => post.id === postId);

  const { data: plans = [] } = useQuery({
    queryKey: ["post-schedule-plans", targetHospitalId, postId, year, month],
    queryFn: () => schedulePlanningApi.plans({
      ...(targetHospitalId && { targetHospitalId }),
      postId,
      year,
      month,
    }),
    enabled: !!postId,
  });

  useEffect(() => {
    if (!plans.some((plan: any) => plan.id === planId)) {
      setPlanId(plans[0]?.id ?? "");
    }
  }, [plans, planId]);

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ["post-schedule-plan", targetHospitalId, planId],
    queryFn: () => schedulePlanningApi.plan(planId, params),
    enabled: !!planId,
  });

  const { data: employeesResponse } = useQuery({
    queryKey: ["post-schedule-employees", targetHospitalId, departmentId],
    queryFn: () => employeesApi.list({
      limit: 1000,
      departmentId,
      employeeStatus: "ACTIVE",
      ...(targetHospitalId && { targetHospitalId }),
    }),
    enabled: !!departmentId,
  });
  const employees: any[] = employeesResponse?.data ?? [];

  useEffect(() => {
    if (!detail) {
      setCells({});
      return;
    }
    const next: Record<string, string> = {};
    for (const entry of detail.entries ?? []) {
      const date = dayjs(entry.workDate).format("YYYY-MM-DD");
      next[`${entry.employeeId}:${date}`] = entry.entryType === "WORKING"
        ? entry.shiftId
        : `STATUS:${entry.entryType}`;
    }
    setCells(next);
  }, [detail]);

  const days = useMemo(() => {
    const first = dayjs(`${year}-${String(month).padStart(2, "0")}-01`);
    const regular = Array.from({ length: first.daysInMonth() }, (_, index) => ({
      date: first.date(index + 1).format("YYYY-MM-DD"),
      label: String(index + 1),
      carryIn: false,
    }));
    return [
      {
        date: first.subtract(1, "day").format("YYYY-MM-DD"),
        label: `←${first.subtract(1, "day").date()}`,
        carryIn: true,
      },
      ...regular,
    ];
  }, [month, year]);

  const shiftsById = useMemo(
    () => new Map(shifts.map((shift) => [shift.id, shift])),
    [shifts],
  );

  const livePlannedMinutes = useMemo(() => {
    const monthStart = dayjs(`${year}-${String(month).padStart(2, "0")}-01T00:00:00+05:00`);
    const monthEnd = monthStart.add(1, "month");

    return Object.entries(cells).reduce((total, [key, value]) => {
      if (!value || value.startsWith("STATUS:")) return total;
      const shift = shiftsById.get(value);
      if (!shift) return total;
      const separator = key.indexOf(":");
      const workDate = key.slice(separator + 1);
      const interval = buildShiftInterval(workDate, shift);
      const startsAt = dayjs(interval.startsAt);
      const endsAt = dayjs(interval.endsAt);
      const overlapStart = startsAt.isAfter(monthStart) ? startsAt : monthStart;
      const overlapEnd = endsAt.isBefore(monthEnd) ? endsAt : monthEnd;
      return total + Math.max(0, overlapEnd.diff(overlapStart, "minute"));
    }, 0);
  }, [cells, month, shiftsById, year]);

  const createPost = useMutation({
    mutationFn: () => schedulePlanningApi.createPost({
      name: postName,
      code: postCode,
      departmentId,
      dailyCoverageMinutes: 1440,
    }, params),
    onSuccess: (post) => {
      toast.success("Post yaratildi");
      setPostId(post.id);
      setPostName("");
      setPostCode("");
      setPostFormOpen(false);
      qc.invalidateQueries({ queryKey: ["schedule-posts"] });
    },
    onError: (error) => toast.error(getErrorMessage(error, "Post yaratilmadi")),
  });

  const postStatus = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      schedulePlanningApi.setPostStatus(id, isActive, params),
    onSuccess: (_, variables) => {
      toast.success(variables.isActive ? "Post qayta faollashtirildi" : "Post arxivlandi");
      setPostConfirmation(null);
      qc.invalidateQueries({ queryKey: ["schedule-posts"] });
    },
    onError: (error) => toast.error(getErrorMessage(error, "Post holati o‘zgarmadi")),
  });

  const deletePost = useMutation({
    mutationFn: (id: string) => schedulePlanningApi.deletePost(id, params),
    onSuccess: () => {
      toast.success("Post o‘chirildi");
      setPostConfirmation(null);
      setPostId("");
      setPlanId("");
      qc.invalidateQueries({ queryKey: ["schedule-posts"] });
    },
    onError: (error) => toast.error(getErrorMessage(error, "Post o‘chirilmadi")),
  });

  const createShift = useMutation({
    mutationFn: () => {
      const isOvernight = shiftEndTime <= shiftStartTime;
      return shiftsApi.create({
        name: shiftName.trim(),
        type: shiftType,
        startTime: shiftStartTime,
        endTime: shiftEndTime,
        isOvernight,
        durationH: calculateShiftHours(shiftStartTime, shiftEndTime),
        graceMinutes: 0,
      }, params);
    },
    onSuccess: () => {
      toast.success("Yangi smena yaratildi");
      setShiftName("");
      setShiftFormOpen(false);
      qc.invalidateQueries({ queryKey: ["shifts"] });
    },
    onError: (error) => toast.error(getErrorMessage(error, "Smena yaratilmadi")),
  });

  const createPlan = useMutation({
    mutationFn: () => schedulePlanningApi.createPlan({ postId, year, month }, params),
    onSuccess: (plan) => {
      toast.success("Oylik qoralama yaratildi");
      setPlanId(plan.id);
      qc.invalidateQueries({ queryKey: ["post-schedule-plans"] });
    },
    onError: (error) => toast.error(getErrorMessage(error, "Grafik yaratilmadi")),
  });

  const savePlan = useMutation({
    mutationFn: () => {
      const entries = Object.entries(cells)
        .filter(([, value]) => !!value)
        .map(([key, value]) => {
          const separator = key.indexOf(":");
          const employeeId = key.slice(0, separator);
          const workDate = key.slice(separator + 1);
          if (value.startsWith("STATUS:")) {
            return {
              employeeId,
              entryType: value.slice("STATUS:".length),
              workDate,
            };
          }
          const shift = shifts.find((item) => item.id === value);
          if (!shift) throw new Error("Smena topilmadi");
          return {
            employeeId,
            shiftId: shift.id,
            entryType: "WORKING",
            workDate,
            ...buildShiftInterval(workDate, shift),
          };
        });
      return schedulePlanningApi.saveEntries(planId, entries, params);
    },
    onSuccess: () => {
      toast.success("Post grafigi saqlandi");
      qc.invalidateQueries({ queryKey: ["post-schedule-plan"] });
      qc.invalidateQueries({ queryKey: ["post-schedule-plans"] });
    },
    onError: (error) => toast.error(getErrorMessage(error, "Grafik saqlanmadi")),
  });

  const statusMutation = useMutation({
    mutationFn: async ({ action, reason }: { action: "submit" | "approve" | "reject"; reason?: string }) => {
      if (action === "submit") return schedulePlanningApi.submitPlan(planId, params);
      if (action === "approve") return schedulePlanningApi.approvePlan(planId, params);
      if (!reason?.trim()) throw new Error("Rad etish sababi kiritilmadi");
      return schedulePlanningApi.rejectPlan(planId, reason.trim(), params);
    },
    onSuccess: () => {
      toast.success("Grafik holati yangilandi");
      setRejectPlanOpen(false);
      setRejectPlanReason("");
      qc.invalidateQueries({ queryKey: ["post-schedule-plan"] });
      qc.invalidateQueries({ queryKey: ["post-schedule-plans"] });
    },
    onError: (error) => toast.error(getErrorMessage(error, error?.message || "Amal bajarilmadi")),
  });

  const downloadExcel = async () => {
    try {
      const response = await schedulePlanningApi.exportPlan(planId, params);
      downloadBlob(response.data, `post-grafik-${year}-${month}.xlsx`);
    } catch (error) {
      toast.error(getErrorMessage(error, "Excel yuklanmadi"));
    }
  };

  const summary = detail?.summary;
  const targetMinutes = summary?.targetMinutes ?? 0;
  const displayedPlannedMinutes = isNaN(livePlannedMinutes)
    ? summary?.plannedMinutes ?? 0
    : livePlannedMinutes;
  const displayedRemainingMinutes = Math.max(0, targetMinutes - displayedPlannedMinutes);
  const displayedExcessMinutes = Math.max(0, displayedPlannedMinutes - targetMinutes);
  const canApprove = ADMIN_ROLES.includes(userRole ?? "");
  const canWrite = [...ADMIN_ROLES, "ASSISTANT_ADMIN"].includes(userRole ?? "");
  const isDraft = detail?.status === "DRAFT";
  const canCreatePlan = !!postId && selectedPost?.isActive && canWrite && !plans.some((plan: any) =>
    ["DRAFT", "SUBMITTED", "APPROVED"].includes(plan.status),
  );

  return (
    <div className="space-y-4">
      <Surface className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Field label="Bo‘lim" className="min-w-52 flex-1 sm:flex-none">
            <Select value={departmentId} onChange={(event) => setDepartmentId(event.target.value)} className="h-10 min-w-52 text-xs">
              {departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
            </Select>
          </Field>
          <Field label="Post" className="min-w-52 flex-1 sm:flex-none">
            <Select value={postId} onChange={(event) => setPostId(event.target.value)} className="h-10 min-w-52 text-xs">
              <option value="">Postni tanlang</option>
              {posts.map((post: any) => <option key={post.id} value={post.id}>{post.name}{post.isActive ? "" : " — arxiv"}</option>)}
            </Select>
          </Field>
          {canWrite && <Button onClick={() => setPostFormOpen((value) => !value)} variant="secondary" size="sm" className="mt-5"><Plus className="h-3.5 w-3.5" />Yangi post</Button>}
          {canWrite && <Button onClick={() => setShiftFormOpen((value) => !value)} variant="secondary" size="sm" className="mt-5"><Clock className="h-3.5 w-3.5" />Yangi smena</Button>}
          {canCreatePlan && <Button onClick={() => createPlan.mutate()} loading={createPlan.isPending} size="sm" className="mt-5">{plans.length ? "Yangi versiya" : "Oylik reja yaratish"}</Button>}
          {!!plans.length && <Select aria-label="Grafik versiyasi" value={planId} onChange={(event) => setPlanId(event.target.value)} className="mt-5 h-9 w-auto min-w-32 text-xs">
            {plans.map((plan: any) => <option key={plan.id} value={plan.id}>v{plan.version} — {plan.status}</option>)}
          </Select>}
          {selectedPost && canWrite && (selectedPost.isActive ? (
            <Button onClick={() => setPostConfirmation("archive")} variant="warning" size="sm" className="mt-5"><Archive className="h-3.5 w-3.5" />Arxivlash</Button>
          ) : (
            <Button onClick={() => postStatus.mutate({ id: selectedPost.id, isActive: true })} loading={postStatus.isPending} variant="success" size="sm" className="mt-5"><RotateCcw className="h-3.5 w-3.5" />Faollashtirish</Button>
          ))}
          {selectedPost && canWrite && <Button onClick={() => setPostConfirmation("delete")} variant="danger" size="sm" className="mt-5"><Trash2 className="h-3.5 w-3.5" />O‘chirish</Button>}
          <Button onClick={() => setShowArchivedPosts((value) => !value)} variant="ghost" size="sm" className="mt-5">
            {showArchivedPosts ? "Arxivni yashirish" : "Arxivlanganlar"}
          </Button>
        </div>

        {postFormOpen && <div className="ui-surface-muted mt-3 grid gap-3 p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_auto] sm:items-end">
          <Field label="Post nomi"><Input value={postName} onChange={(event) => setPostName(event.target.value)} placeholder="Masalan: Ona va bola 1" className="text-xs" /></Field>
          <Field label="Post kodi"><Input value={postCode} onChange={(event) => setPostCode(event.target.value)} placeholder="ONA_VA_BOLA_1" className="text-xs" /></Field>
          <Button onClick={() => createPost.mutate()} loading={createPost.isPending} disabled={!postName.trim() || !postCode.trim()} size="sm">Yaratish</Button>
          <Button onClick={() => setPostFormOpen(false)} variant="ghost" size="icon" aria-label="Post formasini yopish"><X className="h-4 w-4" /></Button>
        </div>}

        {shiftFormOpen && <div className="ui-surface-muted mt-3 grid gap-3 p-3 sm:grid-cols-2 xl:grid-cols-[minmax(12rem,1fr)_10rem_9rem_9rem_auto_auto_auto] xl:items-end">
          <Field label="Smena nomi"><Input value={shiftName} onChange={(event) => setShiftName(event.target.value)} placeholder="Kunduzgi 12 soat" className="text-xs" /></Field>
          <Field label="Turi"><Select value={shiftType} onChange={(event) => setShiftType(event.target.value)} className="text-xs"><option value="DAYTIME">Kunduzgi</option><option value="NIGHTTIME">Tungi</option><option value="CUSTOM">Maxsus</option></Select></Field>
          <Field label="Boshlanishi"><Input type="time" value={shiftStartTime} onChange={(event) => setShiftStartTime(event.target.value)} className="text-xs" /></Field>
          <Field label="Tugashi"><Input type="time" value={shiftEndTime} onChange={(event) => setShiftEndTime(event.target.value)} className="text-xs" /></Field>
          <div className="flex min-h-10 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/10 px-3 text-xs font-semibold text-indigo-700 dark:text-indigo-300">{calculateShiftHours(shiftStartTime, shiftEndTime)} soat</div>
          <Button onClick={() => createShift.mutate()} loading={createShift.isPending} disabled={!shiftName.trim() || !shiftStartTime || !shiftEndTime} size="sm">Yaratish</Button>
          <Button onClick={() => setShiftFormOpen(false)} variant="ghost" size="icon" aria-label="Smena formasini yopish"><X className="h-4 w-4" /></Button>
        </div>}
      </Surface>

      {detail && <>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            ["Holat", detail.status],
            ["Post normasi", formatMinutes(targetMinutes)],
            ["Rejalashtirilgan", formatMinutes(displayedPlannedMinutes)],
            [displayedExcessMinutes ? "Oshib ketgan" : "Qolgan", formatMinutes(displayedExcessMinutes || displayedRemainingMinutes)],
          ].map(([label, value]) => <Surface key={label} className="p-4"><p className="text-[11px] font-medium text-[var(--text-muted)]">{label}</p><p className="mt-1 font-bold text-[var(--text-primary)]">{value}</p></Surface>)}
        </div>

        <div className="flex flex-wrap gap-2">
          {isDraft && canWrite && <Button onClick={() => savePlan.mutate()} loading={savePlan.isPending} size="sm"><Save className="h-4 w-4" />Saqlash</Button>}
          {isDraft && canWrite && <Button onClick={() => statusMutation.mutate({ action: "submit" })} loading={statusMutation.isPending} variant="success" size="sm"><Send className="h-4 w-4" />Tasdiqlashga yuborish</Button>}
          {detail.status === "SUBMITTED" && canApprove && <Button onClick={() => statusMutation.mutate({ action: "approve" })} loading={statusMutation.isPending} variant="success" size="sm"><Check className="h-4 w-4" />Tasdiqlash</Button>}
          {detail.status === "SUBMITTED" && canApprove && <Button onClick={() => setRejectPlanOpen(true)} variant="danger" size="sm">Rad etish</Button>}
          <Button onClick={downloadExcel} variant="secondary" size="sm"><Download className="h-4 w-4" />Excel</Button>
        </div>

        <TableShell>
            <table className="border-collapse text-[11px] min-w-max">
              <thead className="ui-table-head sticky top-0 z-20">
                <tr><th className="ui-table-head sticky left-0 z-30 min-w-56 border border-[var(--border)] p-2 text-left">Xodim</th>{days.map((day) => <th key={day.date} className={cn("w-20 min-w-20 border border-[var(--border)] p-1", day.carryIn && "bg-amber-100 dark:bg-amber-500/10")}>{day.label}</th>)}</tr>
              </thead>
              <tbody>
                {employees.map((employee) => <tr key={employee.id} className="table-row-hover">
                  <td className="sticky left-0 z-10 border border-[var(--border)] bg-[var(--bg-card)] p-2"><p className="font-semibold text-[var(--text-primary)]">{employee.fullName}</p><p className="text-[9px] text-[var(--text-muted)]">{employee.position?.name}</p></td>
                  {days.map((day) => {
                    const key = `${employee.id}:${day.date}`;
                    const selectedValue = cells[key] ?? "";
                    const selectedShift = shiftsById.get(selectedValue);
                    return <td key={day.date} className={cn("border border-[var(--border)] p-1 align-top", day.carryIn && "bg-amber-50 dark:bg-amber-500/5")}>
                      <select aria-label={`${employee.fullName}, ${day.label}-kun`} value={selectedValue} disabled={!isDraft || !canWrite} onChange={(event) => setCells((current) => ({ ...current, [key]: event.target.value }))} className="h-8 w-full rounded-lg border border-transparent bg-transparent px-1 text-[10px] text-[var(--text-primary)] hover:border-[var(--border)] focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 disabled:opacity-70">
                        <option value="">—</option>
                        {shifts.map((shift) => <option key={shift.id} value={shift.id}>{shift.name} {shift.startTime}-{shift.endTime}</option>)}
                        {STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                      </select>
                      {selectedShift && (
                        <div
                          className="mt-0.5 whitespace-nowrap text-center font-mono text-[9px] font-semibold leading-none text-indigo-600 dark:text-indigo-300"
                          title={`${selectedShift.name}: ${selectedShift.startTime}–${selectedShift.endTime}${selectedShift.isOvernight ? " (ertangi kun)" : ""}`}
                        >
                          {selectedShift.startTime}–{selectedShift.endTime}{selectedShift.isOvernight ? <sup className="ml-0.5 text-[7px]">+1</sup> : null}
                        </div>
                      )}
                    </td>;
                  })}
                </tr>)}
              </tbody>
            </table>
          <div className="border-t border-slate-200 dark:border-slate-800 px-4 py-3 text-[11px] text-slate-500"><FileSpreadsheet className="inline h-4 w-4 mr-1" />← ustuni oy boshidagi tungi smenaning oldingi kundan kirib keladigan qismini hisoblash uchun.</div>
        </TableShell>

        {detail.status === "APPROVED" && <ScheduleChangePanel detail={detail} employees={employees} targetHospitalId={targetHospitalId} userRole={userRole} />}
      </>}

      {postsLoading && <StatePanel kind="loading" title="Postlar yuklanmoqda" description="Bo‘limning navbatchilik postlari olinmoqda." />}
      {!postsLoading && departmentId && !posts.length && <StatePanel title="Bu bo‘limda hali post yaratilmagan" description="Avval navbatchilik posti yarating, keyin shu post uchun oylik reja tuzing." icon={FileSpreadsheet} actionLabel={canWrite ? "Birinchi postni yaratish" : undefined} onAction={canWrite ? () => setPostFormOpen(true) : undefined} />}
      {selectedPost && !selectedPost.isActive && <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-300">Bu post arxivlangan. Eski grafiklar ko‘rish uchun saqlanadi, yangi oylik reja yaratish uchun postni qayta faollashtiring.</div>}
      {detailLoading && planId && <StatePanel kind="loading" title="Post grafigi yuklanmoqda" />}
      {!detailLoading && postId && !plans.length && <StatePanel title="Oylik grafik hali yaratilmagan" description={`Bu post uchun ${month}/${year} grafigi mavjud emas.`} />}

      <ConfirmDialog
        open={postConfirmation === "archive"}
        onClose={() => setPostConfirmation(null)}
        onConfirm={() => selectedPost && postStatus.mutate({ id: selectedPost.id, isActive: false })}
        title="Post arxivlansinmi?"
        description="Post yangi rejalarda ko‘rinmaydi, ammo avvalgi grafik va tasdiq tarixi saqlanadi."
        confirmLabel="Arxivlash"
        tone="warning"
        loading={postStatus.isPending}
      />
      <ConfirmDialog
        open={postConfirmation === "delete"}
        onClose={() => setPostConfirmation(null)}
        onConfirm={() => selectedPost && deletePost.mutate(selectedPost.id)}
        title="Post butunlay o‘chirilsinmi?"
        description="Faqat grafik tarixi bo‘lmagan post o‘chiriladi. Tarix mavjud bo‘lsa tizim amalni rad etadi."
        confirmLabel="O‘chirish"
        tone="danger"
        loading={deletePost.isPending}
      />
      <PromptDialog
        open={rejectPlanOpen}
        onClose={() => { setRejectPlanOpen(false); setRejectPlanReason(""); }}
        onConfirm={(reason) => statusMutation.mutate({ action: "reject", reason })}
        title="Grafikni rad etish"
        description="Rad etish sababi audit tarixida va mas’ul xodimga ko‘rinadi."
        label="Rad etish sababi"
        value={rejectPlanReason}
        onValueChange={setRejectPlanReason}
        placeholder="Aniq sababni kiriting"
        confirmLabel="Rad etish"
        tone="danger"
        loading={statusMutation.isPending}
      />
    </div>
  );
}

function ScheduleChangePanel({ detail, employees, targetHospitalId, userRole }: { detail: any; employees: any[]; targetHospitalId?: string; userRole?: string }) {
  const qc = useQueryClient();
  const params = requestParams(targetHospitalId);
  const workingEntries = (detail.entries ?? []).filter((entry: any) => entry.entryType === "WORKING");
  const [type, setType] = useState("SUBSTITUTION");
  const [primaryEntryId, setPrimaryEntryId] = useState(workingEntries[0]?.id ?? "");
  const [replacementEmployeeId, setReplacementEmployeeId] = useState("");
  const [counterpartEntryId, setCounterpartEntryId] = useState("");
  const [absenceEntryType, setAbsenceEntryType] = useState("SICK");
  const [reason, setReason] = useState("");
  const [rejectRequestId, setRejectRequestId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const refresh = () => qc.invalidateQueries({ queryKey: ["post-schedule-plan"] });
  const create = useMutation({
    mutationFn: () => schedulePlanningApi.createChange({
      type,
      primaryEntryId,
      ...(type === "SWAP" && { counterpartEntryId }),
      ...(type === "SUBSTITUTION" && { replacementEmployeeId }),
      ...(type !== "SWAP" && { absenceEntryType }),
      reason,
    }, params),
    onSuccess: () => { toast.success("Smena o‘zgarishi yuborildi"); setReason(""); refresh(); },
    onError: (error) => toast.error(getErrorMessage(error, "So‘rov yuborilmadi")),
  });
  const act = async (action: "accept" | "approve" | "reject", id: string, note?: string) => {
    try {
      if (action === "accept") await schedulePlanningApi.acceptChange(id, params);
      if (action === "approve") await schedulePlanningApi.approveChange(id, params);
      if (action === "reject") {
        if (!note?.trim()) return;
        await schedulePlanningApi.rejectChange(id, note.trim(), params);
      }
      toast.success("So‘rov holati yangilandi");
      setRejectRequestId(null);
      setRejectReason("");
      refresh();
    } catch (error) {
      toast.error(getErrorMessage(error, "Amal bajarilmadi"));
    }
  };

  return <Surface className="space-y-4 p-4">
    <div><h3 className="font-bold">Tasdiqlangan grafikdagi o‘zgarish</h3><p className="text-xs text-slate-500">Bazaviy grafik va tasdiq tarixi o‘zgarmaydi. Rahbar tasdiqlagan o‘zgarish amaldagi grafik va ish soatiga qo‘llanadi.</p></div>
    <div className="grid gap-2 md:grid-cols-6">
      <Select aria-label="O‘zgarish turi" value={type} onChange={(event) => setType(event.target.value)} className="text-xs"><option value="SUBSTITUTION">O‘rnini bosish</option><option value="SWAP">O‘zaro almashish</option><option value="ABSENCE">Ishga chiqmaslik</option></Select>
      <Select aria-label="Asosiy smena" value={primaryEntryId} onChange={(event) => setPrimaryEntryId(event.target.value)} className="text-xs"><option value="">Asosiy smena</option>{workingEntries.map((entry: any) => <option key={entry.id} value={entry.id}>{entry.employee.fullName} — {dayjs(entry.workDate).format("DD.MM")}</option>)}</Select>
      {type === "SUBSTITUTION" && <Select aria-label="O‘rnini bosuvchi" value={replacementEmployeeId} onChange={(event) => setReplacementEmployeeId(event.target.value)} className="text-xs"><option value="">O‘rnini bosuvchi</option>{employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.fullName}</option>)}</Select>}
      {type === "SWAP" && <Select aria-label="Ikkinchi smena" value={counterpartEntryId} onChange={(event) => setCounterpartEntryId(event.target.value)} className="text-xs"><option value="">Ikkinchi smena</option>{workingEntries.filter((entry: any) => entry.id !== primaryEntryId).map((entry: any) => <option key={entry.id} value={entry.id}>{entry.employee.fullName} — {dayjs(entry.workDate).format("DD.MM")}</option>)}</Select>}
      {type === "ABSENCE" && <div className="hidden md:block" />}
      {type !== "SWAP" ? <Select aria-label="Yo‘qlik sababi" value={absenceEntryType} onChange={(event) => setAbsenceEntryType(event.target.value)} className="text-xs"><option value="SICK">Kasallik</option><option value="DAY_OFF">Dam / uzrli kun</option><option value="VACATION">Mehnat ta’tili</option><option value="MATERNITY_LEAVE">Tug‘ruq ta’tili</option><option value="TRAINING">Malaka oshirish</option><option value="OTHER_ABSENCE">Boshqa sabab</option></Select> : <div className="hidden md:block" />}
      <Input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Sabab" className="text-xs" />
      <Button onClick={() => create.mutate()} loading={create.isPending} disabled={!primaryEntryId || !reason.trim() || (type === "SUBSTITUTION" && !replacementEmployeeId) || (type === "SWAP" && !counterpartEntryId)} size="sm">So‘rov yuborish</Button>
    </div>
    <div className="space-y-2">
      {(detail.changeRequests ?? []).map((request: any) => <div key={request.id} className="flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 dark:bg-white/[0.03] p-3 text-xs">
        <span className="font-semibold">{request.type}</span><span>{request.primaryEntry.employee.fullName}</span><span className="text-slate-500">{request.reason}</span><span className="ml-auto rounded-full bg-slate-200 dark:bg-white/10 px-2 py-1 font-semibold">{request.status}</span>
        {request.status === "REQUESTED" && <Button onClick={() => act("accept", request.id)} variant="secondary" size="sm">Qabul qilish</Button>}
        {["REQUESTED", "ACCEPTED"].includes(request.status) && ADMIN_ROLES.includes(userRole ?? "") && <><Button onClick={() => act("approve", request.id)} variant="success" size="sm">Tasdiqlash</Button><Button onClick={() => setRejectRequestId(request.id)} variant="danger" size="sm">Rad etish</Button></>}
      </div>)}
    </div>
    <PromptDialog
      open={Boolean(rejectRequestId)}
      onClose={() => { setRejectRequestId(null); setRejectReason(""); }}
      onConfirm={(note) => rejectRequestId && act("reject", rejectRequestId, note)}
      title="Smena o‘zgarishini rad etish"
      description="Sabab so‘rov yuborgan xodimga ko‘rinadi va audit tarixida saqlanadi."
      label="Rad etish sababi"
      value={rejectReason}
      onValueChange={setRejectReason}
      placeholder="Aniq sababni kiriting"
      confirmLabel="Rad etish"
      tone="danger"
    />
  </Surface>;
}
