"use client";

interface ToolResult {
  toolName: string;
  result: any;
}

export default function ToolResultCard({ toolName, result }: ToolResult) {
  const configs: Record<string, { icon: string; label: string; color: string }> = {
    get_employees:                  { icon: "👥", label: "Xodimlar",        color: "text-blue-400 border-blue-500/30 bg-blue-500/5" },
    get_attendance:                 { icon: "📋", label: "Davomat",          color: "text-teal-400 border-teal-500/30 bg-teal-500/5" },
    get_monthly_attendance_summary: { icon: "📊", label: "Oylik xulosa",     color: "text-teal-400 border-teal-500/30 bg-teal-500/5" },
    calculate_salary:               { icon: "💰", label: "Maosh hisobi",     color: "text-amber-400 border-amber-500/30 bg-amber-500/5" },
    get_schedule:                   { icon: "📅", label: "Jadval",           color: "text-purple-400 border-purple-500/30 bg-purple-500/5" },
    update_schedule:                { icon: "✏️", label: "Jadval yangilandi", color: "text-green-400 border-green-500/30 bg-green-500/5" },
  };

  const cfg = configs[toolName] ?? { icon: "🔧", label: toolName, color: "text-slate-400 border-slate-500/30 bg-slate-500/5" };

  return (
    <div className={`rounded-xl border p-3 mt-2 text-xs ${cfg.color}`}>
      <div className="flex items-center gap-2 mb-2 font-semibold uppercase tracking-wider text-[10px]">
        <span>{cfg.icon}</span>
        <span>{cfg.label}</span>
        <span className="ml-auto opacity-50">Tool natijasi</span>
      </div>
      <pre className="overflow-auto max-h-48 text-slate-300 text-[11px] leading-relaxed whitespace-pre-wrap">
        {JSON.stringify(result, null, 2)}
      </pre>
    </div>
  );
}
