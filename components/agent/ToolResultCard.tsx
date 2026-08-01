"use client";
import { photoUrl as buildPhotoUrl } from "@/lib/api";
import { getInitials, getAvatarColor, formatMoney, cn } from "@/lib/utils";

interface ToolResult {
  toolName: string;
  result: any;
}

// ── Helpers ──────────────────────────────────────
function Avatar({ name, photoUrl, size = "sm" }: { name: string; photoUrl?: string; size?: "sm" | "md" }) {
  const sz = size === "sm" ? "w-7 h-7 text-[10px]" : "w-9 h-9 text-xs";
  if (photoUrl) {
    return <img src={buildPhotoUrl(photoUrl)} alt={name} className={`${sz} rounded-full object-cover flex-shrink-0`} />;
  }
  return (
    <div className={cn(sz, "rounded-full flex items-center justify-center font-bold text-white flex-shrink-0", getAvatarColor(name))}>
      {getInitials(name)}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    PRESENT:     "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    LATE:        "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    ABSENT:      "bg-red-500/20 text-red-400 border-red-500/30",
    EARLY_LEAVE: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    LATE_EARLY:  "bg-orange-500/20 text-orange-400 border-orange-500/30",
    WORKING:     "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    DAY_OFF:     "bg-slate-500/20 text-slate-400 border-slate-500/30",
    VACATION:    "bg-purple-500/20 text-purple-400 border-purple-500/30",
    SICK:        "bg-pink-500/20 text-pink-400 border-pink-500/30",
  };
  const labels: Record<string, string> = {
    PRESENT: "Keldi", LATE: "Kechikdi", ABSENT: "Kelmadi",
    EARLY_LEAVE: "Erta ketdi", LATE_EARLY: "Kech+Erta",
    WORKING: "Ish kuni", DAY_OFF: "Dam olish",
    VACATION: "Ta'til", SICK: "Kasallik",
  };
  return (
    <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border", map[status] ?? "bg-slate-500/20 text-slate-400 border-slate-500/30")}>
      {labels[status] ?? status}
    </span>
  );
}

