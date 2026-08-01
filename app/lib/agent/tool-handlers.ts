const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api/v1";

const LEAVE_LABELS: Record<string, string> = {
  VACATION:  "Yillik ta'til",
  SICK:      "Kasallik",
  PERSONAL:  "Shaxsiy sabab",
  MATERNITY: "Tug'ruq ta'tili",
  UNPAID:    "Haqsiz ta'til",
};

const apiFetch = async (path: string, token: string, options?: RequestInit) => {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options?.headers,
    },
  });
  if (!res.ok) throw new Error(`API xatosi: ${res.status} → ${path}`);
  const json = await res.json();
  return json.data ?? json;
};

function isOvernight(start: string, end: string): boolean {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return eh * 60 + em < sh * 60 + sm;
}

function calcDurationH(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let mins = eh * 60 + em - (sh * 60 + sm);
  if (mins <= 0) mins += 24 * 60;
  return Math.round(mins / 60);
}

export const toolHandlers: Record<string, (input: any, token: string) => Promise<any>> = {

  // ── Xodimlar ────────────────────────────────────────────────────────────────
  get_employees: ({ search, departmentId, page, limit }, token) => {
    const q = new URLSearchParams();
    if (search)       q.set("search", search);
    if (departmentId) q.set("departmentId", departmentId);
    if (page)         q.set("page", String(page));
    q.set("limit", String(limit ?? 100));
    return apiFetch(`/employees?${q}`, token);
  },

  get_employee: ({ id }, token) =>
    apiFetch(`/employees/${id}`, token),

  // ── Davomat ─────────────────────────────────────────────────────────────────
  get_attendance_daily: ({ date, departmentId }, token) => {
    const q = new URLSearchParams();
    if (date)         q.set("date", date);
    if (departmentId) q.set("departmentId", departmentId);
    return apiFetch(`/attendance/daily?${q}`, token);
  },

  get_attendance_employee: ({ employeeId, month, year }, token) => {
    const q = new URLSearchParams();
    if (month) q.set("month", String(month));
    if (year)  q.set("year", String(year));
    return apiFetch(`/attendance/employee/${employeeId}?${q}`, token);
  },

  // ── Jadval (o'qish) ─────────────────────────────────────────────────────────
  get_schedule_monthly: ({ month, year, departmentId }, token) => {
    const q = new URLSearchParams();
    if (month)        q.set("month", String(month));
    if (year)         q.set("year", String(year));
    if (departmentId) q.set("departmentId", departmentId);
    return apiFetch(`/schedules/monthly?${q}`, token);
  },

  get_schedule_employee: async ({ employeeId, month, year }, token) => {
    const q = new URLSearchParams();
    if (month) q.set("month", String(month));
    if (year)  q.set("year", String(year));
  
    const schedules = await apiFetch(`/schedules/employee/${employeeId}?${q}`, token);
    const list = Array.isArray(schedules) ? schedules : schedules?.data ?? [];
  
    // employee bor bo'lgan birinchi elementni topamiz
    const employee = list.find((s: any) => s.employee)?.employee;
  
    // employee topilmasa — alohida so'rov
    let empData = employee;
    if (!empData) {
      try {
        empData = await apiFetch(`/employees/${employeeId}`, token);
      } catch {}
    }
  
    return {
      employeeName: empData?.fullName ?? null,
      department:   empData?.department?.name ?? null,
      position:     empData?.position?.name ?? null,
      schedules:    list,
    };
  },
  
  // ── Shiftlar ────────────────────────────────────────────────────────────────
  get_shifts: (_input, token) =>
    apiFetch(`/shifts`, token),

  create_shift: async ({ name, type, startTime, endTime, graceMinutes, lunchStart, lunchEnd, hospitalId }, token) => {
    const overnight = isOvernight(startTime, endTime);
    const durationH = calcDurationH(startTime, endTime);
  
    const q = new URLSearchParams();
    if (hospitalId) q.set("targetHospitalId", hospitalId);
  
    return apiFetch(`/shifts?${q}`, token, {
      method: "POST",
      body: JSON.stringify({
        name,
        type,
        startTime,
        endTime,
        durationH,
        isOvernight:   overnight,
        graceMinutes:  graceMinutes ?? 15,
        lunchStart:    lunchStart ?? null,
        lunchEnd:      lunchEnd   ?? null,
        lunchGraceMin: 10,
      }),
    });
  },

  // ── Jadval (yozish) ─────────────────────────────────────────────────────────
  create_schedule_employee: async ({ employeeId, entries }, token) => {
    const res = await apiFetch(`/schedules/manual`, token, {
      method: "POST",
      body: JSON.stringify({ employeeId, entries }),
    });
    return {
      employeeId,
      created: res?.created ?? entries.filter((e: any) => e.status === "WORKING").length,
      total:   entries.length,
      success: true,
    };
  },

  create_schedule_bulk: async ({ employeeIds, entries }, token) => {
    const results = [];
    for (const empId of employeeIds) {
      try {
        const res = await apiFetch(`/schedules/manual`, token, {
          method: "POST",
          body: JSON.stringify({ employeeId: empId, entries }),
        });
        results.push({
          employeeId: empId,
          created:    res?.created ?? entries.filter((e: any) => e.status === "WORKING").length,
          success:    true,
        });
      } catch (e: any) {
        results.push({ employeeId: empId, error: e.message, success: false });
      }
    }
    const ok   = results.filter((r) => r.success).length;
    const fail = results.filter((r) => !r.success).length;
    return { results, summary: { total: employeeIds.length, success: ok, failed: fail } };
  },

  // ── Maosh ───────────────────────────────────────────────────────────────────
  get_payroll_list: ({ month, year, departmentId }, token) => {
    const q = new URLSearchParams();
    if (month)        q.set("month", String(month));
    if (year)         q.set("year", String(year));
    if (departmentId) q.set("departmentId", departmentId);
    return apiFetch(`/payroll?${q}`, token);
  },

  get_payroll_employee: ({ employeeId, month, year }, token) => {
    const q = new URLSearchParams();
    if (month) q.set("month", String(month));
    if (year)  q.set("year", String(year));
    return apiFetch(`/payroll/${employeeId}?${q}`, token);
  },

  preview_payroll: ({ employeeId, month, year }, token) => {
    const q = new URLSearchParams();
    if (month) q.set("month", String(month));
    if (year)  q.set("year", String(year));
    return apiFetch(`/payroll/preview/${employeeId}?${q}`, token);
  },

  // ── Dashboard ───────────────────────────────────────────────────────────────
  get_dashboard_overview: ({ date }, token) => {
    const q = new URLSearchParams();
    if (date) q.set("date", date);
    return apiFetch(`/dashboard/overview?${q}`, token);
  },

  get_dashboard_analytics: ({ month, year }, token) => {
    const q = new URLSearchParams();
    if (month) q.set("month", String(month));
    if (year)  q.set("year", String(year));
    return apiFetch(`/dashboard/analytics/performance?${q}`, token);
  },

  // ── Ta'til ──────────────────────────────────────────────────────────────────
  get_leave_requests: ({ status, page, limit }, token) => {
    const q = new URLSearchParams();
    if (status) q.set("status", status);
    if (page)   q.set("page", String(page));
    if (limit)  q.set("limit", String(limit ?? 20));
    return apiFetch(`/leave?${q}`, token);
  },

  get_employees_on_leave: async ({ date, departmentId }, token) => {
    const today = date || new Date().toISOString().slice(0, 10);
    const q = new URLSearchParams();
    q.set("status", "APPROVED");
    q.set("limit", "200");

    const data    = await apiFetch(`/leave?${q}`, token);
    const records = data?.records ?? data ?? [];

    // Bugungi sana oralig'ida bo'lgan tatillarni filter
    let onLeave = records.filter((r: any) => {
      const start = r.startDate?.slice(0, 10);
      const end   = r.endDate?.slice(0, 10);
      return today >= start && today <= end;
    });

    // Bo'lim filtri
    if (departmentId) {
      onLeave = onLeave.filter(
        (r: any) =>
          r.employee?.department?.id === departmentId ||
          r.employee?.departmentId   === departmentId
      );
    }

    return {
      date:  today,
      count: onLeave.length,
      employees: onLeave.map((r: any) => ({
        employeeId:   r.employeeId,
        employeeName: r.employee?.fullName,
        department:   r.employee?.department?.name,
        position:     r.employee?.position?.name,
        leaveType:    r.type,
        leaveLabel:   LEAVE_LABELS[r.type] ?? r.type,
        startDate:    r.startDate?.slice(0, 10),
        endDate:      r.endDate?.slice(0, 10),
        daysCount:    r.daysCount,
        daysLeft:     Math.max(0, Math.ceil(
          (new Date(r.endDate).getTime() - new Date(today).getTime()) / 86400000
        )),
        reason:       r.reason     ?? null,
        reviewNote:   r.reviewNote ?? null,
      })),
    };
  },

  // ── Bo'limlar ───────────────────────────────────────────────────────────────
  get_departments: (_input, token) =>
    apiFetch(`/departments`, token),
};