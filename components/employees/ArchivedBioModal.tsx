"use client";

import { useQuery } from "@tanstack/react-query";
import { employeesApi, payrollApi, photoUrl as buildPhotoUrl } from "@/lib/api";
import { getInitials, getAvatarColor, formatMoney, cn } from "@/lib/utils";
import {
  X, Archive, Phone, Hash, Building2, Calendar, Clock,
  DollarSign, TrendingUp, AlertTriangle, CheckCircle2,
  XCircle, UserX, MapPin
} from "lucide-react";
import dayjs from "dayjs";

const FIRE_REASON_LABELS: Record<string, { label: string; color: string; bg: string; border: string; icon: string }> = {
  RESIGNED:    { label: "O'z xohishi bilan ketgan", color: "text-sky-700 dark:text-sky-400",    bg: "bg-sky-50 dark:bg-sky-500/10",    border: "border-sky-200 dark:border-sky-500/20",    icon: "🚶" },
  FIRED:       { label: "Ishdan bo'shatilgan",       color: "text-rose-700 dark:text-rose-400",   bg: "bg-rose-50 dark:bg-rose-500/10",   border: "border-rose-200 dark:border-rose-500/20",   icon: "❌" },
  RETIRED:     { label: "Pensiyaga chiqqan",         color: "text-purple-700 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-500/10", border: "border-purple-200 dark:border-purple-500/20", icon: "🎖" },
  TRANSFERRED: { label: "Boshqa joyga o'tkazilgan",  color: "text-amber-700 dark:text-amber-400",  bg: "bg-amber-50 dark:bg-amber-500/10",  border: "border-amber-200 dark:border-amber-500/20",  icon: "🔄" },
  OTHER:       { label: "Boshqa sabab",             color: "text-slate-700 dark:text-slate-400", bg: "bg-slate-100 dark:bg-slate-500/10", border: "border-slate-200 dark:border-slate-500/20", icon: "📋" },
};

