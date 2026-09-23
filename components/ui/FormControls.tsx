import * as React from "react";
import { cn } from "@/lib/utils";

export const controlClassName = cn(
  "input-field",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30",
);

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => <input ref={ref} className={cn(controlClassName, className)} {...props} />,
);
Input.displayName = "Input";

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select ref={ref} className={cn(controlClassName, "appearance-auto", className)} {...props}>
      {children}
    </select>
  ),
);
Select.displayName = "Select";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea ref={ref} className={cn(controlClassName, "min-h-24 resize-y", className)} {...props} />
  ),
);
Textarea.displayName = "Textarea";

type FieldProps = {
  label: React.ReactNode;
  htmlFor?: string;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
};

export function Field({ label, htmlFor, hint, error, required, className, children }: FieldProps) {
  return (
    <div className={cn("min-w-0", className)}>
      <label htmlFor={htmlFor} className="ui-label">
        {label}{required ? <span className="ml-1 text-rose-500">*</span> : null}
      </label>
      {children}
      {error ? <p className="ui-error" role="alert">{error}</p> : hint ? <p className="ui-help">{hint}</p> : null}
    </div>
  );
}
