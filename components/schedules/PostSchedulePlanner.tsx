"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { Archive, Check, Clock, Download, FileSpreadsheet, Pencil, Plus, RotateCcw, Save, Search, Send, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import {
  downloadBlob,
  employeesApi,
  schedulePlanningApi,
  shiftsApi,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import { matchesSearch } from "@/lib/search";
import { filterAndOrderPostEmployees, type PostScheduleEmployeeView } from "@/lib/post-schedule-view";
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
const WEEKDAY_LABELS = ["Ya", "Du", "Se", "Cho", "Pa", "Ju", "Sha"];
const COVERAGE_MODES = [
  { value: "CONTINUOUS_24_7", label: "24 soat × kalendar kuni" },
  { value: "DAILY", label: "N soat × kalendar kuni" },
  { value: "WEEKDAYS", label: "N soat × Dushanba–Juma" },
  { value: "CUSTOM_WEEKLY", label: "Hafta kunlari bo‘yicha oy normasi" },
] as const;
const COVERAGE_WEEKDAYS = [
  { index: 1, label: "Du" },
  { index: 2, label: "Se" },
  { index: 3, label: "Cho" },
  { index: 4, label: "Pa" },
  { index: 5, label: "Ju" },
  { index: 6, label: "Sha" },
  { index: 0, label: "Ya" },
];
type CoverageMode = typeof COVERAGE_MODES[number]["value"];

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

function formatCompactMinutes(minutes: number) {
  const hours = minutes / 60;
  return `${Number.isInteger(hours) ? hours : hours.toFixed(1)}s`;
}