function calcDuration(hiredAt: string, firedAt: string): string {
  if (!hiredAt || !firedAt) return "—";
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

const UZ_MONTHS = ["", "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr"];

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
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/80 backdrop-blur-md animate-in fade-in" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-10 flex flex-col items-center justify-center gap-3 shadow-2xl z-10">
        <div className="w-10 h-10 border-3 border-indigo-600 dark:border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Arxiv ma'lumotlari yuklanmoqda...</p>
      </div>
    </div>
  );

  if (!emp) return null;

  const reason        = FIRE_REASON_LABELS[emp.fireReason] ?? FIRE_REASON_LABELS.OTHER;
  const duration      = calcDuration(emp.hiredAt, emp.firedAt);
  const att           = emp.attendanceStats ?? {};
  const totalAtt      = (att.present ?? 0) + (att.late ?? 0) + (att.absent ?? 0) + (att.earlyLeave ?? 0);
  const attendancePct = totalAtt > 0
    ? Math.round(((att.present ?? 0) + (att.late ?? 0)) / totalAtt * 100)
    : 0;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 sm:py-6 font-sans">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/80 backdrop-blur-md transition-opacity duration-200" onClick={onClose} />

      {/* Modal Card Container */}
      <div className="relative w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[88vh] bg-white dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800/90 rounded-t-3xl sm:rounded-3xl shadow-2xl shadow-indigo-500/10 flex flex-col overflow-hidden z-10 animate-in fade-in slide-in-from-bottom-5 duration-200">
        
        {/* Sticky Header */}
        <div className="sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl z-20 px-6 py-4 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Archive className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Arxiv xodim fayli</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Tafsilotlar va faoliyat tarixi</p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto custom-scrollbar">

          {/* Bio Main Card */}
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-5 p-5 rounded-2xl bg-slate-50 dark:bg-gradient-to-r dark:from-slate-900 dark:via-slate-800/50 dark:to-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm dark:shadow-lg">
            <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

            {/* Avatar */}
            <div className="relative flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24">
              {emp.photoUrl ? (
                <img
                  src={buildPhotoUrl(emp.photoUrl)}
                  alt={emp.fullName}
                  className="w-full h-full rounded-2xl object-cover ring-2 ring-indigo-500/30 shadow-md"
                />
              ) : (
                <div className={cn(
                  "w-full h-full rounded-2xl flex items-center justify-center text-2xl font-bold text-white shadow-md ring-2 ring-indigo-500/30",
                  getAvatarColor(emp.fullName)
                )}>
                  {getInitials(emp.fullName)}
                </div>
              )}
            </div>

            {/* Employee Details */}
            <div className="flex-1 min-w-0 space-y-1.5 z-10">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight truncate">{emp.fullName}</h2>
              
              <div className="flex items-center gap-2 flex-wrap text-xs font-medium">
                <span className="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 px-2.5 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-500/20">
                  {emp.position?.name || "Lavozim yo'q"}
                </span>
                <span className="text-slate-300 dark:text-slate-600">•</span>
                <span className="text-slate-600 dark:text-slate-400">{emp.department?.name || "Bo'lim ko'rsatilmadi"}</span>
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-2 pt-2 text-xs">
                {emp.phone && (
                  <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700/50 shadow-sm">
                    <Phone className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> {emp.phone}
                  </span>
                )}
                {emp.employeeNo && (
                  <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-mono bg-white dark:bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700/50 shadow-sm">
                    <Hash className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" /> ID: {emp.employeeNo}
                  </span>
                )}
                {emp.birthDate && (
                  <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 px-1 py-1">
                    🎂 {dayjs(emp.birthDate).format("DD.MM.YYYY")}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Oldingi Ish Joyi (Hospital Info) */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1.5">
            <p className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" /> Ishlagan kasalxonasi
            </p>
            <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{emp.hospital?.name || "—"}</p>
            {emp.hospital?.address && (
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 flex-shrink-0" /> {emp.hospital.address}
              </p>
            )}
          </div>

          {/* Ishlash Muddati Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1">
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Ishga kirgan
              </p>
              <p className="font-bold text-slate-800 dark:text-slate-200 font-mono text-sm">
                {dayjs(emp.hiredAt).format("DD.MM.YYYY")}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1">
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <UserX className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" /> Ketgan sana
              </p>
              <p className="font-bold text-slate-800 dark:text-slate-200 font-mono text-sm">
                {dayjs(emp.firedAt).format("DD.MM.YYYY")}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 flex flex-col justify-center space-y-0.5">
              <span className="text-[11px] text-indigo-700 dark:text-indigo-300 font-medium">Ishlagan muddati</span>
              <span className="font-extrabold text-indigo-600 dark:text-indigo-400 text-base">{duration}</span>
            </div>
          </div>

          {/* Ketish Sababi Badge & Note */}
          <div className={cn("p-4 rounded-2xl border flex items-start gap-3.5 backdrop-blur-md", reason.bg, reason.border)}>
            <span className="text-2xl flex-shrink-0">{reason.icon}</span>
            <div className="space-y-0.5">
              <p className={cn("font-bold text-sm", reason.color)}>{reason.label}</p>
              {emp.fireNote ? (
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed pt-0.5">{emp.fireNote}</p>
              ) : (
                <p className="text-[11px] text-slate-400 dark:text-slate-500 italic">Qo'shimcha izoh kiritilmagan</p>
              )}
            </div>
          </div>

          {/* Oxirgi Maosh */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <DollarSign className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Oxirgi tayinlangan maoshi</span>
            </div>
            <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-lg font-mono">{formatMoney(emp.baseSalary)}</span>
          </div>

          {/* Davomat Statistikasi */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Davomat statistikasi (Umumiy)
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Keldi",      value: att.present    ?? 0, icon: <CheckCircle2 className="w-4 h-4" />, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10", border: "border-emerald-200 dark:border-emerald-500/20" },
                { label: "Kech keldi", value: att.late       ?? 0, icon: <Clock className="w-4 h-4" />,        color: "text-amber-600 dark:text-amber-400",   bg: "bg-amber-50 dark:bg-amber-500/10",   border: "border-amber-200 dark:border-amber-500/20" },
                { label: "Kelmadi",    value: att.absent     ?? 0, icon: <XCircle className="w-4 h-4" />,      color: "text-rose-600 dark:text-rose-400",    bg: "bg-rose-50 dark:bg-rose-500/10",    border: "border-rose-200 dark:border-rose-500/20" },
                { label: "Erta ketdi", value: att.earlyLeave ?? 0, icon: <AlertTriangle className="w-4 h-4" />,color: "text-orange-600 dark:text-orange-400",  bg: "bg-orange-50 dark:bg-orange-500/10",  border: "border-orange-200 dark:border-orange-500/20" },
              ].map((s) => (
                <div key={s.label} className={cn("p-3 rounded-2xl border text-center backdrop-blur-md shadow-sm", s.bg, s.border)}>
                  <div className={cn("flex justify-center mb-1", s.color)}>{s.icon}</div>
                  <p className={cn("text-lg font-extrabold font-mono", s.color)}>{s.value}</p>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {totalAtt > 0 && (
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Umumiy davomat intizomi</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">{attendancePct}%</span>
                </div>
                <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-indigo-500 transition-all duration-700"
                    style={{ width: `${attendancePct}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Maosh Tarixi (So'nggi 6 oy) */}
          {(payrollHistory as any[]).length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Maosh tarixi (so'nggi 6 oy)
              </p>
              
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 divide-y divide-slate-100 dark:divide-slate-800/80 overflow-hidden shadow-sm">
                {(payrollHistory as any[]).map((h: any, i: number) => {
                  const totalDed = Number(h.lateDeduction ?? 0) + Number(h.absenceDeduction ?? 0) + Number(h.earlyLeaveDeduction ?? 0);
                  return (
                    <div key={i} className="flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <div>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {UZ_MONTHS[h.month]} {h.year}
                        </p>
                        {totalDed > 0 && (
                          <p className="text-[11px] text-rose-600 dark:text-rose-400/90 font-mono mt-0.5">−{formatMoney(totalDed)} jarima</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">{formatMoney(h.netSalary)}</p>
                        {h.status === "APPROVED" && (
                          <p className="text-[10px] text-emerald-600/80 dark:text-emerald-500/80 font-medium">✓ Tasdiqlangan</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Ta'til Tarixi */}
          {(emp.leaveRequests ?? []).length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" /> Ta'til va mehnat ta'tillari
              </p>
              
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 divide-y divide-slate-100 dark:divide-slate-800/80 overflow-hidden shadow-sm">
                {(emp.leaveRequests as any[]).slice(0, 5).map((l: any) => (
                  <div key={l.id} className="flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <div>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{l.type}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                        {dayjs(l.startDate).format("DD.MM.YYYY")} – {dayjs(l.endDate).format("DD.MM.YYYY")}
                      </p>
                    </div>
                    <span className={cn(
                      "text-[10px] font-bold px-2.5 py-1 rounded-lg border",
                      l.status === "APPROVED"  ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20" :
                      l.status === "COMPLETED" ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20"   :
                      l.status === "REJECTED"  ? "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20"         :
                      "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
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