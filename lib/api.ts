/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api/v1";
export const API_ORIGIN = BASE_URL.replace(/\/api\/v1\/?$/, "");

// Backend server URL (static files: photos)
export const BACKEND_ORIGIN = BASE_URL.replace(/\/api\/v1\/?$/, "");

// Helper: convert relative photo path (/uploads/...) to full URL
export function photoUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("http")) return url;
  return `${BACKEND_ORIGIN}${url}`;
}

/**
 * Ro'yxatlardagi kichik avatar uchun URL (128x128, ~3-6 KB).
 *
 * Backend `/uploads/thumb/<fayl>` ni birinchi so'rovda o'zi generatsiya qiladi,
 * keyin diskdan beradi. Migratsiya kerak emas.
 * To'liq o'lchamli rasm kerak bo'lsa (profil sahifasi) — `photoUrl` ishlatiladi.
 */
export function photoThumbUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("http")) return url;
  if (!url.startsWith("/uploads/")) return `${BACKEND_ORIGIN}${url}`;
  const filename = url.slice("/uploads/".length);
  // Ichki papkadagi fayllar (masalan selfies/) thumbnail qilinmaydi
  if (filename.includes("/")) return `${BACKEND_ORIGIN}${url}`;
  return `${BACKEND_ORIGIN}/uploads/thumb/${filename}`;
}

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  // Sessiya HttpOnly cookie'da; JavaScript tokenni o'qimaydi va yubormaydi.
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Response interceptor — 401 → login
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("user");
      localStorage.removeItem("auth-storage");
      // HttpOnly cookie'ni browser JavaScript o'chira olmaydi.
      // Serverdagi public logout endpoint uni xavfsiz tozalaydi.
      void fetch(`${BASE_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
        keepalive: true,
      });
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// ─── Auth ───────────────────────────────────────
export const authApi = {
  login: (data: { username: string; password: string }) =>
    api.post("/auth/login", data).then((r) => r.data.data),
  migrateLegacySession: (token: string) =>
    api.post("/auth/browser-session", undefined, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => r.data.data),
  profile: () => api.get("/auth/profile").then((r) => r.data.data),
  register: (data: { username: string; password: string; role?: string }) =>
    api.post("/auth/register", data).then((r) => r.data.data),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put("/auth/change-password", data).then((r) => r.data.data),
  logout: () => api.post("/auth/logout").then((r) => r.data.data),

  // ─── Email tasdiqlash ───
  updateEmail: (data: { email: string }) =>
    api.put("/auth/email", data).then((r) => r.data.data),
  resendEmailOtp: () =>
    api.post("/auth/email/resend-otp").then((r) => r.data.data),
  verifyEmailOtp: (data: { code: string }) =>
    api.post("/auth/email/verify-otp", data).then((r) => r.data.data),

  // ─── Parolni tiklash ───
  forgotPassword: (data: { username: string }) =>
    api.post("/auth/forgot-password", data).then((r) => r.data.data),
  resetPassword: (data: { token: string; newPassword: string }) =>
    api.post("/auth/reset-password", data).then((r) => r.data.data),
  verifyResetOtp: (data: { username: string; code: string; newPassword: string }) =>
    api.post("/auth/reset-password/otp", data).then((r) => r.data.data),
};

// ─── Dashboard ──────────────────────────────────
export const dashboardApi = {
  overview: (params?: { date?: string; targetHospitalId?: string }) =>
    api.get("/dashboard/overview", { params }).then((r) => r.data.data),
  trend: (params?: { days?: number; targetHospitalId?: string }) =>
    api.get("/dashboard/trend", { params }).then((r) => r.data.data),
  departments: (params?: { targetHospitalId?: string }) =>
    api.get("/dashboard/departments", { params }).then((r) => r.data.data),
  topLate: (params?: { limit?: number; targetHospitalId?: string }) =>
    api.get("/dashboard/top-late", { params }).then((r) => r.data.data),
  // ─── Analytics ───
  analyticsMonthly: (params?: { months?: number; targetHospitalId?: string }) =>
    api.get("/dashboard/analytics/monthly", { params }).then((r) => r.data.data),
  analyticsPerformance: (params?: { month?: number; year?: number; limit?: number; targetHospitalId?: string }) =>
    api.get("/dashboard/analytics/performance", { params }).then((r) => r.data.data),
  analyticsPayrollTrend: (params?: { months?: number; targetHospitalId?: string }) =>
    api.get("/dashboard/analytics/payroll-trend", { params }).then((r) => r.data.data),
  analyticsLeaves: (params?: { year?: number; targetHospitalId?: string }) =>
    api.get("/dashboard/analytics/leaves", { params }).then((r) => r.data.data),
  analyticsCheckinHeatmap: (params?: { days?: number; targetHospitalId?: string }) =>
    api.get("/dashboard/analytics/checkin-heatmap", { params }).then((r) => r.data.data),
};

// ─── Departments ────────────────────────────────
export const departmentsApi = {
  list: (params?: { targetHospitalId?: string }) =>
    api.get("/departments", { params }).then((r) => r.data.data),
  create: (data: any, params?: { targetHospitalId?: string }) =>
    api.post("/departments", data, { params }).then((r) => r.data.data),
  update: (id: string, data: any) =>
    api.put(`/departments/${id}`, data).then((r) => r.data.data),
  delete: (id: string) =>
    api.delete(`/departments/${id}`).then((r) => r.data.data),
};

// ─── Positions ──────────────────────────────────
export const positionsApi = {
  list: (params?: { targetHospitalId?: string }) =>
    api.get("/positions", { params }).then((r) => r.data.data),
  create: (data: any, params?: { targetHospitalId?: string }) =>
    api.post("/positions", data, { params }).then((r) => r.data.data),
  update: (id: string, data: any) =>
    api.put(`/positions/${id}`, data).then((r) => r.data.data),
  delete: (id: string) =>
    api.delete(`/positions/${id}`).then((r) => r.data.data),
};

// ─── Shifts ─────────────────────────────────────
export const shiftsApi = {
  list: (params?: { targetHospitalId?: string }) =>
    api.get("/shifts", { params }).then((r) => r.data.data),
  create: (data: any, params?: { targetHospitalId?: string }) =>
    api.post("/shifts", data, { params }).then((r) => r.data.data),
  /** Vaqt oralig'i bo'yicha smenni topadi yoki yaratadi (idempotent) */
  resolve: (data: any, params?: { targetHospitalId?: string }) =>
    api.post("/shifts/resolve", data, { params }).then((r) => r.data.data),
  update: (id: string, data: any, params?: { targetHospitalId?: string }) =>
    api.put(`/shifts/${id}`, data, { params }).then((r) => r.data.data),
  delete: (id: string, params?: { targetHospitalId?: string }) =>
    api.delete(`/shifts/${id}`, { params }).then((r) => r.data.data),
  seed: (params?: { targetHospitalId?: string }) =>
    api.post("/shifts/seed", {}, { params }).then((r) => r.data.data),
};

// ─── Employees ──────────────────────────────────
export const employeesApi = {
  list: (params?: any) =>
    api.get("/employees", { params }).then((r) => r.data),
  get: (id: string, params?: { targetHospitalId?: string }) =>
    api.get(`/employees/${id}`, { params }).then((r) => r.data.data),
  create: (data: any, params?: { targetHospitalId?: string }) =>
    api.post("/employees", data, { params }).then((r) => r.data.data),
  update: (id: string, data: any, params?: { targetHospitalId?: string }) =>
    api.put(`/employees/${id}`, data, { params }).then((r) => r.data.data),
  fire: (id: string, data?: { fireReason?: string; fireNote?: string; firedAt?: string }, params?: { targetHospitalId?: string }) =>
    api.put(`/employees/${id}/fire`, data ?? {}, { params }).then((r) => r.data.data),
  delete: (id: string, params?: { targetHospitalId?: string }) =>
    api.delete(`/employees/${id}`, { params }).then((r) => r.data.data),
  uploadPhoto: (id: string, file: File, params?: { targetHospitalId?: string }) => {
    const form = new FormData();
    form.append("photo", file);
    return api.post(`/employees/${id}/photo`, form, {
      headers: { "Content-Type": "multipart/form-data" },
      params,
      // Terminal sinxronizatsiyasi fonda ketadi, lekin rasm fayli katta
      // bo'lishi mumkin — yuklash uchun kengroq muddat
      timeout: 60_000,
    }).then((r) => r.data.data);
  },
  exportExcel: (params?: { targetHospitalId?: string }) =>
    api.get("/employees/export/excel", { params, responseType: "blob" }),
  exportEnrollPic: (params?: { targetHospitalId?: string }) =>
    api.get("/employees/export/enroll-pic", { params, responseType: "blob" }),
  fixEmployeeNumbers: (params?: { targetHospitalId?: string }) =>
    api.post("/employees/fix-employee-numbers", {}, { params }).then((r) => r.data),
  csvTemplate: () =>
    api.get("/employees/export/csv-template", { responseType: "blob" }),
  importCsv: (file: File, params?: { targetHospitalId?: string }) => {
    const form = new FormData();
    form.append("file", file);
    return api.post("/employees/import/csv", form, {
      headers: { "Content-Type": "multipart/form-data" },
      params,
    }).then((r) => r.data.data);
  },
  bulkDelete: (ids: string[], params?: { targetHospitalId?: string }) =>
    api.post("/employees/bulk-delete", { ids }, { params }).then((r) => r.data),
  bulkMoveDepartment: (ids: string[], departmentId: string, params?: { targetHospitalId?: string }) =>
    api.put("/employees/bulk-department", { ids, departmentId }, { params }).then((r) => r.data),
  archive: (params?: { search?: string; page?: number; limit?: number; targetHospitalId?: string }) =>
    api.get("/employees/archive", { params }).then((r) => r.data),
  getArchived: (id: string) =>
    api.get(`/employees/archive/${id}`).then((r) => r.data.data ?? r.data),
  lookup: (params: { fullName: string; birthDate?: string; targetHospitalId?: string }) =>
    api.get("/employees/lookup", { params }).then((r) => r.data.data ?? r.data),
};

// ─── Schedules ──────────────────────────────────
export const schedulesApi = {
  my: (params?: { month?: number; year?: number }) =>
    api.get("/schedules/my", { params }).then((r) => r.data.data ?? r.data),
  daily: (params?: { date?: string; targetHospitalId?: string }) =>
    api.get("/schedules/daily", { params }).then((r) => r.data.data),
  monthly: (params?: { month?: number; year?: number; targetHospitalId?: string }) =>
    api.get("/schedules/monthly", { params }).then((r) => r.data.data),
  
  // YANGI QO'SHILADIGAN API'LAR:
  statisticsSummary: (params?: { month?: number; year?: number; targetHospitalId?: string }) =>
    api.get("/schedules/statistics/summary", { params }).then((r) => r.data.data ?? r.data),
  monthlyPaginated: (params?: {
    month?: number;
    year?: number;
    page?: number;
    limit?: number;
    targetHospitalId?: string;
    departmentId?: string;
    search?: string;
    scheduleFilter?: "all" | "with" | "without";
  }) =>
    api.get("/schedules/monthly-paginated", { params }).then((r) => ({
      data: r.data.data ?? [],
      meta: r.data.meta,
    })),

  employee: (id: string, params?: { month?: number; year?: number }) =>
    api.get(`/schedules/employee/${id}`, { params }).then((r) => r.data.data),
  generate: (data: any) => api.post("/schedules/generate", data).then((r) => r.data.data),
  bulkGenerate: (data: any) => api.post("/schedules/bulk-generate", data).then((r) => r.data.data),
  bulkManual: (data: any) => api.post("/schedules/manual", data).then((r) => r.data.data),
  update: (id: string, data: any) => api.put(`/schedules/${id}`, data).then((r) => r.data.data),
  rollover: (data: { fromMonth: number; fromYear: number; toMonth: number; toYear: number }, params?: { targetHospitalId?: string }) =>
    api.post("/schedules/rollover", data, { params }).then((r) => r.data),
  importXlsx: (formData: FormData, params?: { targetHospitalId?: string }) =>
    api.post("/schedules/import-xlsx", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      params,
      timeout: 300000,
    }).then((r) => r.data.data ?? r.data),
};

// ─── Post-based schedule planning (hospital opt-in) ───────
export const schedulePlanningApi = {
  config: (params?: { targetHospitalId?: string }) =>
    api.get("/schedule-planning/config", { params }).then((r) => r.data.data),
  posts: (params?: { targetHospitalId?: string; departmentId?: string; includeArchived?: boolean }) =>
    api.get("/schedule-planning/posts", { params }).then((r) => r.data.data),
  createPost: (
    data: { name: string; code: string; departmentId: string; dailyCoverageMinutes?: number },
    params?: { targetHospitalId?: string },
  ) => api.post("/schedule-planning/posts", data, { params }).then((r) => r.data.data),
  setPostStatus: (id: string, isActive: boolean, params?: { targetHospitalId?: string }) =>
    api.patch(`/schedule-planning/posts/${id}/status`, { isActive }, { params }).then((r) => r.data.data),
  deletePost: (id: string, params?: { targetHospitalId?: string }) =>
    api.delete(`/schedule-planning/posts/${id}`, { params }).then((r) => r.data.data),
  plans: (params: { targetHospitalId?: string; year: number; month: number; postId?: string }) =>
    api.get("/schedule-planning/plans", { params }).then((r) => r.data.data),
  plan: (id: string, params?: { targetHospitalId?: string }) =>
    api.get(`/schedule-planning/plans/${id}`, { params }).then((r) => r.data.data),
  createPlan: (
    data: { postId: string; year: number; month: number },
    params?: { targetHospitalId?: string },
  ) => api.post("/schedule-planning/plans", data, { params }).then((r) => r.data.data),
  saveEntries: (id: string, entries: any[], params?: { targetHospitalId?: string }) =>
    api.put(`/schedule-planning/plans/${id}/entries`, { entries }, { params }).then((r) => r.data.data),
  submitPlan: (id: string, params?: { targetHospitalId?: string }) =>
    api.post(`/schedule-planning/plans/${id}/submit`, {}, { params }).then((r) => r.data.data),
  approvePlan: (id: string, params?: { targetHospitalId?: string }) =>
    api.post(`/schedule-planning/plans/${id}/approve`, {}, { params }).then((r) => r.data.data),
  rejectPlan: (id: string, reason: string, params?: { targetHospitalId?: string }) =>
    api.post(`/schedule-planning/plans/${id}/reject`, { reason }, { params }).then((r) => r.data.data),
  exportPlan: (id: string, params?: { targetHospitalId?: string }) =>
    api.get(`/schedule-planning/plans/${id}/export`, { params, responseType: "blob" }),
  createChange: (data: any, params?: { targetHospitalId?: string }) =>
    api.post("/schedule-planning/changes", data, { params }).then((r) => r.data.data),
  myChanges: () =>
    api.get("/schedule-planning/changes/my").then((r) => r.data.data),
  myChangeOptions: (entryId: string) =>
    api.get(`/schedule-planning/changes/options/${entryId}`).then((r) => r.data.data),
  acceptChange: (id: string, params?: { targetHospitalId?: string }) =>
    api.patch(`/schedule-planning/changes/${id}/accept`, {}, { params }).then((r) => r.data.data),
  approveChange: (id: string, params?: { targetHospitalId?: string }) =>
    api.patch(`/schedule-planning/changes/${id}/approve`, {}, { params }).then((r) => r.data.data),
  rejectChange: (id: string, reason: string, params?: { targetHospitalId?: string }) =>
    api.patch(`/schedule-planning/changes/${id}/reject`, { reason }, { params }).then((r) => r.data.data),
};

// ─── Attendance ─────────────────────────────────
export const attendanceApi = {
  daily: (params?: { date?: string; departmentId?: string; targetHospitalId?: string }) =>
    api.get("/attendance/daily", { params }).then((r) => r.data.data),
  employee: (id: string, params?: any) =>
    api.get(`/attendance/employee/${id}`, { params }).then((r) => r.data.data),
  weeklyStats: (employeeId: string, params?: any) =>
    api.get(`/attendance/weekly-stats/${employeeId}`, { params }).then((r) => r.data.data),
  manualCheckin: (data: any) =>
    api.post("/attendance/manual-checkin", data).then((r) => r.data.data),
  my: (params?: { month?: number; year?: number }) =>
    api.get("/attendance/my", { params }).then((r) => r.data.data ?? r.data),
  selfCheckIn: (opts: {
    gpsLat?: number;
    gpsLng?: number;
    gpsAccuracy?: number;
    selfie?: File | null;
  }) => {
    const form = new FormData();
    if (opts.gpsLat      != null) form.append("gpsLat",      String(opts.gpsLat));
    if (opts.gpsLng      != null) form.append("gpsLng",      String(opts.gpsLng));
    if (opts.gpsAccuracy != null) form.append("gpsAccuracy", String(opts.gpsAccuracy));
    if (opts.selfie)               form.append("selfie",      opts.selfie);
    return api.post("/attendance/self-checkin", form, {
      headers: { "Content-Type": "multipart/form-data" },
    }).then((r) => r.data.data ?? r.data);
  },
  resetEmployeeGps: (employeeId: string) =>
    api.post(`/attendance/reset-employee-gps/${employeeId}`).then((r) => r.data.data),
};

// ─── Location ─────────────────────────────────
export const locationApi = {
  trackingSession: () =>
    api.get("/location/tracking-session").then((r) => r.data.data as {
      active: boolean;
      checkIn: string | null;
      expectedCheckOut: string | null;
      reason: "EMPLOYEE_NOT_FOUND" | "SHIFT_ENDED" | "NOT_CHECKED_IN" | null;
      heartbeatMs: number;
    }),
  sendLive: (opts: { latitude: number; longitude: number; accuracy: number; battery?: number }) =>
    api.post("/location/live", opts).then((r) => r.data.data as {
      ok: boolean;
      stopTracking?: boolean;
      reason?: string;
    }),
};

// ─── Payroll ────────────────────────────────────
export const payrollApi = {
  list: (params?: { month?: number; year?: number; departmentId?: string; targetHospitalId?: string }) =>
    api.get("/payroll", { params }).then((r) => r.data.data),
  employee: (id: string, params?: any) =>
    api.get(`/payroll/${id}`, { params }).then((r) => r.data.data),
  preview: (employeeId: string, params?: any) =>
    api.get(`/payroll/preview/${employeeId}`, { params }).then((r) => r.data.data),
  generate: (data: any, params?: { targetHospitalId?: string }) =>
    api.post("/payroll/generate", data, { params }).then((r) => r.data.data),
  save: (employeeId: string, data: any) =>
    api.post(`/payroll/save/${employeeId}`, data).then((r) => r.data.data),
  approve: (id: string) => api.put(`/payroll/approve/${id}`).then((r) => r.data.data),
  exportExcel: (params?: any) =>
    api.get("/payroll/export/excel", { params, responseType: "blob" }),
  downloadPayslip: (employeeId: string, params?: { month?: number; year?: number }) =>
    api.get(`/payroll/payslip/${employeeId}`, { params, responseType: "blob" }),
  // EMPLOYEE endpoints
  myList: (params?: { month?: number; year?: number }) =>
    api.get("/payroll/my", { params }).then((r) => r.data.data ?? r.data),
  downloadMyPayslip: (params?: { month?: number; year?: number }) =>
    api.get("/payroll/my/payslip", { params, responseType: "blob" }),
};

export const compensationApi = {
  adjustments: (params?: any) =>
    api.get("/compensation/adjustments", { params }).then((r) => r.data.data ?? r.data),
  createAdjustment: (data: any, params?: any) =>
    api.post("/compensation/adjustments", data, { params }).then((r) => r.data.data ?? r.data),
  decideAdjustment: (id: string, data: any, params?: any) =>
    api.patch(`/compensation/adjustments/${id}/decision`, data, { params }).then((r) => r.data.data ?? r.data),
  myAdjustments: (params?: any) =>
    api.get("/compensation/my/adjustments", { params }).then((r) => r.data.data ?? r.data),
  submitExplanation: (id: string, explanation: string) =>
    api.patch(`/compensation/my/adjustments/${id}/explanation`, { explanation }).then((r) => r.data.data ?? r.data),
  acknowledgeAdjustment: (id: string) =>
    api.patch(`/compensation/my/adjustments/${id}/acknowledge`).then((r) => r.data.data ?? r.data),
  advances: (params?: any) =>
    api.get("/compensation/advances", { params }).then((r) => r.data.data ?? r.data),
  createAdvance: (data: any, params?: any) =>
    api.post("/compensation/advances", data, { params }).then((r) => r.data.data ?? r.data),
  decideAdvance: (id: string, data: any, params?: any) =>
    api.patch(`/compensation/advances/${id}/decision`, data, { params }).then((r) => r.data.data ?? r.data),
  markAdvancePaid: (id: string, data: any, params?: any) =>
    api.patch(`/compensation/advances/${id}/paid`, data, { params }).then((r) => r.data.data ?? r.data),
  myAdvances: (params?: any) =>
    api.get("/compensation/my/advances", { params }).then((r) => r.data.data ?? r.data),
  requestMyAdvance: (data: any) =>
    api.post("/compensation/my/advances", data).then((r) => r.data.data ?? r.data),
};

export const hikvisionApi = {
  // Terminal CRUD
  getTerminals: (hospitalId: string) =>
    api.get(`/hikvision/terminals?hospitalId=${hospitalId}`),
  addTerminal: (data: { hospitalId: string; name: string; devIndex: string; password?: string }) =>
    api.post(`/hikvision/terminals`, data),
  deleteTerminal: (id: string, hospitalId: string) =>
    api.delete(`/hikvision/terminals/${id}?hospitalId=${hospitalId}`),
  toggleTerminal: (id: string, isActive: boolean, hospitalId: string) =>
    api.patch(`/hikvision/terminals/${id}`, { isActive, hospitalId }),
  getTerminalsWithStatus: (hospitalId: string) =>
    api.get(`/hikvision/terminals?hospitalId=${hospitalId}`),
  
  // Sync
  syncHospital: (hospitalId: string) =>
    api
      .post(`/hikvision/sync/${hospitalId}`, undefined, {
        // Xodimlar terminalga ketma-ket person + face sifatida yoziladi.
        // Katta muassasada bu bir necha daqiqa davom etishi normal.
        timeout: 15 * 60 * 1000,
      })
      .then((r) => r.data.data),
};

// ─── Reports ────────────────────────────────────
export const reportsApi = {
  attendanceExcel: (params: { month: number; year: number; departmentId?: string; targetHospitalId?: string }) =>
    api.get("/reports/attendance/excel", { params, responseType: "blob" }),
  payrollExcel: (params: { month: number; year: number; departmentId?: string; targetHospitalId?: string }) =>
    api.get("/reports/payroll/excel", { params, responseType: "blob" }),
  weeklyExcel: (params: { weekStart: string; departmentId?: string; targetHospitalId?: string }) =>
    api.get("/reports/attendance/weekly", { params, responseType: "blob" }),
  // T-13 tabel (1C:ZUP uchun moslashtirilgan) — StaffPulse rejasi (2026-09-20)
  t13Excel: (params: { month: number; year: number; departmentId?: string; targetHospitalId?: string }) =>
    api.get("/reports/t13/excel", { params, responseType: "blob" }),
};

// ─── Hospitals (SUPER_ADMIN) ─────────────────────
export const hospitalsApi = {
  list: () => api.get("/hospitals").then((r) => r.data.data),
  get: (id: string) => api.get(`/hospitals/${id}`).then((r) => r.data.data),
  create: (data: any) => api.post("/hospitals", data).then((r) => r.data.data),
  update: (id: string, data: any) => api.put(`/hospitals/${id}`, data).then((r) => r.data.data),
  setSchedulePlanningMode: (id: string, mode: "STANDARD" | "POST_COVERAGE") =>
    api.patch(`/hospitals/${id}/schedule-planning-mode`, { mode }).then((r) => r.data.data),
  delete: (id: string) => api.delete(`/hospitals/${id}`).then((r) => r.data.data),
  createDirector: (hospitalId: string, data: any) =>
    api.post(`/hospitals/${hospitalId}/directors`, data).then((r) => r.data.data),
  updateDirector: (hospitalId: string, data: any) =>
    api.patch(`/hospitals/${hospitalId}/directors`, data).then((r) => r.data.data),
  block: (id: string) => api.patch(`/hospitals/${id}/block`).then((r) => r.data.data),
  unblock: (id: string) => api.patch(`/hospitals/${id}/unblock`).then((r) => r.data.data),
  updateGpsRadius: (id: string, radius: number) =>
    api.patch(`/hospitals/${id}/gps-radius`, { radius }).then((r) => r.data.data),
  resetGps: (id: string) =>
    api.patch(`/hospitals/${id}/gps-reset`).then((r) => r.data.data),
  /** DIRECTOR/ADMIN: o'z muassasasining geofence markazi */
  getMyGps: () =>
    api.get(`/hospitals/me/gps`).then((r) => r.data.data as HospitalGps),
  setMyGps: (data: { lat: number; lng: number; accuracy?: number; radius?: number }) =>
    api.put(`/hospitals/me/gps`, data).then((r) => r.data.data as HospitalGps),
  resetTelegramSubs: (id: string) => api.delete(`/hospitals/${id}/telegram-subs`).then((r) => r.data),
  listAssistants: (id: string) =>
    api.get(`/hospitals/${id}/assistants`).then((r) => r.data.data),
  assignAssistant: (id: string, userId: string) =>
    api.post(`/hospitals/${id}/assistants`, { userId }).then((r) => r.data.data),
  unassignAssistant: (id: string, userId: string) =>
    api.delete(`/hospitals/${id}/assistants/${userId}`).then((r) => r.data),
  // Tenant self-service branding (DIRECTOR/ADMIN — o'z shifoxonasi, hospitalId JWT'dan)
  updateOwnInfo: (name: string) =>
    api.patch(`/hospitals/me`, { name }).then((r) => r.data.data),
  updateOwnLogo: (file: File) => {
    const form = new FormData();
    form.append("logo", file);
    return api.post(`/hospitals/me/logo`, form, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 60_000,
    }).then((r) => r.data.data);
  },
};

// ─── Users (Super Admin panel — /panel/users) ────
export const usersApi = {
  list: (params?: {
    search?: string;
    role?: string;
    status?: string;
    page?: number;
    limit?: number;
    targetHospitalId?: string;
  }) => api.get("/users", { params }).then((r) => r.data),
  updateStatus: (id: string, status: string, params?: { targetHospitalId?: string }) =>
    api.patch(`/users/${id}/status`, { status }, { params }).then((r) => r.data),
  updateRole: (id: string, role: string, params?: { targetHospitalId?: string }) =>
    api.patch(`/users/${id}/role`, { role }, { params }).then((r) => r.data),
  // Granular ruxsatlar (FAZA 5, 7-bosqich)
  getPermissions: (id: string, params?: { targetHospitalId?: string }) =>
    api.get(`/users/${id}/permissions`, { params }).then((r) => r.data),
  setPermission: (
    id: string,
    permission: string,
    granted: boolean | null,
    params?: { targetHospitalId?: string },
  ) =>
    api
      .patch(`/users/${id}/permissions`, { permission, granted }, { params })
      .then((r) => r.data),
};

// ─── Telegram ───────────────────────────────────
// Trial leads (faqat Super Admin paneli)
export const trialLeadsApi = {
  list: (params?: {
    search?: string;
    source?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) => api.get("/trial-leads", { params }).then((r) => r.data),
  stats: () => api.get("/trial-leads/stats").then((r) => r.data.data),
  updateStatus: (id: string, status: string, note?: string) =>
    api.patch(`/trial-leads/${id}/status`, { status, note }).then((r) => r.data.data),
};

export const telegramApi = {
  status: () =>
    api.get("/telegram/status").then((r) => r.data.data as { active: boolean; count: number }),
  subscriptions: () =>
    api.get("/telegram/subscriptions").then((r) => r.data.data as {
      hospitalId: string;
      hospitalName: string;
      address: string | null;
      isConnected: boolean;
      activeCount: number;
      subscriptions: {
        id: string;
        chatId: string;
        username: string | null;
        role: string;
        isActive: boolean;
        createdAt: string;
      }[];
    }[]),

  // HR botga ulanish ruxsati (allowlist). DIRECTOR/ADMIN uchun backend
  // hospitalId'ni JWT'dan oladi; SUPER_ADMIN/ASSISTANT_ADMIN tanlangan
  // muassasani yuboradi.
  botAccess: (hospitalId?: string) =>
    api
      .get("/telegram/bot-access", { params: hospitalId ? { hospitalId } : undefined })
      .then((r) => r.data.data as TelegramBotAccessList),
  setBotAccess: (employeeId: string, enabled: boolean, hospitalId?: string) =>
    api
      .put(`/telegram/bot-access/${employeeId}`, { enabled, ...(hospitalId ? { hospitalId } : {}) })
      .then((r) => r.data.data),
  revokeBotChat: (subscriptionId: string, hospitalId?: string) =>
    api
      .delete(`/telegram/bot-access/subscriptions/${subscriptionId}`, {
        params: hospitalId ? { hospitalId } : undefined,
      })
      .then((r) => r.data.data),
};

export interface TelegramBotAccessList {
  limit: number;
  granted: {
    employeeId: string;
    fullName: string;
    position: string | null;
    phone: string | null;
    hasValidPhone: boolean;
    isFired: boolean;
    linkedChats: { id: string; username: string | null; createdAt: string }[];
  }[];
  legacyChats: { id: string; username: string | null; createdAt: string }[];
}

// ─── Notifications ──────────────────────────────
export const notificationsApi = {
  list: (params?: { unreadOnly?: boolean; limit?: number }) =>
    api.get("/notifications", { params }).then((r) => r.data.data),
  unreadCount: () =>
    api.get("/notifications/unread-count").then((r) => r.data.data as number),
  markRead: (id: string) =>
    api.put(`/notifications/${id}/read`).then((r) => r.data.data),
  markAllRead: () =>
    api.put("/notifications/read-all").then((r) => r.data.data),
  delete: (id: string) =>
    api.delete(`/notifications/${id}`).then((r) => r.data.data),
  sendTelegram: (data: { hospitalIds: string[] | "all"; message: string }) =>
    api.post("/notifications/send-telegram", data).then((r) => r.data.data),
};

// ─── Payments ───────────────────────────────────
export const paymentsApi = {
  overview: () => api.get("/payments/overview").then((r) => r.data.data),
  // Ko'p oylik qarzdorlik hisoboti (FAZA 5, 1-bosqich)
  debtors: (months?: number) =>
    api.get("/payments/debtors", { params: { months } }).then((r) => r.data.data),
  // MRR/ARR va churn ko'rinishi (FAZA 5, 3-bosqich)
  platformStats: (months?: number) =>
    api.get("/payments/platform-stats", { params: { months } }).then((r) => r.data.data),
  list: (params?: { hospitalId?: string; period?: string; limit?: number }) =>
    api.get("/payments", { params }).then((r) => r.data.data),
  create: (data: {
    hospitalId: string;
    payerName: string;
    amount: number;
    type: "MONTHLY" | "ANNUAL" | "OTHER";
    note?: string;
  }) => api.post("/payments", data).then((r) => r.data.data),
  update: (id: string, data: { amount?: number; note?: string }) =>
    api.patch(`/payments/${id}`, data).then((r) => r.data.data),
  // delete intentionally removed — payments cannot be deleted
};

// ─── Audit Logs (SUPER_ADMIN) ────────────────────
export const auditLogsApi = {
  list: (params?: {
    entity?: string;
    action?: string;
    page?: number;
    limit?: number;
  }) => api.get("/audit-logs", { params }).then((r) => r.data.data),

  clearOldLogs: (olderThanDays: number) =>
    api.delete("/audit-logs/clear", { params: { olderThanDays } }).then((r) => r.data.data),
};

// ─── HikConnect (kameralar + live stream) ───────
export const hikconnectApi = {
  status: () =>
    api.get("/hikconnect/status").then((r) => r.data.data as { configured: boolean }),
  cameras: (hospitalId?: string) =>
    api.get("/hikconnect/cameras", { params: hospitalId ? { hospitalId } : {} }).then((r) => r.data.data),
  createCamera: (data: {
    hospitalId: string; name: string;
    streamPath?: string; cameraIndexCode?: string;
    channelNo?: number; deviceSerial?: string;
  }) => api.post("/hikconnect/cameras", data).then((r) => r.data.data),
  updateCamera: (id: string, data: any, hospitalId?: string) =>
    api.put(`/hikconnect/cameras/${id}`, data, {
      params: hospitalId ? { hospitalId } : undefined,
    }).then((r) => r.data.data),
  deleteCamera: (id: string, hospitalId?: string) =>
    api.delete(`/hikconnect/cameras/${id}`, {
      params: hospitalId ? { hospitalId } : undefined,
    }).then((r) => r.data.data),
  liveUrl: (cameraId: string, hospitalId?: string) =>
    api.get(`/hikconnect/cameras/${cameraId}/live`, {
      params: hospitalId ? { hospitalId } : undefined,
    }).then(
      (r) => r.data.data as { url: string; protocol: string; expireTime: number; source: string }
    ),
  fetchFromHikConnect: (pageIndex?: number, pageSize?: number) =>
    api.get("/hikconnect/fetch-cameras", { params: { pageIndex, pageSize } }).then((r) => r.data.data),
};

// ─── Ministry (MINISTRY + SUPER_ADMIN) ──────────
export const ministryApi = {
  overview: (params?: { date?: string }) =>
    api.get("/ministry/overview", { params }).then((r) => r.data.data),
  hospitalDetail: (hospitalId: string, params?: { date?: string }) =>
    api.get(`/ministry/hospitals/${hospitalId}/detail`, { params }).then((r) => r.data.data),
  absentToday: (params?: { hospitalId?: string; date?: string }) =>
    api.get("/ministry/attendance/absent", { params }).then((r) => r.data.data),
  payrollSummary: (params?: { month?: number; year?: number }) =>
    api.get("/ministry/payroll/summary", { params }).then((r) => r.data.data),
};

// ─── Leave Requests (Ta'til so'rovlari) ─────────
export const leaveApi = {
  /** EMPLOYEE: yangi so'rov yaratish */
  create: (data: { type: string; startDate: string; endDate: string; reason?: string }) =>
    api.post("/leave", data).then((r) => r.data.data ?? r.data),

  /** EMPLOYEE: o'z so'rovlari */
  my: (params?: { status?: string; page?: number; limit?: number }) =>
    api.get("/leave/my", { params }).then((r) => r.data.data ?? r.data),

  /** EMPLOYEE: PENDING so'rovni bekor qilish */
  cancel: (id: string) =>
    api.patch(`/leave/${id}/cancel`).then((r) => r.data.data ?? r.data),

  /** DIRECTOR/ADMIN: barcha so'rovlar */
  list: (params?: { status?: string; page?: number; limit?: number; targetHospitalId?: string }) =>
    api.get("/leave", { params }).then((r) => r.data.data ?? r.data),

  /** DIRECTOR/ADMIN: tasdiqlash yoki rad etish */
  review: (id: string, data: { decision: "APPROVED" | "REJECTED"; reviewNote?: string }) =>
    api.patch(`/leave/${id}/review`, data).then((r) => r.data.data ?? r.data),

  /** DIRECTOR/ADMIN: tasdiqlangan ta'tilni qaytarish */
  revoke: (id: string) =>
    api.patch(`/leave/${id}/revoke`).then((r) => r.data.data ?? r.data),
};

// ─── Push Notifications ─────────────────────────
export const pushApi = {
  vapidKey: () =>
    api.get("/push/vapid-key").then((r) => r.data.data ?? r.data),
  subscribe: (data: { endpoint: string; keys: { p256dh: string; auth: string }; userAgent?: string }) =>
    api.post("/push/subscribe", data).then((r) => r.data),
  unsubscribe: (endpoint: string) =>
    api.delete("/push/unsubscribe", { data: { endpoint } }).then((r) => r.data),
  test: (data?: { title?: string; body?: string }) =>
    api.post("/push/test", data ?? {}).then((r) => r.data),
};

// ─── Helper: download blob ───────────────────────
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Ochiq (public, auth talab qilinmaydigan) so'rovlar ───
// Alohida instance — asosiy `api`dagi 401 interceptor (login'ga
// yo'naltirish) anonim marketing tashrifchilariga tegmasligi uchun.
export const publicApi = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

export interface TrialRequestPayload {
  hospitalName: string;
  orgType?: string;
  directorName: string;
  phone: string;
  region?: string;
  staffCount?: number;
  plan?: string;
  billingCycle?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  pageUrl?: string;
}

export const leadsApi = {
  trialRequest: (data: TrialRequestPayload) =>
    publicApi.post("/public/trial-request", data).then((r) => r.data),
};

export interface WorkSite {
  id: string;
  hospitalId: string;
  name: string;
  address: string | null;
  gpsLat: number;
  gpsLng: number;
  gpsRadius: number;
  isActive: boolean;
  employeeCount: number;
}

export interface LegacyCenter {
  employeeId: string;
  fullName: string;
  position: string | null;
  department: string | null;
  gpsLat: number;
  gpsLng: number;
  gpsRadius: number;
  distanceFromMain: number | null;
}

type WorkSiteInput = {
  name: string;
  address?: string;
  lat: number;
  lng: number;
  radius?: number;
  accuracy?: number;
};

/** Ish joylari (FAZA 6, 4b). SUPER/ASSISTANT admin `targetHospitalId` yuboradi. */
export const workSitesApi = {
  list: (targetHospitalId?: string) =>
    api.get("/work-sites", { params: { targetHospitalId } }).then((r) => r.data.data as WorkSite[]),
  create: (data: WorkSiteInput, targetHospitalId?: string) =>
    api.post("/work-sites", data, { params: { targetHospitalId } }).then((r) => r.data.data as WorkSite),
  update: (id: string, data: Partial<WorkSiteInput> & { isActive?: boolean }, targetHospitalId?: string) =>
    api.patch(`/work-sites/${id}`, data, { params: { targetHospitalId } }).then((r) => r.data.data as WorkSite),
  remove: (id: string, targetHospitalId?: string) =>
    api.delete(`/work-sites/${id}`, { params: { targetHospitalId } }).then((r) => r.data.data),
  employees: (id: string, targetHospitalId?: string) =>
    api
      .get(`/work-sites/${id}/employees`, { params: { targetHospitalId } })
      .then((r) => r.data.data as { id: string; fullName: string; position: string | null }[]),
  setEmployees: (id: string, employeeIds: string[], targetHospitalId?: string) =>
    api.put(`/work-sites/${id}/employees`, { employeeIds }, { params: { targetHospitalId } }).then((r) => r.data.data),
  legacyCenters: (targetHospitalId?: string) =>
    api.get("/work-sites/legacy-centers", { params: { targetHospitalId } }).then((r) => r.data.data as LegacyCenter[]),
  approveLegacy: (employeeId: string, data: { name: string; radius?: number }, targetHospitalId?: string) =>
    api
      .post(`/work-sites/legacy-centers/${employeeId}/approve`, data, { params: { targetHospitalId } })
      .then((r) => r.data.data as WorkSite),
  rejectLegacy: (employeeId: string, targetHospitalId?: string) =>
    api.post(`/work-sites/legacy-centers/${employeeId}/reject`, {}, { params: { targetHospitalId } }).then((r) => r.data.data),
};

export interface HospitalGps {
  gpsLat: number | null;
  gpsLng: number | null;
  gpsRadius: number;
  /** Shaxsiy markazi bor faol xodimlar soni (ular muassasa markazidan ustun) */
  personalCenters: number;
}
