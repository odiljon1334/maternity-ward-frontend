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
      qc.invalidateQueries({ queryKey: ["schedule-posts"] });
    },
    onError: (error) => toast.error(getErrorMessage(error, "Post holati o‘zgarmadi")),
  });

  const deletePost = useMutation({
    mutationFn: (id: string) => schedulePlanningApi.deletePost(id, params),
    onSuccess: () => {
      toast.success("Post o‘chirildi");
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
    mutationFn: async (action: "submit" | "approve" | "reject") => {
      if (action === "submit") return schedulePlanningApi.submitPlan(planId, params);
      if (action === "approve") return schedulePlanningApi.approvePlan(planId, params);
      const reason = window.prompt("Rad etish sababini kiriting")?.trim();
      if (!reason) throw new Error("Rad etish sababi kiritilmadi");
      return schedulePlanningApi.rejectPlan(planId, reason, params);
    },
    onSuccess: () => {
      toast.success("Grafik holati yangilandi");
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
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-4 shadow-xl">
        <div className="flex flex-wrap items-center gap-2">
          <label className="space-y-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            <span className="px-1">Bo‘lim</span>
            <select value={departmentId} onChange={(event) => setDepartmentId(event.target.value)} className="block h-9 min-w-52 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1d26] px-3 text-xs font-normal normal-case tracking-normal text-slate-900 dark:text-white">
              {departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
            </select>
          </label>
          <label className="space-y-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            <span className="px-1">Post</span>
            <select value={postId} onChange={(event) => setPostId(event.target.value)} className="block h-9 min-w-52 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1d26] px-3 text-xs font-normal normal-case tracking-normal text-slate-900 dark:text-white">
              <option value="">Postni tanlang</option>
              {posts.map((post: any) => <option key={post.id} value={post.id}>{post.name}{post.isActive ? "" : " — arxiv"}</option>)}
            </select>
          </label>
          {canWrite && <button onClick={() => setPostFormOpen((value) => !value)} className="mt-4 h-9 rounded-xl border border-slate-200 dark:border-white/10 px-3 text-xs font-semibold"><Plus className="inline h-3.5 w-3.5 mr-1" />Yangi post</button>}
          {canWrite && <button onClick={() => setShiftFormOpen((value) => !value)} className="mt-4 h-9 rounded-xl border border-slate-200 dark:border-white/10 px-3 text-xs font-semibold"><Clock className="inline h-3.5 w-3.5 mr-1" />Yangi smena</button>}
          {canCreatePlan && <button onClick={() => createPlan.mutate()} disabled={createPlan.isPending} className="h-9 rounded-xl bg-indigo-600 px-4 text-xs font-semibold text-white">{plans.length ? "Yangi versiya" : "Oylik reja yaratish"}</button>}
          {!!plans.length && <select value={planId} onChange={(event) => setPlanId(event.target.value)} className="h-9 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1d26] px-3 text-xs">
            {plans.map((plan: any) => <option key={plan.id} value={plan.id}>v{plan.version} — {plan.status}</option>)}
          </select>}
          {selectedPost && canWrite && (selectedPost.isActive ? (
            <button
              onClick={() => window.confirm("Post arxivlanadi. Eski grafiklar saqlanadi. Davom etasizmi?") && postStatus.mutate({ id: selectedPost.id, isActive: false })}
              className="mt-4 h-9 rounded-xl border border-amber-500/30 px-3 text-xs font-semibold text-amber-600 dark:text-amber-400"
            ><Archive className="inline h-3.5 w-3.5 mr-1" />Arxivlash</button>
          ) : (
            <button onClick={() => postStatus.mutate({ id: selectedPost.id, isActive: true })} className="mt-4 h-9 rounded-xl border border-emerald-500/30 px-3 text-xs font-semibold text-emerald-600 dark:text-emerald-400"><RotateCcw className="inline h-3.5 w-3.5 mr-1" />Faollashtirish</button>
          ))}
          {selectedPost && canWrite && <button
            onClick={() => window.confirm("Grafik tarixi bo‘lmagan post butunlay o‘chiriladi. Davom etasizmi?") && deletePost.mutate(selectedPost.id)}
            className="mt-4 h-9 rounded-xl border border-rose-500/30 px-3 text-xs font-semibold text-rose-600 dark:text-rose-400"
          ><Trash2 className="inline h-3.5 w-3.5 mr-1" />O‘chirish</button>}
          <button onClick={() => setShowArchivedPosts((value) => !value)} className="mt-4 h-9 rounded-xl px-3 text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5">
            {showArchivedPosts ? "Arxivni yashirish" : "Arxivlanganlar"}
          </button>
        </div>

        {postFormOpen && <div className="mt-3 flex flex-wrap gap-2 rounded-xl bg-slate-50 dark:bg-white/[0.03] p-3">
          <input value={postName} onChange={(event) => setPostName(event.target.value)} placeholder="Post nomi" className="h-9 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 px-3 text-xs" />
          <input value={postCode} onChange={(event) => setPostCode(event.target.value)} placeholder="Post kodi" className="h-9 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 px-3 text-xs" />
          <button onClick={() => createPost.mutate()} disabled={!postName.trim() || !postCode.trim()} className="h-9 rounded-lg bg-indigo-600 px-4 text-xs font-semibold text-white">Yaratish</button>
          <button onClick={() => setPostFormOpen(false)} className="h-9 px-3 text-xs"><X className="h-4 w-4" /></button>
        </div>}

        {shiftFormOpen && <div className="mt-3 flex flex-wrap items-end gap-2 rounded-xl bg-slate-50 dark:bg-white/[0.03] p-3">
          <label className="space-y-1 text-[10px] font-semibold text-slate-500"><span>Smena nomi</span><input value={shiftName} onChange={(event) => setShiftName(event.target.value)} placeholder="Kunduzgi 12 soat" className="block h-9 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 px-3 text-xs text-slate-900 dark:text-white" /></label>
          <label className="space-y-1 text-[10px] font-semibold text-slate-500"><span>Turi</span><select value={shiftType} onChange={(event) => setShiftType(event.target.value)} className="block h-9 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 px-3 text-xs text-slate-900 dark:text-white"><option value="DAYTIME">Kunduzgi</option><option value="NIGHTTIME">Tungi</option><option value="CUSTOM">Maxsus</option></select></label>
          <label className="space-y-1 text-[10px] font-semibold text-slate-500"><span>Boshlanishi</span><input type="time" value={shiftStartTime} onChange={(event) => setShiftStartTime(event.target.value)} className="block h-9 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 px-3 text-xs text-slate-900 dark:text-white" /></label>
          <label className="space-y-1 text-[10px] font-semibold text-slate-500"><span>Tugashi</span><input type="time" value={shiftEndTime} onChange={(event) => setShiftEndTime(event.target.value)} className="block h-9 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 px-3 text-xs text-slate-900 dark:text-white" /></label>
          <div className="h-9 rounded-lg bg-indigo-500/10 px-3 py-2 text-xs font-semibold text-indigo-600 dark:text-indigo-300">{calculateShiftHours(shiftStartTime, shiftEndTime)} soat</div>
          <button onClick={() => createShift.mutate()} disabled={!shiftName.trim() || !shiftStartTime || !shiftEndTime || createShift.isPending} className="h-9 rounded-lg bg-indigo-600 px-4 text-xs font-semibold text-white disabled:opacity-50">Yaratish</button>
          <button onClick={() => setShiftFormOpen(false)} className="h-9 px-3 text-xs"><X className="h-4 w-4" /></button>
        </div>}
      </div>

      {detail && <>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            ["Holat", detail.status],
            ["Post normasi", formatMinutes(targetMinutes)],
            ["Rejalashtirilgan", formatMinutes(displayedPlannedMinutes)],
            [displayedExcessMinutes ? "Oshib ketgan" : "Qolgan", formatMinutes(displayedExcessMinutes || displayedRemainingMinutes)],
          ].map(([label, value]) => <div key={label} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-4"><p className="text-[11px] text-slate-500">{label}</p><p className="mt-1 font-bold">{value}</p></div>)}
        </div>

        <div className="flex flex-wrap gap-2">
          {isDraft && canWrite && <button onClick={() => savePlan.mutate()} disabled={savePlan.isPending} className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white"><Save className="inline h-4 w-4 mr-1" />Saqlash</button>}
          {isDraft && canWrite && <button onClick={() => statusMutation.mutate("submit")} className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white"><Send className="inline h-4 w-4 mr-1" />Tasdiqlashga yuborish</button>}
          {detail.status === "SUBMITTED" && canApprove && <button onClick={() => statusMutation.mutate("approve")} className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white"><Check className="inline h-4 w-4 mr-1" />Tasdiqlash</button>}
          {detail.status === "SUBMITTED" && canApprove && <button onClick={() => statusMutation.mutate("reject")} className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white">Rad etish</button>}
          <button onClick={downloadExcel} className="rounded-xl border border-slate-200 dark:border-white/10 px-4 py-2 text-xs font-semibold"><Download className="inline h-4 w-4 mr-1" />Excel</button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 shadow-xl">
          <div className="overflow-auto max-h-[65vh]">
            <table className="border-collapse text-[11px] min-w-max">
              <thead className="sticky top-0 z-20 bg-slate-100 dark:bg-slate-900">
                <tr><th className="sticky left-0 z-30 min-w-56 border p-2 bg-slate-100 dark:bg-slate-900 text-left">Xodim</th>{days.map((day) => <th key={day.date} className={cn("w-20 min-w-20 border p-1", day.carryIn && "bg-amber-100 dark:bg-amber-500/10")}>{day.label}</th>)}</tr>
              </thead>
              <tbody>
                {employees.map((employee) => <tr key={employee.id}>
                  <td className="sticky left-0 z-10 border bg-white dark:bg-slate-900 p-2"><p className="font-semibold">{employee.fullName}</p><p className="text-[9px] text-slate-500">{employee.position?.name}</p></td>
                  {days.map((day) => {
                    const key = `${employee.id}:${day.date}`;
                    const selectedValue = cells[key] ?? "";
                    const selectedShift = shiftsById.get(selectedValue);
                    return <td key={day.date} className={cn("border p-1 align-top", day.carryIn && "bg-amber-50 dark:bg-amber-500/5")}>
                      <select value={selectedValue} disabled={!isDraft || !canWrite} onChange={(event) => setCells((current) => ({ ...current, [key]: event.target.value }))} className="h-7 w-full rounded border-0 bg-transparent text-[10px] focus:ring-1 focus:ring-indigo-500">
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
          </div>
          <div className="border-t border-slate-200 dark:border-slate-800 px-4 py-3 text-[11px] text-slate-500"><FileSpreadsheet className="inline h-4 w-4 mr-1" />← ustuni oy boshidagi tungi smenaning oldingi kundan kirib keladigan qismini hisoblash uchun.</div>
        </div>

        {detail.status === "APPROVED" && <ScheduleChangePanel detail={detail} employees={employees} targetHospitalId={targetHospitalId} userRole={userRole} />}
      </>}

      {!postsLoading && departmentId && !posts.length && <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-slate-900/40 p-10 text-center">
        <FileSpreadsheet className="mx-auto h-8 w-8 text-slate-400" />
        <h3 className="mt-3 font-semibold text-slate-900 dark:text-white">Bu bo‘limda hali post yaratilmagan</h3>
        <p className="mt-1 text-sm text-slate-500">Avval navbatchilik posti yarating, keyin shu post uchun oylik reja tuzing.</p>
        {canWrite && <button onClick={() => setPostFormOpen(true)} className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white"><Plus className="mr-1 inline h-4 w-4" />Birinchi postni yaratish</button>}
      </div>}
      {selectedPost && !selectedPost.isActive && <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-300">Bu post arxivlangan. Eski grafiklar ko‘rish uchun saqlanadi, yangi oylik reja yaratish uchun postni qayta faollashtiring.</div>}
      {!detailLoading && postId && !plans.length && <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-10 text-center text-sm text-slate-500">Bu post uchun {month}/{year} grafigi hali yaratilmagan.</div>}
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
  const act = async (action: "accept" | "approve" | "reject", id: string) => {
    try {
      if (action === "accept") await schedulePlanningApi.acceptChange(id, params);
      if (action === "approve") await schedulePlanningApi.approveChange(id, params);
      if (action === "reject") {
        const note = window.prompt("Rad etish sababini kiriting")?.trim();
        if (!note) return;
        await schedulePlanningApi.rejectChange(id, note, params);
      }
      toast.success("So‘rov holati yangilandi");
      refresh();
    } catch (error) {
      toast.error(getErrorMessage(error, "Amal bajarilmadi"));
    }
  };

  return <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-4 space-y-4">
    <div><h3 className="font-bold">Tasdiqlangan grafikdagi o‘zgarish</h3><p className="text-xs text-slate-500">Bazaviy grafik va tasdiq tarixi o‘zgarmaydi. Rahbar tasdiqlagan o‘zgarish amaldagi grafik va ish soatiga qo‘llanadi.</p></div>
    <div className="grid gap-2 md:grid-cols-6">
      <select value={type} onChange={(event) => setType(event.target.value)} className="h-9 rounded-lg border bg-transparent px-2 text-xs"><option value="SUBSTITUTION">O‘rnini bosish</option><option value="SWAP">O‘zaro almashish</option><option value="ABSENCE">Ishga chiqmaslik</option></select>
      <select value={primaryEntryId} onChange={(event) => setPrimaryEntryId(event.target.value)} className="h-9 rounded-lg border bg-transparent px-2 text-xs"><option value="">Asosiy smena</option>{workingEntries.map((entry: any) => <option key={entry.id} value={entry.id}>{entry.employee.fullName} — {dayjs(entry.workDate).format("DD.MM")}</option>)}</select>
      {type === "SUBSTITUTION" && <select value={replacementEmployeeId} onChange={(event) => setReplacementEmployeeId(event.target.value)} className="h-9 rounded-lg border bg-transparent px-2 text-xs"><option value="">O‘rnini bosuvchi</option>{employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.fullName}</option>)}</select>}
      {type === "SWAP" && <select value={counterpartEntryId} onChange={(event) => setCounterpartEntryId(event.target.value)} className="h-9 rounded-lg border bg-transparent px-2 text-xs"><option value="">Ikkinchi smena</option>{workingEntries.filter((entry: any) => entry.id !== primaryEntryId).map((entry: any) => <option key={entry.id} value={entry.id}>{entry.employee.fullName} — {dayjs(entry.workDate).format("DD.MM")}</option>)}</select>}
      {type === "ABSENCE" && <div className="hidden md:block" />}
      {type !== "SWAP" ? <select value={absenceEntryType} onChange={(event) => setAbsenceEntryType(event.target.value)} className="h-9 rounded-lg border bg-transparent px-2 text-xs"><option value="SICK">Kasallik</option><option value="DAY_OFF">Dam / uzrli kun</option><option value="VACATION">Mehnat ta’tili</option><option value="MATERNITY_LEAVE">Tug‘ruq ta’tili</option><option value="TRAINING">Malaka oshirish</option><option value="OTHER_ABSENCE">Boshqa sabab</option></select> : <div className="hidden md:block" />}
      <input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Sabab" className="h-9 rounded-lg border bg-transparent px-2 text-xs" />
      <button onClick={() => create.mutate()} disabled={!primaryEntryId || !reason.trim() || (type === "SUBSTITUTION" && !replacementEmployeeId) || (type === "SWAP" && !counterpartEntryId)} className="h-9 rounded-lg bg-indigo-600 px-3 text-xs font-semibold text-white">So‘rov yuborish</button>
    </div>
    <div className="space-y-2">
      {(detail.changeRequests ?? []).map((request: any) => <div key={request.id} className="flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 dark:bg-white/[0.03] p-3 text-xs">
        <span className="font-semibold">{request.type}</span><span>{request.primaryEntry.employee.fullName}</span><span className="text-slate-500">{request.reason}</span><span className="ml-auto rounded-full bg-slate-200 dark:bg-white/10 px-2 py-1 font-semibold">{request.status}</span>
        {request.status === "REQUESTED" && <button onClick={() => act("accept", request.id)} className="rounded-lg border px-2 py-1">Qabul qilish</button>}
        {["REQUESTED", "ACCEPTED"].includes(request.status) && ADMIN_ROLES.includes(userRole ?? "") && <><button onClick={() => act("approve", request.id)} className="rounded-lg bg-emerald-600 px-2 py-1 text-white">Tasdiqlash</button><button onClick={() => act("reject", request.id)} className="rounded-lg bg-rose-600 px-2 py-1 text-white">Rad etish</button></>}
      </div>)}
    </div>
  </div>;
}
