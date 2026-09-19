import { Building2, Users, Wallet, Clock, ArrowUpRight, ArrowDownRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { PanelStat } from "./mock-data";

const ICONS: Record<PanelStat["icon"], LucideIcon> = {
  hospitals: Building2,
  users: Users,
  revenue: Wallet,
  pending: Clock,
};

const TONES: Record<PanelStat["tone"], { bg: string; text: string }> = {
  blue: { bg: "bg-blue-500/10", text: "text-blue-500" },
  green: { bg: "bg-emerald-500/10", text: "text-emerald-500" },
  violet: { bg: "bg-violet-500/10", text: "text-violet-500" },
  amber: { bg: "bg-amber-500/10", text: "text-amber-500" },
};

export function StatCard({ stat }: { stat: PanelStat }) {
  const Icon = ICONS[stat.icon];
  const tone = TONES[stat.tone];
  const DeltaIcon = stat.delta.direction === "up" ? ArrowUpRight : ArrowDownRight;
  const deltaColor = stat.delta.direction === "up" ? "text-emerald-500" : "text-red-500";

  return (
    <div className="card rounded-2xl p-5">
      <div className="flex items-start justify-between">
        <span className="text-xs font-medium text-[var(--text-muted)]">{stat.label}</span>
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tone.bg} ${tone.text}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <div className="mt-4 text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
        {stat.value}
      </div>
      <div className="mt-2 flex items-center gap-1 text-xs">
        <span className={`flex items-center gap-0.5 font-medium ${deltaColor}`}>
          <DeltaIcon className="h-3.5 w-3.5" />
          {stat.delta.value}
        </span>
        <span className="text-[var(--text-muted)]">{stat.delta.note}</span>
      </div>
    </div>
  );
}