function coverageModeLabel(post: any) {
  const mode: CoverageMode = post?.coverageMode ?? "CONTINUOUS_24_7";
  if (mode === "CONTINUOUS_24_7") return "Oy normasi 24s/kun";
  if (mode === "DAILY") return `Oy normasi ${formatCompactMinutes(post.dailyCoverageMinutes)}/kun`;
  if (mode === "WEEKDAYS") return `Oy normasi Du–Ju ${formatCompactMinutes(post.dailyCoverageMinutes)}`;
  return "Haftalik norma bo‘yicha";
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
  const [outsidePostEmployeeIds, setOutsidePostEmployeeIds] = useState<Set<string>>(new Set());
  const [employeeSearch, setEmployeeSearch] = useState("");
  const deferredEmployeeSearch = useDeferredValue(employeeSearch);
  const [employeeView, setEmployeeView] = useState<PostScheduleEmployeeView>("ALL");
  const [postFormOpen, setPostFormOpen] = useState(false);
  const [editingPostId, setEditingPostId] = useState("");
  const [postName, setPostName] = useState("");
  const [postCode, setPostCode] = useState("");
  const [coverageMode, setCoverageMode] = useState<CoverageMode>("CONTINUOUS_24_7");
  const [dailyCoverageHours, setDailyCoverageHours] = useState("24");
  const [weeklyCoverageHours, setWeeklyCoverageHours] = useState(["0", "8", "8", "8", "8", "8", "0"]);
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

  const closePostForm = () => {
    setPostFormOpen(false);
    setEditingPostId("");
  };

  const openCreatePost = () => {
    setEditingPostId("");
    setPostName("");
    setPostCode("");
    setCoverageMode("CONTINUOUS_24_7");
    setDailyCoverageHours("24");
    setWeeklyCoverageHours(["0", "8", "8", "8", "8", "8", "0"]);
    setPostFormOpen(true);
  };

  const openEditPost = () => {
    if (!selectedPost) return;
    setEditingPostId(selectedPost.id);
    setPostName(selectedPost.name);
    setPostCode(selectedPost.code);
    setCoverageMode(selectedPost.coverageMode ?? "CONTINUOUS_24_7");
    setDailyCoverageHours(String((selectedPost.dailyCoverageMinutes ?? 1440) / 60));
    const weekly = Array.isArray(selectedPost.coverageMinutesByWeekday)
      ? selectedPost.coverageMinutesByWeekday
      : [0, 480, 480, 480, 480, 480, 0];
    setWeeklyCoverageHours(weekly.map((minutes: number) => String(minutes / 60)));
    setPostFormOpen(true);
  };

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
  const plannedEmployeeIds = useMemo(() => new Set(
    Object.entries(cells)
      .filter(([, value]) => Boolean(value))
      .map(([key]) => key.slice(0, key.indexOf(":"))),
  ), [cells]);
  const visibleEmployees = useMemo(() => filterAndOrderPostEmployees(
    employees.filter((employee) => matchesSearch(deferredEmployeeSearch, [
      employee.fullName,
      employee.position?.name,
      employee.department?.name,
      employee.employeeNo,
    ])),
    plannedEmployeeIds,
    outsidePostEmployeeIds,
    employeeView,
  ), [deferredEmployeeSearch, employeeView, employees, outsidePostEmployeeIds, plannedEmployeeIds]);

  useEffect(() => {
    if (!detail) {
      setCells({});
      setOutsidePostEmployeeIds(new Set());
      return;
    }
    const next: Record<string, string> = {};
    const nextOutsidePostEmployeeIds = new Set<string>();
    for (const entry of detail.entries ?? []) {
      const date = dayjs(entry.workDate).format("YYYY-MM-DD");
      next[`${entry.employeeId}:${date}`] = entry.entryType === "WORKING"
        ? entry.shiftId
        : `STATUS:${entry.entryType}`;
      if (entry.countsTowardPostCoverage === false) {
        nextOutsidePostEmployeeIds.add(entry.employeeId);
      }
    }
    setCells(next);
    setOutsidePostEmployeeIds(nextOutsidePostEmployeeIds);
  }, [detail]);

  const canonicalCarryInKeys = useMemo(
    () => new Set(
      (detail?.entries ?? [])
        .filter((entry: any) => entry.isCanonicalCarryIn)
        .map((entry: any) => `${entry.employeeId}:${dayjs(entry.workDate).format("YYYY-MM-DD")}`),
    ),
    [detail],
  );

  const days = useMemo(() => {
    const first = dayjs(`${year}-${String(month).padStart(2, "0")}-01`);
    const regular = Array.from({ length: first.daysInMonth() }, (_, index) => {
      const date = first.date(index + 1);
      return {
        date: date.format("YYYY-MM-DD"),
        label: String(index + 1),
        weekday: WEEKDAY_LABELS[date.day()],
        isWeekend: [0, 6].includes(date.day()),
        carryIn: false,
      };
    });
    const carryDate = first.subtract(1, "day");
    return [
      {
        date: carryDate.format("YYYY-MM-DD"),
        label: `←${carryDate.date()}`,
        weekday: WEEKDAY_LABELS[carryDate.day()],
        isWeekend: [0, 6].includes(carryDate.day()),
        carryIn: true,
      },
      ...regular,
    ];
  }, [month, year]);

  const shiftsById = useMemo(
    () => new Map(shifts.map((shift) => [shift.id, shift])),
    [shifts],
  );

  const liveCoverage = useMemo(() => {
    const monthStart = dayjs(`${year}-${String(month).padStart(2, "0")}-01T00:00:00+05:00`);
    const monthEnd = monthStart.add(1, "month");
    const byDate: Record<string, number> = {};
    const outsideByDate: Record<string, number> = {};
    const incomingByCell: Record<string, number> = {};
    const sourceParts: Record<string, { sameDay: number; nextDays: number }> = {};

    for (const [key, value] of Object.entries(cells)) {
      if (!value || value.startsWith("STATUS:")) continue;
      const separator = key.indexOf(":");
      const employeeId = key.slice(0, separator);
      const workDate = key.slice(separator + 1);
      const shift = shiftsById.get(value);
      if (!shift) continue;
      const coverageByDate = outsidePostEmployeeIds.has(employeeId) ? outsideByDate : byDate;
      const interval = buildShiftInterval(workDate, shift);
      const startsAt = dayjs(interval.startsAt);
      const endsAt = dayjs(interval.endsAt);
      let cursor = startsAt.isAfter(monthStart) ? startsAt : monthStart;
      const clippedEnd = endsAt.isBefore(monthEnd) ? endsAt : monthEnd;
      let sameDay = 0;
      let nextDays = 0;

      while (cursor.isBefore(clippedEnd)) {
        const nextMidnight = cursor.startOf("day").add(1, "day");
        const segmentEnd = nextMidnight.isBefore(clippedEnd) ? nextMidnight : clippedEnd;
        const date = cursor.format("YYYY-MM-DD");
        const minutes = Math.max(0, segmentEnd.diff(cursor, "minute"));
        coverageByDate[date] = (coverageByDate[date] ?? 0) + minutes;
        if (date === workDate) {
          sameDay += minutes;
        } else {
          nextDays += minutes;
          const incomingKey = `${employeeId}:${date}`;
          incomingByCell[incomingKey] = (incomingByCell[incomingKey] ?? 0) + minutes;
        }
        cursor = segmentEnd;
      }
      sourceParts[key] = { sameDay, nextDays };
    }

    return {
      plannedMinutes: Object.values(byDate).reduce((total, minutes) => total + minutes, 0),
      outsidePlannedMinutes: Object.values(outsideByDate).reduce((total, minutes) => total + minutes, 0),
      byDate,
      outsideByDate,
      incomingByCell,
      sourceParts,
    };
  }, [cells, month, outsidePostEmployeeIds, shiftsById, year]);

  const parsedDailyCoverageHours = Number(dailyCoverageHours);
  const parsedWeeklyCoverageMinutes = weeklyCoverageHours.map((hours) => Math.round(Number(hours) * 60));
  const coverageFormValid = coverageMode === "CONTINUOUS_24_7"
    || (coverageMode === "CUSTOM_WEEKLY"
      ? parsedWeeklyCoverageMinutes.every((minutes) => Number.isFinite(minutes) && minutes >= 0 && minutes <= 1440)
        && parsedWeeklyCoverageMinutes.some((minutes) => minutes > 0)
      : Number.isFinite(parsedDailyCoverageHours) && parsedDailyCoverageHours > 0 && parsedDailyCoverageHours <= 24);

  const postCoveragePayload = () => ({
    coverageMode,
    dailyCoverageMinutes: coverageMode === "CONTINUOUS_24_7"
      ? 1440
      : coverageMode === "CUSTOM_WEEKLY"
        ? Math.max(...parsedWeeklyCoverageMinutes)
        : Math.round(parsedDailyCoverageHours * 60),
    ...(coverageMode === "CUSTOM_WEEKLY" && {
      coverageMinutesByWeekday: parsedWeeklyCoverageMinutes,
    }),
  });

  const createPost = useMutation({
    mutationFn: () => schedulePlanningApi.createPost({
      name: postName,
      code: postCode,
      departmentId,
      ...postCoveragePayload(),
    }, params),
    onSuccess: (post) => {
      toast.success("Post yaratildi");
      setPostId(post.id);
      setPostName("");
      setPostCode("");
      closePostForm();
      qc.invalidateQueries({ queryKey: ["schedule-posts"] });
    },
    onError: (error) => toast.error(getErrorMessage(error, "Post yaratilmadi")),
  });

  const updatePost = useMutation({
    mutationFn: () => schedulePlanningApi.updatePost(editingPostId, {
      name: postName,
      code: postCode,
      ...postCoveragePayload(),
    }, params),
    onSuccess: () => {
      toast.success("Post sozlamasi yangilandi. Qoralama rejalar yangi norma bilan qayta hisoblanadi.");
      closePostForm();
      qc.invalidateQueries({ queryKey: ["schedule-posts"] });
      qc.invalidateQueries({ queryKey: ["post-schedule-plan"] });
      qc.invalidateQueries({ queryKey: ["post-schedule-plans"] });
    },
    onError: (error) => toast.error(getErrorMessage(error, "Post sozlamasi yangilanmadi")),
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
        .filter(([key, value]) => !!value && !canonicalCarryInKeys.has(key))
        .map(([key, value]) => {
          const separator = key.indexOf(":");
          const employeeId = key.slice(0, separator);
          const workDate = key.slice(separator + 1);
          if (value.startsWith("STATUS:")) {
            return {
              employeeId,
              entryType: value.slice("STATUS:".length),
              countsTowardPostCoverage: !outsidePostEmployeeIds.has(employeeId),
              workDate,
            };
          }
          const shift = shifts.find((item) => item.id === value);
          if (!shift) throw new Error("Smena topilmadi");
          return {
            employeeId,
            shiftId: shift.id,
            entryType: "WORKING",
            countsTowardPostCoverage: !outsidePostEmployeeIds.has(employeeId),
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
    onError: (error) => toast.error(getErrorMessage(error, error?.message || "Grafik saqlanmadi")),
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
  const displayedPlannedMinutes = isNaN(liveCoverage.plannedMinutes)
    ? summary?.plannedMinutes ?? 0
    : liveCoverage.plannedMinutes;
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
              {posts.map((post: any) => <option key={post.id} value={post.id}>{post.name} — {coverageModeLabel(post)}{post.isActive ? "" : " — arxiv"}</option>)}
            </Select>
          </Field>
          {canWrite && <Button onClick={openCreatePost} variant="secondary" size="sm" className="mt-5"><Plus className="h-3.5 w-3.5" />Yangi post</Button>}
          {selectedPost && canWrite && <Button onClick={openEditPost} variant="secondary" size="sm" className="mt-5"><Pencil className="h-3.5 w-3.5" />Postni sozlash</Button>}
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

        {postFormOpen && <div className="ui-surface-muted mt-3 space-y-3 p-3">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Field label="Post nomi"><Input value={postName} onChange={(event) => setPostName(event.target.value)} placeholder="Masalan: Ona va bola 1" className="text-xs" /></Field>
            <Field label="Post kodi"><Input value={postCode} onChange={(event) => setPostCode(event.target.value)} placeholder="ONA_VA_BOLA_1" className="text-xs" /></Field>
            <Field label="Ish rejimi"><Select value={coverageMode} onChange={(event) => {
              const nextMode = event.target.value as CoverageMode;
              if (coverageMode === "CONTINUOUS_24_7" && nextMode === "DAILY") setDailyCoverageHours("12");
              if (coverageMode === "CONTINUOUS_24_7" && nextMode === "WEEKDAYS") setDailyCoverageHours("8");
              setCoverageMode(nextMode);
            }} className="text-xs">{COVERAGE_MODES.map((mode) => <option key={mode.value} value={mode.value}>{mode.label}</option>)}</Select></Field>
            {coverageMode !== "CONTINUOUS_24_7" && coverageMode !== "CUSTOM_WEEKLY" ? <Field label="Norma koeffitsiyenti (soat)"><Input type="number" min="0.5" max="24" step="0.5" value={dailyCoverageHours} onChange={(event) => setDailyCoverageHours(event.target.value)} className="text-xs" /></Field> : <div className="flex min-h-10 items-end"><div className="w-full rounded-xl border border-indigo-500/20 bg-indigo-500/10 px-3 py-2.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300">{coverageMode === "CONTINUOUS_24_7" ? "Oy normasi: kalendar kunlari × 24 soat" : "Oy normasi hafta kunlari kesimida hisoblanadi"}</div></div>}
          </div>
          {coverageMode === "CUSTOM_WEEKLY" && <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
            {COVERAGE_WEEKDAYS.map((weekday) => <Field key={weekday.index} label={`${weekday.label} (soat)`}><Input type="number" min="0" max="24" step="0.5" value={weeklyCoverageHours[weekday.index]} onChange={(event) => setWeeklyCoverageHours((current) => current.map((value, index) => index === weekday.index ? event.target.value : value))} className="text-xs" /></Field>)}
          </div>}
          <p className="text-[11px] text-[var(--text-muted)]">Bu qiymat bir kunlik xodimlar limiti emas — undan faqat postning oylik jami normasi hisoblanadi. Bir kunda bir nechta xodim ishlashi mumkin. O‘zgarishlar qoralama va yangi rejalarga qo‘llanadi; yuborilgan hamda tasdiqlangan tarix o‘zgarmaydi.</p>
          <div className="flex justify-end gap-2">
            <Button onClick={() => editingPostId ? updatePost.mutate() : createPost.mutate()} loading={createPost.isPending || updatePost.isPending} disabled={!postName.trim() || !postCode.trim() || !coverageFormValid} size="sm">{editingPostId ? "Saqlash" : "Yaratish"}</Button>
            <Button onClick={closePostForm} variant="ghost" size="icon" aria-label="Post formasini yopish"><X className="h-4 w-4" /></Button>
          </div>
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
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {[
            ["Holat", detail.status],
            [`Post normasi · ${coverageModeLabel(detail)}`, formatMinutes(targetMinutes)],
            ["Postga rejalashtirilgan", formatMinutes(displayedPlannedMinutes)],
            [displayedExcessMinutes ? "Oshib ketgan" : "Qolgan", formatMinutes(displayedExcessMinutes || displayedRemainingMinutes)],
            ["Postdan tashqari", formatMinutes(liveCoverage.outsidePlannedMinutes)],
          ].map(([label, value]) => <Surface key={label} className="p-4"><p className="text-[11px] font-medium text-[var(--text-muted)]">{label}</p><p className="mt-1 font-bold text-[var(--text-primary)]">{value}</p></Surface>)}
        </div>

        <div className="rounded-xl border border-sky-500/20 bg-sky-500/10 px-4 py-3 text-xs text-sky-800 dark:text-sky-200">Har bir xodimni “Post xodimi” yoki “Postdan tashqari” deb belgilang. Kunlik 8 soatlik postdan tashqari xodimlar jadval va Excelda ko‘rinadi, ammo postning 720/744 soatlik normasiga qo‘shilmaydi.</div>

        <div className="flex flex-wrap gap-2">
          {isDraft && canWrite && <Button onClick={() => savePlan.mutate()} loading={savePlan.isPending} size="sm"><Save className="h-4 w-4" />Saqlash</Button>}
          {isDraft && canWrite && <Button onClick={() => statusMutation.mutate({ action: "submit" })} loading={statusMutation.isPending} variant="success" size="sm"><Send className="h-4 w-4" />Tasdiqlashga yuborish</Button>}
          {detail.status === "SUBMITTED" && canApprove && <Button onClick={() => statusMutation.mutate({ action: "approve" })} loading={statusMutation.isPending} variant="success" size="sm"><Check className="h-4 w-4" />Tasdiqlash</Button>}
          {detail.status === "SUBMITTED" && canApprove && <Button onClick={() => setRejectPlanOpen(true)} variant="danger" size="sm">Rad etish</Button>}
          <Button onClick={downloadExcel} variant="secondary" size="sm"><Download className="h-4 w-4" />Excel</Button>
        </div>

        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-3">
          <div className="relative min-w-64 flex-1 sm:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
            <Input
              value={employeeSearch}
              onChange={(event) => setEmployeeSearch(event.target.value)}
              placeholder="Xodim, lavozim yoki bo‘limni qidiring..."
              className="pl-9"
              aria-label="Post rejasidagi xodimlarni qidirish"
            />
          </div>
          <div className="flex flex-wrap gap-1">
            {([
              ["ALL", "Barchasi"],
              ["PLANNED", "Grafik bor"],
              ["UNPLANNED", "Grafiksiz"],
              ["OUTSIDE", "Postdan tashqari"],
            ] as const).map(([value, label]) => (
              <Button
                key={value}
                type="button"
                size="sm"
                variant={employeeView === value ? "primary" : "secondary"}
                onClick={() => setEmployeeView(value)}
              >
                {label}
              </Button>
            ))}
          </div>
          <span className="text-xs text-[var(--text-muted)]">{visibleEmployees.length}/{employees.length} xodim</span>
        </div>

        <TableShell>
            <table className="border-collapse text-[11px] min-w-max">
              <thead className="ui-table-head sticky top-0 z-20">
                <tr><th className="ui-table-head sticky left-0 z-30 min-w-56 border border-[var(--border)] p-2 text-left">Xodim</th>{days.map((day) => {
                  const plannedMinutes = liveCoverage.byDate[day.date] ?? 0;
                  const outsideMinutes = liveCoverage.outsideByDate[day.date] ?? 0;
                  return <th key={day.date} title={`${day.date} — ${day.weekday}`} className={cn("w-20 min-w-20 border border-[var(--border)] p-1", day.carryIn ? "bg-amber-100 dark:bg-amber-500/10" : day.isWeekend && "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300")}>
                    <span className={cn("block", day.isWeekend && !day.carryIn && "text-rose-600 dark:text-rose-300")}>{day.label}</span>
                    <span className={cn("mt-0.5 block text-[8px] font-bold uppercase", day.isWeekend && !day.carryIn ? "text-rose-600 dark:text-rose-300" : "text-[var(--text-muted)]")}>{day.weekday}</span>
                    {!day.carryIn && <span className={cn("mt-0.5 block font-mono text-[8px]", plannedMinutes ? "text-indigo-600 dark:text-indigo-300" : "text-[var(--text-muted)]")}>{formatCompactMinutes(plannedMinutes)}</span>}
                    {!day.carryIn && !!outsideMinutes && <span className="mt-0.5 block font-mono text-[7px] text-slate-500">+{formatCompactMinutes(outsideMinutes)} tash.</span>}
                  </th>;
                })}</tr>
              </thead>
              <tbody>
                {visibleEmployees.map((employee) => <tr key={employee.id} className="table-row-hover">
                  <td className="sticky left-0 z-10 border border-[var(--border)] bg-[var(--bg-card)] p-2">
                    <p className="font-semibold text-[var(--text-primary)]">{employee.fullName}</p>
                    <p className="text-[9px] text-[var(--text-muted)]">{employee.position?.name}</p>
                    <select
                      aria-label={`${employee.fullName} post guruhi`}
                      value={outsidePostEmployeeIds.has(employee.id) ? "OUTSIDE" : "POST"}
                      disabled={!isDraft || !canWrite}
                      onChange={(event) => setOutsidePostEmployeeIds((current) => {
                        const next = new Set(current);
                        if (event.target.value === "OUTSIDE") next.add(employee.id);
                        else next.delete(employee.id);
                        return next;
                      })}
                      className={cn("mt-1 h-6 w-full rounded-md border px-1 text-[9px] font-semibold", outsidePostEmployeeIds.has(employee.id) ? "border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" : "border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300")}
                    >
                      <option value="POST">Post xodimi</option>
                      <option value="OUTSIDE">Postdan tashqari</option>
                    </select>
                  </td>
                  {days.map((day) => {
                    const key = `${employee.id}:${day.date}`;
                    const selectedValue = cells[key] ?? "";
                    const selectedShift = shiftsById.get(selectedValue);
                    const incomingMinutes = liveCoverage.incomingByCell[key] ?? 0;
                    const sourcePart = liveCoverage.sourceParts[key];
                    const isCanonicalCarryIn = canonicalCarryInKeys.has(key);
                    return <td key={day.date} className={cn("border border-[var(--border)] p-1 align-top", day.carryIn ? "bg-amber-50 dark:bg-amber-500/5" : day.isWeekend && "bg-rose-50/60 dark:bg-rose-500/[0.04]")}>
                      <select aria-label={`${employee.fullName}, ${day.label}-kun`} value={selectedValue} disabled={!isDraft || !canWrite || isCanonicalCarryIn} onChange={(event) => setCells((current) => ({ ...current, [key]: event.target.value }))} className="h-8 w-full rounded-lg border border-transparent bg-transparent px-1 text-[10px] text-[var(--text-primary)] hover:border-[var(--border)] focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 disabled:opacity-70">
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
                          {sourcePart && <span className="ml-1 text-[8px] text-[var(--text-muted)]">({formatCompactMinutes(sourcePart.sameDay)}{sourcePart.nextDays ? ` + ${formatCompactMinutes(sourcePart.nextDays)}→` : ""})</span>}
                        </div>
                      )}
                      {!!incomingMinutes && <div className="mt-1 rounded bg-sky-500/10 px-1 py-0.5 text-center font-mono text-[8px] font-semibold text-sky-700 dark:text-sky-300">← {formatCompactMinutes(incomingMinutes)} oldingi smenadan</div>}
                      {isCanonicalCarryIn && <div className="mt-1 text-center text-[8px] font-medium text-amber-700 dark:text-amber-300">Oldingi oy rejasidan</div>}
                    </td>;
                  })}
                </tr>)}
                {!visibleEmployees.length && <tr><td colSpan={days.length + 1} className="p-8 text-center text-sm text-[var(--text-muted)]">Qidiruv bo‘yicha xodim topilmadi</td></tr>}
              </tbody>
            </table>
          <div className="border-t border-slate-200 dark:border-slate-800 px-4 py-3 text-[11px] text-slate-500"><FileSpreadsheet className="inline h-4 w-4 mr-1" />← ustuni oldingi oyning eng so‘nggi faol rejasidagi tungi smenadan olinadi. Kun sarlavhasidagi asosiy soat post normasiga kiradigan vaqtni, “tash.” esa postdan tashqari xodimlar vaqtini ko‘rsatadi.</div>
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
  const workingEntries = (detail.entries ?? []).filter((entry: any) => entry.entryType === "WORKING" && !entry.isCarryIn);
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
