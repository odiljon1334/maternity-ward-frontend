import type { LucideIcon } from "lucide-react";
import { Construction } from "lucide-react";

export function ComingSoon({
  title,
  description,
  icon: Icon = Construction,
}: {
  title: string;
  description: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500">
        <Icon className="h-7 w-7" />
      </span>
      <h1 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h1>
      <p className="mt-1.5 max-w-sm text-sm text-[var(--text-muted)]">{description}</p>
      <span className="mt-4 rounded-full bg-[var(--bg-hover)] px-3 py-1 text-[10px] font-medium tracking-wide text-[var(--text-muted)]">
        TEZ ORADA
      </span>
    </div>
  );
}