function CardWrapper({ icon, label, color, children }: { icon: string; label: string; color: string; children: React.ReactNode }) {
  return (
    <div className={cn("rounded-xl border mt-2 overflow-hidden", color)}>
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5">
        <span>{icon}</span>
        <span className="text-[10px] font-semibold uppercase tracking-wider opacity-70">{label}</span>
        <span className="ml-auto text-[10px] opacity-40">Tool natijasi</span>
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}

// ── Tool renderers ────────────────────────────────

function EmployeesCard({ result }: { result: any }) {
  const list = Array.isArray(result) ? result : result?.data ?? [];
  const total = result?.meta?.total ?? list.length;
  return (
    <CardWrapper icon="👥" label="Xodimlar ro'yxati" color="border-blue-500/20 bg-blue-500/5">
      <p className="text-[11px] text-slate-400 mb-2">Jami: <span className="text-blue-400 font-semibold">{total} nafar</span></p>
      <div className="space-y-2 max-h-56 overflow-y-auto">
        {list.slice(0, 8).map((e: any) => (
          <div key={e.id} className="flex items-center gap-2.5 p-2 rounded-lg bg-white/5">
            <Avatar name={e.fullName} photoUrl={e.photoUrl} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-100 truncate">{e.fullName}</p>
              <p className="text-[10px] text-slate-400 truncate">{e.department?.name} · {e.position?.name}</p>
            </div>
            <span className="text-[10px] text-emerald-400 font-mono flex-shrink-0">{formatMoney(e.baseSalary)}</span>
          </div>
        ))}
        {list.length > 8 && <p className="text-[10px] text-slate-500 text-center pt-1">... va yana {list.length - 8} ta</p>}
      </div>
    </CardWrapper>
  );
}

function AttendanceCard({ result }: { result: any }) {
  const list = Array.isArray(result) ? result : result?.records ?? result?.data ?? [];
  const present = list.filter((r: any) => r.status === "PRESENT").length;
  const late    = list.filter((r: any) => r.status === "LATE").length;
  const absent  = list.filter((r: any) => r.status === "ABSENT").length;

  return (
    <CardWrapper icon="📋" label="Davomat" color="border-teal-500/20 bg-teal-500/5">
      <div className="grid grid-cols-3 gap-2 mb-3">
        {[
          { label: "Keldi",    value: present, color: "text-emerald-400" },
          { label: "Kechikdi", value: late,    color: "text-yellow-400"  },
          { label: "Kelmadi",  value: absent,  color: "text-red-400"     },
        ].map(s => (
          <div key={s.label} className="bg-white/5 rounded-lg p-2 text-center">
            <p className={cn("text-lg font-bold", s.color)}>{s.value}</p>
            <p className="text-[10px] text-slate-400">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="space-y-1.5 max-h-48 overflow-y-auto">
        {list.slice(0, 6).map((r: any, i: number) => (
          <div key={i} className="flex items-center gap-2 p-1.5 rounded-lg bg-white/5">
            <Avatar name={r.employeeName ?? r.employee?.fullName ?? "?"} photoUrl={r.photoUrl ?? r.employee?.photoUrl} size="sm" />
            <span className="flex-1 text-[11px] text-slate-200 truncate">{r.employeeName ?? r.employee?.fullName}</span>
            <StatusBadge status={r.status} />
          </div>
        ))}
        {list.length > 6 && <p className="text-[10px] text-slate-500 text-center pt-1">... va yana {list.length - 6} ta</p>}
      </div>
    </CardWrapper>
  );
}

function PayrollCard({ result }: { result: any }) {
  const list = Array.isArray(result) ? result : result?.data ?? [];
  const totalNet = list.reduce((s: number, p: any) => s + Number(p.netSalary ?? 0), 0);

  return (
    <CardWrapper icon="💰" label="Maosh hisobi" color="border-amber-500/20 bg-amber-500/5">
      {totalNet > 0 && (
        <div className="mb-3 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <p className="text-[10px] text-amber-300 mb-0.5">Jami to'lash kerak</p>
          <p className="text-lg font-bold text-amber-400">{formatMoney(totalNet)}</p>
        </div>
      )}
      <div className="space-y-1.5 max-h-48 overflow-y-auto">
        {list.slice(0, 6).map((p: any, i: number) => (
          <div key={i} className="flex items-center gap-2 p-1.5 rounded-lg bg-white/5">
            <Avatar name={p.employee?.fullName ?? p.employeeName ?? "?"} photoUrl={p.employee?.photoUrl} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-slate-200 truncate">{p.employee?.fullName ?? p.employeeName}</p>
              {Number(p.lateDeduction ?? 0) > 0 && (
                <p className="text-[10px] text-red-400">−{formatMoney(p.lateDeduction)} kesim</p>
              )}
            </div>
            <span className="text-[11px] font-semibold text-emerald-400 flex-shrink-0">{formatMoney(p.netSalary)}</span>
          </div>
        ))}
        {list.length > 6 && <p className="text-[10px] text-slate-500 text-center pt-1">... va yana {list.length - 6} ta</p>}
      </div>
    </CardWrapper>
  );
}

function ScheduleCard({ result }: { result: any }) {
  const list = Array.isArray(result)
    ? result
    : result?.schedules ?? result?.data ?? [];

  return (
    <CardWrapper icon="📅" label="Jadval" color="border-purple-500/20 bg-purple-500/5">
      {/* Xodim ismi */}
      {result?.employeeName && (
        <div className="flex items-center gap-2 mb-2 p-2 rounded-lg bg-white/5">
          <span className="text-sm">👤</span>
          <div>
            <p className="text-[11px] font-semibold text-slate-100">{result.employeeName}</p>
            <p className="text-[10px] text-slate-400">{result.department} · {result.position}</p>
          </div>
        </div>
      )}
      <p className="text-[11px] text-slate-400 mb-2">
        Jami: <span className="text-purple-400 font-semibold">{list.length} kun</span>
      </p>
      <div className="space-y-1.5 max-h-48 overflow-y-auto">
        {list.slice(0, 10).map((s: any, i: number) => (
          <div key={i} className="flex items-center gap-2 p-1.5 rounded-lg bg-white/5">
            <span className="text-sm">
              {s.status === "WORKING"  ? "✅" :
               s.status === "DAY_OFF" ? "🔴" :
               s.status === "VACATION"? "🏖" : "📋"}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-slate-200">
                {s.date ? new Date(s.date).toLocaleDateString("uz-UZ", { day: "2-digit", month: "2-digit" }) : "—"}
                {s.shift?.name ? ` · ${s.shift.name}` : ""}
              </p>
              {s.shift?.startTime && (
                <p className="text-[10px] text-slate-400">{s.shift.startTime} – {s.shift.endTime}</p>
              )}
            </div>
            <StatusBadge status={s.status} />
          </div>
        ))}
        {list.length > 10 && (
          <p className="text-[10px] text-slate-500 text-center pt-1">... va yana {list.length - 10} kun</p>
        )}
      </div>
    </CardWrapper>
  );
}

function DashboardCard({ result }: { result: any }) {
  return (
    <CardWrapper icon="📊" label="Dashboard" color="border-indigo-500/20 bg-indigo-500/5">
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: "Jami xodimlar",  value: result?.totalEmployees,  color: "text-blue-400"    },
          { label: "Bugun keldi",    value: result?.todayPresent,     color: "text-emerald-400" },
          { label: "Kelmadi",        value: result?.todayAbsent,      color: "text-red-400"     },
          { label: "Kechikdi",       value: result?.todayLate,        color: "text-yellow-400"  },
        ].map(s => (
          <div key={s.label} className="bg-white/5 rounded-lg p-2.5">
            <p className={cn("text-xl font-bold", s.color)}>{s.value ?? "—"}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>
      {result?.monthlyPayrollTotal && (
        <div className="mt-2 p-2 rounded-lg bg-white/5 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">Bu oy maosh fondi</span>
          <span className="text-sm font-bold text-amber-400">{formatMoney(result.monthlyPayrollTotal)}</span>
        </div>
      )}
    </CardWrapper>
  );
}

function ShiftsCard({ result }: { result: any }) {
  const list = Array.isArray(result) ? result : result?.data ?? [];
  return (
    <CardWrapper icon="⏰" label="Smenalar" color="border-cyan-500/20 bg-cyan-500/5">
      <div className="space-y-1.5 max-h-48 overflow-y-auto">
        {list.map((s: any, i: number) => (
          <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-white/5">
            <div>
              <p className="text-[11px] font-medium text-slate-200">{s.name}</p>
              <p className="text-[10px] text-slate-400">{s.type}</p>
            </div>
            <span className="text-[11px] font-mono text-cyan-400">{s.startTime} – {s.endTime}</span>
          </div>
        ))}
      </div>
    </CardWrapper>
  );
}

function LeaveCard({ result }: { result: any }) {
  const list = Array.isArray(result) ? result : result?.records ?? result?.data ?? [];
  return (
    <CardWrapper icon="🏖" label="Ta'til so'rovlari" color="border-emerald-500/20 bg-emerald-500/5">
      <div className="space-y-1.5 max-h-48 overflow-y-auto">
        {list.slice(0, 5).map((l: any, i: number) => (
          <div key={i} className="flex items-center gap-2 p-1.5 rounded-lg bg-white/5">
            <Avatar name={l.employee?.fullName ?? "?"} photoUrl={l.employee?.photoUrl} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-slate-200 truncate">{l.employee?.fullName}</p>
              <p className="text-[10px] text-slate-400">{l.startDate?.slice(0,10)} – {l.endDate?.slice(0,10)}</p>
            </div>
            <span className={cn(
              "text-[10px] font-semibold px-2 py-0.5 rounded-full border",
              l.status === "APPROVED"  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" :
              l.status === "PENDING"   ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"   :
              l.status === "REJECTED"  ? "bg-red-500/20 text-red-400 border-red-500/30"            :
              "bg-slate-500/20 text-slate-400 border-slate-500/30"
            )}>
              {l.status === "APPROVED" ? "Tasdiqlandi" : l.status === "PENDING" ? "Kutilmoqda" : l.status === "REJECTED" ? "Rad etildi" : l.status}
            </span>
          </div>
        ))}
      </div>
    </CardWrapper>
  );
}

// ── Main export ───────────────────────────────────
export default function ToolResultCard({ toolName, result }: ToolResult) {
  // create_shift — alohida "yaratildi" karta
  if (toolName === "create_shift") {
    return (
      <CardWrapper icon="✅" label="Shift yaratildi" color="border-green-500/20 bg-green-500/5">
        <div className="space-y-1 text-xs">
          <p className="text-slate-200 font-medium">{result?.name}</p>
          <p className="text-slate-400">{result?.type} · {result?.startTime} – {result?.endTime}</p>
          {result?.durationH && <p className="text-slate-400">Davomiylik: {result.durationH} soat</p>}
        </div>
      </CardWrapper>
    );
  }

  // get_shifts — smenalar ro'yxati
  if (toolName === "get_shifts") {
    return <ShiftsCard result={result} />;
  }

  // Xodimlar
  if (toolName === "get_employees" || toolName === "get_employee") {
    return <EmployeesCard result={result} />;
  }

  // Davomat
  if (toolName === "get_attendance_daily" || toolName === "get_attendance_employee") {
    return <AttendanceCard result={result} />;
  }

  // Maosh
  if (toolName === "get_payroll_list" || toolName === "get_payroll_employee" || toolName === "preview_payroll") {
    return <PayrollCard result={result} />;
  }

  // Jadval
  if (toolName === "get_schedule_monthly" || toolName === "get_schedule_employee") {
    return <ScheduleCard result={result} />;
  }

  // Jadval yaratish
  if (toolName === "create_schedule_employee" || toolName === "create_schedule_bulk") {
    return (
      <CardWrapper icon="✅" label="Jadval yaratildi" color="border-green-500/20 bg-green-500/5">
        <div className="space-y-1 text-xs">
          {result?.summary ? (
            <>
              <p className="text-slate-200">Jami: <span className="text-green-400 font-semibold">{result.summary.total}</span> xodim</p>
              <p className="text-slate-400">Muvaffaqiyatli: <span className="text-green-400">{result.summary.success}</span> · Xato: <span className="text-red-400">{result.summary.failed}</span></p>
            </>
          ) : (
            <p className="text-slate-200">Yaratildi: <span className="text-green-400 font-semibold">{result?.created}</span> kun</p>
          )}
        </div>
      </CardWrapper>
    );
  }

  // Dashboard
  if (toolName === "get_dashboard_overview" || toolName === "get_dashboard_analytics") {
    return <DashboardCard result={result} />;
  }

  // Ta'til
  if (toolName === "get_leave_requests" || toolName === "get_employees_on_leave") {
    return <LeaveCard result={result} />;
  }

  // Bo'limlar
  if (toolName === "get_departments") {
    return (
      <CardWrapper icon="🏢" label="Bo'limlar" color="border-slate-500/20 bg-slate-500/5">
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {(Array.isArray(result) ? result : result?.data ?? []).map((d: any, i: number) => (
            <div key={i} className="flex items-center justify-between p-1.5 rounded-lg bg-white/5">
              <span className="text-[11px] text-slate-200">{d.name}</span>
              <span className="text-[10px] text-slate-400 font-mono">{d.code}</span>
            </div>
          ))}
        </div>
      </CardWrapper>
    );
  }

  // Fallback
  return (
    <div className="rounded-xl border border-slate-500/20 bg-slate-500/5 mt-2 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5">
        <span>🔧</span>
        <span className="text-[10px] font-semibold uppercase tracking-wider opacity-70">{toolName}</span>
        <span className="ml-auto text-[10px] opacity-40">Tool natijasi</span>
      </div>
      <pre className="p-3 overflow-auto max-h-48 text-slate-300 text-[11px] leading-relaxed whitespace-pre-wrap">
        {JSON.stringify(result, null, 2)}
      </pre>
    </div>
  );
}