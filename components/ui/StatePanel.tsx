import * as React from "react";
import { AlertCircle, Inbox, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

type StateKind = "loading" | "empty" | "error";

type StatePanelProps = {
  kind?: StateKind;
  title: string;
  description?: string;
  icon?: React.ElementType;
  actionLabel?: string;
  onAction?: () => void;
  actionLoading?: boolean;
  className?: string;
};

export function StatePanel({ kind = "empty", title, description, icon, actionLabel, onAction, actionLoading = false, className }: StatePanelProps) {
  const Icon = icon ?? (kind === "loading" ? Loader2 : kind === "error" ? AlertCircle : Inbox);
  return (
    <div className={cn("ui-state-panel", className)} role={kind === "error" ? "alert" : "status"} aria-live="polite">
      <span className={cn(
        "mb-3 grid h-11 w-11 place-items-center rounded-xl border",
        kind === "error" ? "border-rose-500/25 bg-rose-500/10 text-rose-500" : "border-[var(--border)] bg-[var(--bg-hover)] text-[var(--text-muted)]",
      )}>
        <Icon className={cn("h-5 w-5", kind === "loading" && "animate-spin")} aria-hidden />
      </span>
      <h3 className="font-semibold text-[var(--text-primary)]">{title}</h3>
      {description ? <p className="mt-1 max-w-lg text-sm leading-relaxed">{description}</p> : null}
      {actionLabel && onAction ? <Button className="mt-4" size="sm" onClick={onAction} loading={actionLoading}>{actionLabel}</Button> : null}
    </div>
  );
}
