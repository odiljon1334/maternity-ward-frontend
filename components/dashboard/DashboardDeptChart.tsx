"use client";
import {
  BarChart, Bar,
  XAxis, YAxis,
  CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[var(--bg-card,#1e2638)] border border-[var(--border,#2d3748)] rounded-xl px-3.5 py-2.5 text-xs shadow-xl backdrop-blur-md z-50">
      <p className="text-[var(--text-muted,#94a3b8)] mb-1.5 font-semibold text-[11px] tracking-wider uppercase">
        {label}
      </p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="font-medium flex justify-between gap-4 py-0.5">
          <span className="opacity-80">{p.name}:</span>
          <span className="font-semibold">{p.value} ta</span>
        </p>
      ))}
    </div>
  );
}

interface Props {
  departments: any[];
}

export default function DashboardDeptChart({ departments }: Props) {
  const deptData = departments.map((d: any) => ({
    name:    d.department?.name ?? d.name ?? "—",
    present: d.present ?? 0,
    late:    d.late    ?? 0,
    absent:  d.absent  ?? 0,
  }));

  return (
    <div className="card p-5 hover:border-indigo-500/20 transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-[var(--text-primary)] text-base">Bo'limlar bo'yicha davomat</h3>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">Joriy oy ko'rsatkichlari bo'limlar kesimida</p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <div style={{ minWidth: Math.max(560, deptData.length * 32) }}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={deptData} barCategoryGap="30%" margin={{ bottom: 8, top: 4, right: 8, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fill: "var(--text-muted)", fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                interval={0}
                angle={-40}
                textAnchor="end"
                height={90}
                tickFormatter={(v: string) => v.length > 16 ? v.slice(0, 16) + "…" : v}
              />
              <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11 }} tickLine={false} axisLine={false} width={32} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: "var(--text-muted)" }} />
              <Bar dataKey="present" name="Keldi"    fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="late"    name="Kechikdi" fill="#fbbf24" radius={[4, 4, 0, 0]} />
              <Bar dataKey="absent"  name="Kelmadi"  fill="#f87171" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}