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
    <div className="bg-[var(--bg-card,#1e2638)] border border-[var(--border,#2d3748)] rounded-xl px-3.5 py-2.5 text-xs shadow-xl backdrop-blur-md z-50">
      <p className="text-[var(--text-muted,#94a3b8)] mb-1.5 font-semibold text-[11px]">
        {dayjs(label).isValid() ? dayjs(label).format("DD-MMMM, YYYY") : label}
      </p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="font-medium flex justify-between gap-4 py-0.5">
          <span className="opacity-80">{p.name}:</span>
          <span className="font-semibold">{p.value}</span>
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Attendance trend (2/3 width) */}
      <div className="lg:col-span-2 card p-5 hover:border-indigo-500/20 transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-[var(--text-primary)] text-base">Davomat trendi</h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">So'nggi 14 kunlik dinamika</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={trend || []} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="presentGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="absentGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f87171" stopOpacity={0.35} />
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
            <Legend wrapperStyle={{ fontSize: 11, color: "var(--text-muted)" }} />
            <Area type="monotone" dataKey="present" name="Keldi"   stroke="#6366f1" fill="url(#presentGrad)" strokeWidth={2} />
            <Area type="monotone" dataKey="absent"  name="Kelmadi" stroke="#f87171" fill="url(#absentGrad)"  strokeWidth={2} />
            <Area type="monotone" dataKey="late"    name="Kechikdi" stroke="#fbbf24" strokeWidth={2} fill="none" strokeDasharray="4 2" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Top late employees (1/3 width) */}
      <div className="card p-5 hover:border-amber-500/20 transition-all duration-300 flex flex-col justify-between">
        <div>
          <div className="mb-4">
            <h3 className="font-semibold text-[var(--text-primary)] text-base">Ko'p kechikkanlar</h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">Shu oy bo'yicha TOP-5</p>
          </div>
          
          <div className="space-y-3">
            {(topLate || []).slice(0, 5).map((emp: any, i: number) => (
              <div 
                key={emp.employeeId} 
                className="flex items-center gap-3 p-2 rounded-xl hover:bg-[var(--bg-hover)] transition-colors group"
              >
                <span className="text-xs font-semibold text-[var(--text-muted)] w-4 text-center">
                  {i + 1}
                </span>
                <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-400 group-hover:scale-105 transition-transform">
                  {emp.name?.[0] ?? "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-[var(--text-primary)] truncate">{emp.name}</p>
                  <p className="text-[11px] text-[var(--text-muted)]">{emp.lateCount} marta kechikdi</p>
                </div>
                <span className="badge-yellow text-[11px] font-mono px-2 py-0.5 rounded-md">
                  {formatMinutes(emp.totalLateMin)}
                </span>
              </div>
            ))}

            {(!topLate || topLate.length === 0) && (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <p className="text-xs text-[var(--text-muted)]">Ma'lumot topilmadi</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}