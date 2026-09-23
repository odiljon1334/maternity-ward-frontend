import * as React from "react";
import { cn } from "@/lib/utils";

type TableShellProps = React.HTMLAttributes<HTMLDivElement> & {
  maxHeight?: string;
};

export function TableShell({ className, maxHeight = "65vh", children, ...props }: TableShellProps) {
  return (
    <div className={cn("ui-table-shell", className)} {...props}>
      <div className="overflow-auto overscroll-contain" style={{ maxHeight }}>
        {children}
      </div>
    </div>
  );
}
