"use client";
import { useQuery } from "@tanstack/react-query";
import { employeesApi, payrollApi, photoUrl as buildPhotoUrl } from "@/lib/api";
import { getInitials, getAvatarColor, formatMoney, cn } from "@/lib/utils";
import {
  X, Archive, Phone, Hash, Building2, Calendar, Clock,
  DollarSign, TrendingUp, AlertTriangle, CheckCircle2,
  XCircle, UserX,
} from "lucide-react";
import dayjs from "dayjs";

const FIRE_REASON_LABELS: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  RESIGNED:    { label: "O'z xohishi bilan ketdi", color: "text-blue-400",   bg: "bg-blue-500/10",   icon: "🚶" },
  FIRED:       { label: "Ishdan bo'shatildi",       color: "text-red-400",    bg: "bg-red-500/10",    icon: "❌" },
  RETIRED:     { label: "Pensiyaga chiqdi",         color: "text-purple-400", bg: "bg-purple-500/10", icon: "🎖" },
  TRANSFERRED: { label: "Boshqa joyga o'tdi",       color: "text-amber-400",  bg: "bg-amber-500/10",  icon: "🔄" },
  OTHER:       { label: "Boshqa sabab",             color: "text-gray-400",   bg: "bg-gray-500/10",   icon: "📋" },
};

function calcDuration(hiredAt: string, firedAt: string): string {
  const start   = dayjs(hiredAt);
  const end     = dayjs(firedAt);
  const months  = end.diff(start, "month");
  const years   = Math.floor(months / 12);
  const rem     = months % 12;
  if (years > 0 && rem > 0) return `${years} yil ${rem} oy`;
  if (years > 0) return `${years} yil`;
  if (months > 0) return `${months} oy`;
  return `${end.diff(start, "day")} kun`;
}

const UZ_MONTHS = ["","Yanvar","Fevral","Mart","Aprel","May","Iyun","Iyul","Avgust","Sentyabr","Oktyabr","Noyabr","Dekabr"];

interface ArchivedBioModalProps {
  empId:   string;
  onClose: () => void;
}

