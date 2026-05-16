"use client";
import dayjs from "dayjs";
import {
  AreaChart, Area,
  XAxis, YAxis,
  CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import { formatMinutes } from "@/lib/utils";

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1e2638] border border-[#2d3748] rounded-lg px-3 py-2 text-xs">
      <p className="text-gray-400 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="font-medium">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
}

interface Props {
  trend?: any[];
  topLate?: any[];
}

export default function DashboardCharts({ trend, topLate }: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-4">
      {/* Attendance trend (2/3 width) */}
      <div className="lg:col-span-2 card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-[var(--text-primary)]">Davomat trendi</h3>
            <p className="text-xs text-[var(--text-muted)]">So'nggi 14 kun</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={trend || []}>
            <defs>
              <linearGradient id="presentGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="absentGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f87171" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: "var(--text-muted)", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => dayjs(v).format("DD/MM")}
            />
            <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12, color: "var(--text-muted)" }} />
            <Area type="monotone" dataKey="present" name="Keldi"   stroke="#6366f1" fill="url(#presentGrad)" strokeWidth={2} />
            <Area type="monotone" dataKey="absent"  name="Kelmadi" stroke="#f87171" fill="url(#absentGrad)"  strokeWidth={2} />
            <Area type="monotone" dataKey="late"    name="Kechikdi" stroke="#fbbf24" strokeWidth={2} fill="none" strokeDasharray="4 2" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Top late employees (1/3 width) */}
      <div className="card p-5">
        <h3 className="font-semibold text-[var(--text-primary)] mb-1">Ko'p kechikkanlar</h3>
        <p className="text-xs text-[var(--text-muted)] mb-4">Bu oy</p>
        <div className="space-y-3">
          {(topLate || []).slice(0, 5).map((emp: any, i: number) => (
            <div key={emp.employeeId} className="flex items-center gap-3">
              <span className="text-xs text-[var(--text-muted)] w-4">{i + 1}</span>
              <div className="w-8 h-8 rounded-full bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center text-xs font-semibold text-indigo-400">
                {emp.name?.[0] ?? "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--text-primary)] truncate">{emp.name}</p>
                <p className="text-xs text-[var(--text-muted)]">{emp.lateCount} marta kechikdi</p>
              </div>
              <span className="badge-yellow">{formatMinutes(emp.totalLateMin)}</span>
            </div>
          ))}
          {(!topLate || topLate.length === 0) && (
            <p className="text-sm text-[var(--text-muted)] text-center py-6">Ma'lumot yo'q</p>
          )}
        </div>
      </div>
    </div>
  );
}
