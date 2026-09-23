"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";
import { Field, Input } from "./FormControls";

type DialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
};

export function Dialog({ open, onClose, title, description, children, footer, className }: DialogProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="ui-dialog-backdrop" />
        <DialogPrimitive.Content className={cn("ui-dialog-panel", className)}>
          <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] pb-4">
            <div>
              <DialogPrimitive.Title className="text-base font-bold text-[var(--text-primary)]">{title}</DialogPrimitive.Title>
              {description ? (
                <DialogPrimitive.Description className="mt-1 text-sm leading-relaxed text-[var(--text-muted)]">
                  {description}
                </DialogPrimitive.Description>
              ) : null}
            </div>
            <DialogPrimitive.Close asChild>
              <Button variant="ghost" size="icon" className="-mr-2 -mt-2" aria-label="Oynani yopish">
                <X className="h-4 w-4" />
              </Button>
            </DialogPrimitive.Close>
          </div>
          {children ? <div className="py-5">{children}</div> : null}
          {footer ? <div className="flex flex-col-reverse gap-2 border-t border-[var(--border)] pt-4 sm:flex-row sm:justify-end">{footer}</div> : null}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

type ConfirmDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "warning" | "primary";
  loading?: boolean;
};

export function ConfirmDialog({ open, onClose, onConfirm, title, description, confirmLabel = "Tasdiqlash", cancelLabel = "Bekor qilish", tone = "primary", loading }: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      footer={(
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>{cancelLabel}</Button>
          <Button variant={tone === "danger" ? "danger" : tone === "warning" ? "warning" : "primary"} onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
        </>
      )}
    />
  );
}

type PromptDialogProps = Omit<ConfirmDialogProps, "onConfirm"> & {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  onConfirm: (value: string) => void;
  placeholder?: string;
  inputType?: React.HTMLInputTypeAttribute;
};

export function PromptDialog({ label, value, onValueChange, onConfirm, placeholder, inputType = "text", ...props }: PromptDialogProps) {
  return (
    <Dialog
      open={props.open}
      onClose={props.onClose}
      title={props.title}
      description={props.description}
      footer={(
        <>
          <Button variant="secondary" onClick={props.onClose} disabled={props.loading}>{props.cancelLabel ?? "Bekor qilish"}</Button>
          <Button
            variant={props.tone === "danger" ? "danger" : props.tone === "warning" ? "warning" : "primary"}
            onClick={() => onConfirm(value.trim())}
            disabled={!value.trim()}
            loading={props.loading}
          >
            {props.confirmLabel ?? "Tasdiqlash"}
          </Button>
        </>
      )}
    >
      <Field label={label} required>
        <Input type={inputType} value={value} onChange={(event) => onValueChange(event.target.value)} placeholder={placeholder} autoFocus />
      </Field>
    </Dialog>
  );
}
