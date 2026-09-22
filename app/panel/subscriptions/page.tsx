"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  Building2,
  CalendarRange,
  CircleDollarSign,
  TrendingUp,
} from "lucide-react";
import { paymentsApi } from "@/lib/api";

type PaymentStatus = "PAID" | "PENDING" | "OVERDUE";
type PlatformStats = {
  period: string;
  mrr: number;
  arr: number;
  trend: Array<{ period: string; amount: number }>;
  paymentStatusCounts: Record<PaymentStatus, number>;
  currentMonthOutstanding: number;
  churnCount: number;
  churn: Array<{
    id: string;
    name: string;
    code: string;
    reason: "INACTIVE" | "NO_RECENT_PAYMENT";
  }>;
};

const MONTHS = [
  "Yan",
  "Fev",
  "Mar",
  "Apr",
  "May",
  "Iyun",
  "Iyul",
  "Avg",
  "Sen",
  "Okt",
  "Noy",
  "Dek",
];

function formatAmount(value: number) {
  return `${Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ")} so'm`;
}

function periodLabel(period: string) {
  const [year, month] = period.split("-");
  return `${MONTHS[Number(month) - 1] || month} ${year.slice(-2)}`;
}

export default function PanelSubscriptionsPage() {
  const [months, setMonths] = useState(12);
  const { data, isLoading, isError } = useQuery<PlatformStats>({
    queryKey: ["panel-revenue-analysis", months],
    queryFn: () => paymentsApi.platformStats(months),
  });

  const trend = useMemo(
    () =>
      (data?.trend ?? []).map((item) => ({
        ...item,
        label: periodLabel(item.period),
      })),
    [data?.trend],
  );
  const firstAmount = trend[0]?.amount ?? 0;
  const lastAmount = trend[trend.length - 1]?.amount ?? 0;
  const trendPercent =
    firstAmount > 0
      ? Math.round(((lastAmount - firstAmount) / firstAmount) * 100)
      : null;

  const paymentStatus = [
    {
      key: "PAID" as const,
      label: "To'langan",
      value: data?.paymentStatusCounts.PAID ?? 0,
      color: "#22c55e",
    },
    {
      key: "PENDING" as const,
      label: "Kutilmoqda",
      value: data?.paymentStatusCounts.PENDING ?? 0,
      color: "#f59e0b",
    },
    {
      key: "OVERDUE" as const,
      label: "Muddati o'tgan",
      value: data?.paymentStatusCounts.OVERDUE ?? 0,
      color: "#ef4444",
    },
  ];
  const totalStatuses = paymentStatus.reduce(
    (sum, item) => sum + item.value,
    0,
  );
  const cards = [
    {
      label: "Haqiqiy MRR",
      value: formatAmount(data?.mrr ?? 0),
      note: `Davr: ${data?.period ?? "—"}`,
      icon: CircleDollarSign,
      color: "bg-indigo-500",
    },
    {
      label: "ARR proyeksiyasi",
      value: formatAmount(data?.arr ?? 0),
      note: "MRR × 12",
      icon: CalendarRange,
      color: "bg-violet-500",
    },
    {
      label: "Joriy oy qoldig'i",
      value: formatAmount(data?.currentMonthOutstanding ?? 0),
      note: "Kutilayotgan va qarzdor",
      icon: AlertTriangle,
      color: "bg-amber-500",
    },
    {
      label: "Churn xavfi",
      value: `${data?.churnCount ?? 0} ta`,
      note: "Nofaol yoki 2 oy to'lamagan",
      icon: Building2,
      color: "bg-red-500",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[10px] font-semibold tracking-wider text-indigo-500">
            MOLIYAVIY TAHLIL
          </div>
          <h1 className="mt-1 text-[26px] font-semibold tracking-tight text-[var(--text-primary)]">
            Daromad tahlili
          </h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Haqiqiy tushum, MRR/ARR dinamikasi va mijoz yo&apos;qotish xavfi.
          </p>
        </div>
        <select
          value={months}
          onChange={(event) => setMonths(Number(event.target.value))}
          className="input-field w-auto min-w-40"
        >
          <option value={6}>Oxirgi 6 oy</option>
          <option value={12}>Oxirgi 12 oy</option>
          <option value={24}>Oxirgi 24 oy</option>
        </select>
      </div>

      {isError ? (
        <div className="card p-10 text-center text-sm text-red-500">
          Daromad ma&apos;lumotlarini yuklab bo&apos;lmadi
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map(({ label, value, note, icon: Icon, color }) => (
              <div key={label} className="card flex items-start gap-4 p-5">
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${color}`}
                >
                  <Icon className="h-5 w-5 text-white" />
                </span>
                <div className="min-w-0">
                  <div className="text-xs text-[var(--text-muted)]">
                    {label}
                  </div>
                  <div className="mt-1 truncate text-xl font-semibold text-[var(--text-primary)]">
                    {isLoading ? "..." : value}
                  </div>
                  <div className="mt-1 text-[10px] text-[var(--text-muted)]">
                    {note}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid gap-5 xl:grid-cols-[1.7fr_1fr]">
            <div className="card rounded-2xl p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                    Oylik haqiqiy tushum
                  </h2>
                  <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                    Faqat bazaga kiritilgan to&apos;lovlar hisoblanadi
                  </p>
                </div>
                {trendPercent != null && (
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                      trendPercent >= 0
                        ? "bg-emerald-500/10 text-emerald-500"
                        : "bg-red-500/10 text-red-500"
                    }`}
                  >
                    <TrendingUp className="h-3.5 w-3.5" />
                    {trendPercent >= 0 ? "+" : ""}
                    {trendPercent}%
                  </span>
                )}
              </div>
              <div className="mt-5 h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={trend}
                    margin={{ left: -8, right: 8, top: 8 }}
                  >
                    <defs>
                      <linearGradient
                        id="revenueGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#6366f1"
                          stopOpacity={0.4}
                        />
                        <stop
                          offset="100%"
                          stopColor="#6366f1"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="var(--border)"
                    />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                      axisLine={false}
                      tickLine={false}
                      width={55}
                      tickFormatter={(value: number) =>
                        `${Math.round(value / 1_000_000)}M`
                      }
                    />
                    <Tooltip
                      formatter={(value) => [
                        formatAmount(Number(value)),
                        "Tushum",
                      ]}
                      contentStyle={{
                        borderRadius: 10,
                        border: "1px solid var(--border)",
                        background: "var(--bg-card)",
                        fontSize: 12,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="amount"
                      stroke="#6366f1"
                      strokeWidth={2.5}
                      fill="url(#revenueGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                Joriy oy to&apos;lov holati
              </h2>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                Muassasalar kesimida
              </p>
              <div className="relative mx-auto mt-4 h-[210px] w-[210px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentStatus}
                      dataKey="value"
                      innerRadius={65}
                      outerRadius={90}
                      paddingAngle={3}
                      strokeWidth={0}
                    >
                      {paymentStatus.map((item) => (
                        <Cell key={item.key} fill={item.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-2xl font-semibold text-[var(--text-primary)]">
                    {totalStatuses}
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)]">
                    jami
                  </div>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                {paymentStatus.map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="flex items-center gap-2 text-[var(--text-muted)]">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      {item.label}
                    </span>
                    <span className="font-medium text-[var(--text-primary)]">
                      {item.value} ta
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="border-b border-[var(--border)] px-5 py-4">
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                Churn xavfidagi muassasalar
              </h2>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                Nofaol qilingan yoki oxirgi ikki davrda to&apos;lov qilmagan
                mijozlar
              </p>
            </div>
            {isLoading ? (
              <div className="p-8 text-center text-sm text-[var(--text-muted)]">
                Yuklanmoqda...
              </div>
            ) : !data?.churn.length ? (
              <div className="p-8 text-center text-sm text-emerald-500">
                Churn xavfidagi muassasa yo&apos;q
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)] text-left text-xs uppercase tracking-wider text-[var(--text-muted)]">
                      <th className="px-5 py-3 font-medium">Muassasa</th>
                      <th className="px-5 py-3 font-medium">Kod</th>
                      <th className="px-5 py-3 font-medium">Sabab</th>
                      <th className="px-5 py-3 font-medium">Tavsiya</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.churn.map((hospital) => (
                      <tr
                        key={hospital.id}
                        className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-hover)]"
                      >
                        <td className="px-5 py-3 font-medium text-[var(--text-primary)]">
                          {hospital.name}
                        </td>
                        <td className="px-5 py-3 font-mono text-xs text-[var(--text-muted)]">
                          {hospital.code}
                        </td>
                        <td className="px-5 py-3">
                          <span className="rounded-full bg-red-500/10 px-2.5 py-1 text-xs text-red-500">
                            {hospital.reason === "INACTIVE"
                              ? "Nofaol qilingan"
                              : "2 oy to'lov yo'q"}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-xs text-[var(--text-muted)]">
                          Mijoz bilan bog&apos;lanib holatini aniqlash
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
