"use client";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import Link from "next/link";
import { Building2, ArrowRight, AlertCircle, Clock } from "lucide-react";
import { StatCard } from "@/components/panel/StatCard";
import {
  MOCK_STATS,
  MOCK_REVENUE_TREND,
  MOCK_PAYMENT_STATUS,
  MOCK_RECENT_HOSPITALS,
  MOCK_ROLE_DISTRIBUTION,
  MOCK_ATTENTION,
} from "@/components/panel/mock-data";

const number = (n: number) => new Intl.NumberFormat("uz-UZ").format(n);
const dateFmt = (v: string) => new Date(v).toLocaleDateString("uz-UZ");

export default function PanelOverviewPage() {
  const totalRoles = MOCK_ROLE_DISTRIBUTION.reduce((s, r) => s + r.count, 0);
  const totalPayments = MOCK_PAYMENT_STATUS.reduce((s, x) => s + x.value, 0);

  return (
    <div className="space-y-6">
      {/* Page head */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-[10px] font-semibold tracking-wider text-indigo-500">PLATFORMA BOSHQARUVI</div>
          <h1 className="mt-1 text-[26px] font-semibold tracking-tight text-[var(--text-primary)]">
            Umumiy ko&apos;rinish
          </h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Shifoxonalar, foydalanuvchilar va daromad — bir ko&apos;rinishda.
          </p>
        </div>
        <Link
          href="/panel/hospitals"
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-500/25"
        >
          <Building2 className="h-4 w-4" /> Shifoxonalar boshqaruvi
        </Link>
      </div>

      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-2.5 text-xs text-amber-600 dark:text-amber-400">
        Ko&apos;rsatkichlar hozircha namunaviy (mock) ma&apos;lumot — backend ulanishi keyingi bosqichda amalga
        oshiriladi (Reja.md, FAZA 5).
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {MOCK_STATS.map((stat) => (
          <StatCard key={stat.key} stat={stat} />
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.7fr_1fr]">
        {/* Revenue chart + recent hospitals */}
        <div className="card rounded-2xl p-5">
          <div>
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Oylik daromad dinamikasi (MRR)</h2>
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">Oxirgi 8 oy, so&apos;mda</p>
          </div>
          <div className="mt-4 h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MOCK_REVENUE_TREND} margin={{ left: -18, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="mrrGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                  tickFormatter={(v: number) => `${v / 1_000_000}M`}
                />
                <Tooltip
                  formatter={(v) => [`${number(Number(v))} so'm`, "MRR"]}
                  contentStyle={{
                    borderRadius: 10,
                    border: "1px solid var(--border)",
                    background: "var(--bg-card)",
                    fontSize: 12,
                  }}
                />
                <Area type="monotone" dataKey="mrr" stroke="#6366f1" strokeWidth={2.5} fill="url(#mrrGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-6 border-t border-[var(--border)] pt-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">So&apos;nggi qo&apos;shilgan shifoxonalar</h3>
              <Link href="/panel/hospitals" className="text-xs font-medium text-indigo-500">
                Barchasini ko&apos;rish →
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
                    <th className="pb-2 font-medium">Shifoxona</th>
                    <th className="pb-2 font-medium">Xodimlar</th>
                    <th className="pb-2 font-medium">Holat</th>
                    <th className="pb-2 font-medium">Qo&apos;shildi</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_RECENT_HOSPITALS.map((h) => (
                    <tr key={h.id} className="border-t border-[var(--border)]">
                      <td className="py-2.5">
                        <div className="font-medium text-[var(--text-primary)]">{h.name}</div>
                        <div className="text-[10px] text-[var(--text-muted)]">{h.code}</div>
                      </td>
                      <td className="py-2.5 text-[var(--text-primary)]">{h.employees}</td>
                      <td className="py-2.5">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            h.isActive ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                          }`}
                        >
                          {h.isActive ? "Faol" : "Nofaol"}
                        </span>
                      </td>
                      <td className="py-2.5 text-[var(--text-muted)]">{dateFmt(h.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Donut */}
          <div className="card rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">To&apos;lov holati taqsimoti</h2>
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">Joriy oy, shifoxonalar bo&apos;yicha</p>
            <div className="relative mx-auto mt-2 h-[160px] w-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={MOCK_PAYMENT_STATUS}
                    dataKey="value"
                    innerRadius={48}
                    outerRadius={70}
                    paddingAngle={3}
                    strokeWidth={0}
                  >
                    {MOCK_PAYMENT_STATUS.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-xl font-semibold text-[var(--text-primary)]">{totalPayments}</div>
                <div className="text-[10px] text-[var(--text-muted)]">jami</div>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {MOCK_PAYMENT_STATUS.map((x) => (
                <div key={x.name} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-[var(--text-muted)]">
                    <span className="h-2 w-2 rounded-full" style={{ background: x.color }} />
                    {x.name}
                  </span>
                  <span className="font-medium text-[var(--text-primary)]">{x.value} ta</span>
                </div>
              ))}
            </div>
          </div>

          {/* Attention */}
          <div className="card rounded-2xl p-5">
            <h2 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">E&apos;tibor talab qiladi</h2>
            <div className="space-y-3">
              <Link
                href="/panel/payments"
                className="flex items-center gap-3 rounded-xl bg-amber-500/5 p-3 transition hover:bg-amber-500/10"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
                  <Clock className="h-4 w-4" />
                </span>
                <div className="flex-1">
                  <div className="text-xs font-medium text-[var(--text-primary)]">Kutilayotgan to&apos;lovlar</div>
                  <div className="text-[10px] text-[var(--text-muted)]">
                    {MOCK_ATTENTION.pendingPaymentsCount} ta shifoxona
                  </div>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-[var(--text-muted)]" />
              </Link>
              <Link
                href="/panel/hospitals"
                className="flex items-center gap-3 rounded-xl bg-red-500/5 p-3 transition hover:bg-red-500/10"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 text-red-500">
                  <AlertCircle className="h-4 w-4" />
                </span>
                <div className="flex-1">
                  <div className="text-xs font-medium text-[var(--text-primary)]">Nofaol shifoxonalar</div>
                  <div className="text-[10px] text-[var(--text-muted)]">
                    {MOCK_ATTENTION.inactiveHospitalsCount} ta shifoxona
                  </div>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-[var(--text-muted)]" />
              </Link>
            </div>
          </div>

          {/* Role distribution */}
          <div className="card rounded-2xl p-5">
            <h2 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">Foydalanuvchilar rollari</h2>
            <div className="space-y-3.5">
              {MOCK_ROLE_DISTRIBUTION.map((r) => (
                <div key={r.role}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-[var(--text-muted)]">{r.label}</span>
                    <span className="font-medium text-[var(--text-primary)]">{r.count}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-[var(--bg-hover)]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                      style={{ width: `${(r.count / totalRoles) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