export function ArchivedBioModal({ empId, onClose }: ArchivedBioModalProps) {
  const { data: emp, isLoading } = useQuery({
    queryKey: ["archived-employee", empId],
    queryFn:  () => employeesApi.getArchived(empId),
    enabled:  !!empId,
  });

  const { data: payrollHistory = [] } = useQuery({
    queryKey: ["archived-payroll-history", empId],
    queryFn: async () => {
      const months = Array.from({ length: 6 }, (_, i) => {
        const d = dayjs().subtract(i, "month");
        return { month: d.month() + 1, year: d.year() };
      });
      const results = await Promise.all(
        months.map(({ month, year }) =>
          payrollApi.employee(empId, { month, year }).catch(() => null)
        )
      );
      return results
        .map((r, i) => r ? { ...r, month: months[i].month, year: months[i].year } : null)
        .filter(Boolean);
    },
    enabled: !!empId,
  });

  // ── Loading ──
  if (isLoading) return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card w-full max-w-2xl mx-4 p-8 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );

  if (!emp) return null;

  const reason      = FIRE_REASON_LABELS[emp.fireReason] ?? FIRE_REASON_LABELS.OTHER;
  const duration    = calcDuration(emp.hiredAt, emp.firedAt);
  const att         = emp.attendanceStats ?? {};
  const totalAtt    = (att.present ?? 0) + (att.late ?? 0) + (att.absent ?? 0) + (att.earlyLeave ?? 0);
  const attendancePct = totalAtt > 0
    ? Math.round(((att.present ?? 0) + (att.late ?? 0)) / totalAtt * 100)
    : 0;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card w-full sm:max-w-2xl max-h-[95vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl">

        {/* Header */}
        <div className="sticky top-0 bg-[var(--bg-card)] z-10 px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Archive className="w-4 h-4 text-[var(--text-muted)]" />
            <span className="text-sm font-semibold text-[var(--text-primary)]">Arxiv — xodim bio</span>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">

          {/* Bio card */}
          <div className="flex items-start gap-4 p-4 rounded-2xl bg-[var(--bg-hover)]">
            {emp.photoUrl ? (
              <img
                src={buildPhotoUrl(emp.photoUrl)}
                alt={emp.fullName}
                className="w-20 h-20 rounded-2xl object-cover flex-shrink-0 ring-2 ring-[var(--border)]"
              />
            ) : (
              <div className={cn(
                "w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold text-white flex-shrink-0",
                getAvatarColor(emp.fullName)
              )}>
                {getInitials(emp.fullName)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-[var(--text-primary)] leading-tight">{emp.fullName}</h2>
              <p className="text-sm text-[var(--text-muted)] mt-0.5">
                {emp.position?.name} · {emp.department?.name}
              </p>
              {emp.birthDate && (
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  🎂 {dayjs(emp.birthDate).format("DD.MM.YYYY")}
                </p>
              )}
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2">
                {emp.phone && (
                  <span className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                    <Phone className="w-3.5 h-3.5 text-indigo-400" /> {emp.phone}
                  </span>
                )}
                {emp.employeeNo && (
                  <span className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] font-mono">
                    <Hash className="w-3.5 h-3.5 text-violet-400" /> {emp.employeeNo}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Kasalxona */}
          <div className="p-4 rounded-xl border border-[var(--border)] space-y-2">
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" /> Oldingi ish joyi
            </p>
            <p className="font-semibold text-[var(--text-primary)]">{emp.hospital?.name}</p>
            {emp.hospital?.address && (
              <p className="text-xs text-[var(--text-muted)]">📍 {emp.hospital.address}</p>
            )}
            {emp.hospital?.phone && (
              <p className="text-xs text-[var(--text-muted)]">📞 {emp.hospital.phone}</p>
            )}
          </div>

          {/* Ishlash muddati */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-[var(--bg-hover)] space-y-1">
              <p className="text-xs text-[var(--text-muted)] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Ishga kirgan
              </p>
              <p className="font-semibold text-[var(--text-primary)]">
                {dayjs(emp.hiredAt).format("DD.MM.YYYY")}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-[var(--bg-hover)] space-y-1">
              <p className="text-xs text-[var(--text-muted)] flex items-center gap-1.5">
                <UserX className="w-3.5 h-3.5" /> Ketgan sana
              </p>
              <p className="font-semibold text-[var(--text-primary)]">
                {dayjs(emp.firedAt).format("DD.MM.YYYY")}
              </p>
            </div>
            <div className="col-span-2 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between">
              <span className="text-sm text-[var(--text-muted)]">Jami ishlagan muddat</span>
              <span className="font-bold text-indigo-400 text-lg">{duration}</span>
            </div>
          </div>

          {/* Ketish sababi */}
          <div className={cn("p-4 rounded-xl border flex items-start gap-3", reason.bg, "border-current/20")}>
            <span className="text-xl flex-shrink-0">{reason.icon}</span>
            <div>
              <p className={cn("font-semibold text-sm", reason.color)}>{reason.label}</p>
              {emp.fireNote && (
                <p className="text-xs text-[var(--text-muted)] mt-1">{emp.fireNote}</p>
              )}
            </div>
          </div>

          {/* Oxirgi maosh */}
          <div className="p-4 rounded-xl bg-[var(--bg-hover)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-[var(--text-muted)]">Oxirgi asosiy maosh</span>
            </div>
            <span className="font-bold text-emerald-400 text-lg">{formatMoney(emp.baseSalary)}</span>
          </div>

          {/* Davomat statistikasi */}
          <div>
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" /> Davomat statistikasi (jami)
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Keldi",      value: att.present    ?? 0, icon: <CheckCircle2 className="w-4 h-4" />, color: "text-emerald-400", bg: "bg-emerald-500/10" },
                { label: "Kech keldi", value: att.late       ?? 0, icon: <Clock className="w-4 h-4" />,        color: "text-yellow-400",  bg: "bg-yellow-500/10"  },
                { label: "Kelmadi",    value: att.absent     ?? 0, icon: <XCircle className="w-4 h-4" />,      color: "text-red-400",     bg: "bg-red-500/10"     },
                { label: "Erta ketdi", value: att.earlyLeave ?? 0, icon: <AlertTriangle className="w-4 h-4" />,color: "text-orange-400",  bg: "bg-orange-500/10"  },
              ].map((s) => (
                <div key={s.label} className={cn("p-3 rounded-xl text-center", s.bg)}>
                  <div className={cn("flex justify-center mb-1", s.color)}>{s.icon}</div>
                  <p className={cn("text-xl font-bold", s.color)}>{s.value}</p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
            {totalAtt > 0 && (
              <div className="mt-3">
                <div className="flex justify-between text-xs text-[var(--text-muted)] mb-1">
                  <span>Davomat foizi</span>
                  <span className="font-semibold text-[var(--text-primary)]">{attendancePct}%</span>
                </div>
                <div className="h-2 bg-[var(--bg-hover)] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-700"
                    style={{ width: `${attendancePct}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Maosh tarixi */}
          {(payrollHistory as any[]).length > 0 && (
            <div>
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5" /> Maosh tarixi (so'nggi 6 oy)
              </p>
              <div className="card overflow-hidden">
                {(payrollHistory as any[]).map((h: any, i: number) => {
                  const totalDed = Number(h.lateDeduction ?? 0) + Number(h.absenceDeduction ?? 0) + Number(h.earlyLeaveDeduction ?? 0);
                  return (
                    <div key={i} className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] last:border-0">
                      <div>
                        <p className="text-sm font-medium text-[var(--text-primary)]">
                          {UZ_MONTHS[h.month]} {h.year}
                        </p>
                        {totalDed > 0 && (
                          <p className="text-xs text-red-400 mt-0.5">−{formatMoney(totalDed)} kesim</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-emerald-400">{formatMoney(h.netSalary)}</p>
                        {h.status === "APPROVED" && (
                          <p className="text-[10px] text-emerald-400/60">Tasdiqlangan</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Ta'til tarixi */}
          {(emp.leaveRequests ?? []).length > 0 && (
            <div>
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Ta'til tarixi
              </p>
              <div className="card overflow-hidden">
                {(emp.leaveRequests as any[]).slice(0, 5).map((l: any) => (
                  <div key={l.id} className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] last:border-0">
                    <div>
                      <p className="text-sm text-[var(--text-primary)]">{l.type}</p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {dayjs(l.startDate).format("DD.MM.YYYY")} – {dayjs(l.endDate).format("DD.MM.YYYY")}
                      </p>
                    </div>
                    <span className={cn(
                      "text-xs font-medium px-2 py-0.5 rounded-full",
                      l.status === "APPROVED"  ? "bg-emerald-500/15 text-emerald-400" :
                      l.status === "COMPLETED" ? "bg-indigo-500/15 text-indigo-400"   :
                      l.status === "REJECTED"  ? "bg-red-500/15 text-red-400"         :
                      "bg-gray-500/15 text-gray-400"
                    )}>
                      {l.daysCount} kun
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}