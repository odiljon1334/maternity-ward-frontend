import * as React from "react";
import { cn } from "@/lib/utils";

type SurfaceProps = React.HTMLAttributes<HTMLElement> & {
  as?: "div" | "section" | "article";
  tone?: "default" | "muted";
};

export function Surface({ as: Component = "div", className, tone = "default", ...props }: SurfaceProps) {
  return <Component className={cn(tone === "muted" ? "ui-surface-muted" : "ui-surface", className)} {...props} />;
}

export function SurfaceHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-start justify-between gap-4 border-b border-[var(--border)] px-4 py-4 sm:px-5", className)} {...props} />;
}

export function SurfaceBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-4 sm:p-5", className)} {...props} />;
}
