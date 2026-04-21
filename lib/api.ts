import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api/v1";

// Backend server URL (static files: photos)
export const BACKEND_ORIGIN = BASE_URL.replace(/\/api\/v1\/?$/, "");

// Helper: convert relative photo path (/uploads/...) to full URL
export function photoUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("http")) return url;
  return `${BACKEND_ORIGIN}${url}`;
}

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor — JWT token qo'shish
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — 401 → login
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");
      localStorage.removeItem("auth-storage");
      document.cookie = "auth_token=; path=/; max-age=0";
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// ─── Auth ───────────────────────────────────────
export const authApi = {
  login: (data: { username: string; password: string }) =>
    api.post("/auth/login", data).then((r) => r.data.data),
  profile: () => api.get("/auth/profile").then((r) => r.data.data),
  register: (data: { username: string; password: string; role?: string }) =>
    api.post("/auth/register", data).then((r) => r.data.data),
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
  fire: (id: string, params?: { targetHospitalId?: string }) =>
    api.put(`/employees/${id}/fire`, {}, { params }).then((r) => r.data.data),
  delete: (id: string, params?: { targetHospitalId?: string }) =>
    api.delete(`/employees/${id}`, { params }).then((r) => r.data.data),
  uploadPhoto: (id: string, file: File, params?: { targetHospitalId?: string }) => {
    const form = new FormData();
    form.append("photo", file);
    return api.post(`/employees/${id}/photo`, form, {
      headers: { "Content-Type": "multipart/form-data" },
      params,
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
};

// ─── Schedules ──────────────────────────────────
export const schedulesApi = {
  daily: (params?: { date?: string; targetHospitalId?: string }) =>
    api.get("/schedules/daily", { params }).then((r) => r.data.data),
  monthly: (params?: { month?: number; year?: number; targetHospitalId?: string }) =>
    api.get("/schedules/monthly", { params }).then((r) => r.data.data),
  employee: (id: string, params?: { month?: number; year?: number }) =>
    api.get(`/schedules/employee/${id}`, { params }).then((r) => r.data.data),
  generate: (data: any) => api.post("/schedules/generate", data).then((r) => r.data.data),
  bulkGenerate: (data: any) => api.post("/schedules/bulk-generate", data).then((r) => r.data.data),
  update: (id: string, data: any) => api.put(`/schedules/${id}`, data).then((r) => r.data.data),
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
};

// ─── Reports ────────────────────────────────────
export const reportsApi = {
  attendanceExcel: (params: { month: number; year: number; departmentId?: string; targetHospitalId?: string }) =>
    api.get("/reports/attendance/excel", { params, responseType: "blob" }),
  payrollExcel: (params: { month: number; year: number; departmentId?: string; targetHospitalId?: string }) =>
    api.get("/reports/payroll/excel", { params, responseType: "blob" }),
  weeklyExcel: (params: { weekStart: string; departmentId?: string; targetHospitalId?: string }) =>
    api.get("/reports/attendance/weekly", { params, responseType: "blob" }),
};

// ─── Hospitals (SUPER_ADMIN) ─────────────────────
export const hospitalsApi = {
  list: () => api.get("/hospitals").then((r) => r.data.data),
  get: (id: string) => api.get(`/hospitals/${id}`).then((r) => r.data.data),
  create: (data: any) => api.post("/hospitals", data).then((r) => r.data.data),
  update: (id: string, data: any) => api.put(`/hospitals/${id}`, data).then((r) => r.data.data),
  delete: (id: string) => api.delete(`/hospitals/${id}`).then((r) => r.data.data),
  createDirector: (hospitalId: string, data: any) =>
    api.post(`/hospitals/${hospitalId}/directors`, data).then((r) => r.data.data),
  updateDirector: (hospitalId: string, data: any) =>
    api.patch(`/hospitals/${hospitalId}/directors`, data).then((r) => r.data.data),
  block: (id: string) => api.patch(`/hospitals/${id}/block`).then((r) => r.data.data),
  unblock: (id: string) => api.patch(`/hospitals/${id}/unblock`).then((r) => r.data.data),
};

// ─── Telegram ───────────────────────────────────
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
};

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
  updateCamera: (id: string, data: any) =>
    api.put(`/hikconnect/cameras/${id}`, data).then((r) => r.data.data),
  deleteCamera: (id: string) =>
    api.delete(`/hikconnect/cameras/${id}`).then((r) => r.data.data),
  liveUrl: (cameraId: string) =>
    api.get(`/hikconnect/cameras/${cameraId}/live`).then(
      (r) => r.data.data as { url: string; protocol: string; expireTime: number; source: string }
    ),
  fetchFromHikConnect: (pageNo?: number, pageSize?: number) =>
    api.get("/hikconnect/fetch-cameras", { params: { pageNo, pageSize } }).then((r) => r.data.data),
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

// ─── Helper: download blob ───────────────────────
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
