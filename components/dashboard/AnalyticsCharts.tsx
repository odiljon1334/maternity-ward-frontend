"use client";
import {
  AreaChart, Area,
  BarChart, Bar,
  XAxis, YAxis,
  CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Cell,
} from "recharts";
import { formatMoney } from "@/lib/utils";

// ── Shared Tooltip ────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label, formatter }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[var(--bg-card,#1e2638)] border border-[var(--border,#2d3748)] rounded-xl px-3.5 py-2.5 text-xs shadow-xl backdrop-blur-md z-50">
      <p className="text-[var(--text-muted,#94a3b8)] mb-1.5 font-semibold text-[11px] tracking-wider uppercase">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color ?? p.fill }} className="font-medium flex justify-between gap-4 py-0.5">
          <span className="opacity-80">{p.name}:</span>
          <span className="font-semibold">{formatter ? formatter(p.value, p.name) : p.value}</span>
        </p>
      ))}
    </div>
  );
}

interface AnalyticsChartsProps {
  monthly: any[];
  payrollTrend: any[];
  heatmap: any[];
  leaveMonthly: any[];
}

export default function AnalyticsCharts({
  monthly,
  payrollTrend,
  heatmap,
  leaveMonthly,
}: AnalyticsChartsProps) {
  // Determine peak check-in hour for coloring
  const maxHeatmapCount = Math.max(...(heatmap.map((h) => h.count) ?? [1]), 1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

      {/* ── 1. Monthly Attendance Summary ─────────────────────────────── */}
      <div className="card p-5 hover:border-indigo-500/20 transition-all duration-300">
        <div className="mb-4">
          <h3 className="font-semibold text-[var(--text-primary)]">Oylik davomat</h3>
          <p className="text-xs text-[var(--text-muted)]">Keldi / Kelmadi / Kechikdi</p>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={monthly} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gradPresent" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradAbsent" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#f87171" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: "var(--text-muted)", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip content={<ChartTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11, color: "var(--text-muted)" }} />
            <Area
              type="monotone" dataKey="present" name="Keldi"
              stroke="#6366f1" fill="url(#gradPresent)" strokeWidth={2}
            />
            <Area
              type="monotone" dataKey="absent" name="Kelmadi"
              stroke="#f87171" fill="url(#gradAbsent)" strokeWidth={2}
            />
            <Area
              type="monotone" dataKey="late" name="Kechikdi"
              stroke="#fbbf24" fill="none" strokeWidth={2} strokeDasharray="4 2"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ── 2. Payroll Cost Trend ──────────────────────────────────────── */}
      <div className="card p-5 hover:border-indigo-500/20 transition-all duration-300">
        <div className="mb-4">
          <h3 className="font-semibold text-[var(--text-primary)]">Maosh xarajati trendi</h3>
          <p className="text-xs text-[var(--text-muted)]">Sof maosh (so'm)</p>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={payrollTrend} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: "var(--text-muted)", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fill: "var(--text-muted)", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => (v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v))}
            />
            <Tooltip
              content={
                <ChartTooltip
                  formatter={(v: number, name: string) => {
                    if (name === "Sof maosh" || name === "Asosiy maosh") return formatMoney(v);
                    return v;
                  }}
                />
              }
            />
            <Legend wrapperStyle={{ fontSize: 11, color: "var(--text-muted)" }} />
            <Bar dataKey="baseSalary" name="Asosiy maosh" fill="#4f46e5" radius={[4, 4, 0, 0]} />
            <Bar dataKey="netSalary"  name="Sof maosh"    fill="#22c55e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── 3. Check-in Time Heatmap ───────────────────────────────────── */}
      <div className="card p-5 hover:border-indigo-500/20 transition-all duration-300">
        <div className="mb-4">
          <h3 className="font-semibold text-[var(--text-primary)]">Kelish vaqti tahlili</h3>
          <p className="text-xs text-[var(--text-muted)]">Soat bo'yicha (so'nggi 30 kun)</p>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={heatmap.filter((h) => h.hour >= 5 && h.hour <= 23)}
            margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: "var(--text-muted)", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              interval={1}
            />
            <YAxis
              tick={{ fill: "var(--text-muted)", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<ChartTooltip formatter={(v: number) => `${v} ta`} />} />
            <Bar dataKey="count" name="Kelish" radius={[4, 4, 0, 0]}>
              {heatmap
                .filter((h) => h.hour >= 5 && h.hour <= 23)
                .map((entry, idx) => {
                  const intensity = entry.count / maxHeatmapCount;
                  const r = Math.round(99  + intensity * (239 - 99));
                  const g = Math.round(102 + intensity * (68  - 102));
                  const b = Math.round(241 + intensity * (68  - 241));
                  return <Cell key={`cell-${idx}`} fill={`rgb(${r},${g},${b})`} />;
                })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── 4. Monthly Approved Leaves ────────────────────────────────── */}
      <div className="card p-5 hover:border-indigo-500/20 transition-all duration-300">
        <div className="mb-4">
          <h3 className="font-semibold text-[var(--text-primary)]">Ta'til so'rovlari trendi</h3>
          <p className="text-xs text-[var(--text-muted)]">
            {new Date().getFullYear()} yil bo'yicha tasdiqlangan
          </p>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={leaveMonthly} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: "var(--text-muted)", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fill: "var(--text-muted)", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<ChartTooltip formatter={(v: number) => `${v} ta`} />} />
            <Bar dataKey="count" name="Tasdiqlangan ta'til" fill="#10b981" radius={[4, 4, 0, 0]}>
              {leaveMonthly.map((_: any, idx: number) => (
                <Cell key={`lv-${idx}`} fill={`hsl(${160 - idx * 3}, 65%, 45%)`} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}