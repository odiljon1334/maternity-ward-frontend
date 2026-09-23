"use client";

import * as React from "react";
import { ConfirmDialog, PromptDialog } from "./Dialog";

type Tone = "danger" | "warning" | "primary";

type ConfirmOptions = {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: Tone;
};

type PromptOptions = ConfirmOptions & {
  label: string;
  placeholder?: string;
  initialValue?: string;
  inputType?: React.HTMLInputTypeAttribute;
};

type ConfirmationContextValue = {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  prompt: (options: PromptOptions) => Promise<string | null>;
};

type ActiveRequest =
  | { kind: "confirm"; options: ConfirmOptions }
  | { kind: "prompt"; options: PromptOptions }
  | null;

const ConfirmationContext = React.createContext<ConfirmationContextValue | null>(null);

export function ConfirmationProvider({ children }: { children: React.ReactNode }) {
  const [request, setRequest] = React.useState<ActiveRequest>(null);
  const [promptValue, setPromptValue] = React.useState("");
  const resolverRef = React.useRef<((value: boolean | string | null) => void) | null>(null);

  const settle = React.useCallback((value: boolean | string | null) => {
    resolverRef.current?.(value);
    resolverRef.current = null;
    setRequest(null);
    setPromptValue("");
  }, []);

  const confirm = React.useCallback((options: ConfirmOptions) => {
    resolverRef.current?.(false);
    setRequest({ kind: "confirm", options });
    setPromptValue("");
    return new Promise<boolean>((resolve) => {
      resolverRef.current = (value) => resolve(value === true);
    });
  }, []);

  const prompt = React.useCallback((options: PromptOptions) => {
    resolverRef.current?.(null);
    setRequest({ kind: "prompt", options });
    setPromptValue(options.initialValue ?? "");
    return new Promise<string | null>((resolve) => {
      resolverRef.current = (value) => resolve(typeof value === "string" ? value : null);
    });
  }, []);

  React.useEffect(() => () => resolverRef.current?.(null), []);

  const value = React.useMemo(() => ({ confirm, prompt }), [confirm, prompt]);

  return (
    <ConfirmationContext.Provider value={value}>
      {children}
      {request?.kind === "confirm" && (
        <ConfirmDialog
          open
          onClose={() => settle(false)}
          onConfirm={() => settle(true)}
          {...request.options}
        />
      )}
      {request?.kind === "prompt" && (
        <PromptDialog
          open
          value={promptValue}
          onValueChange={setPromptValue}
          onClose={() => settle(null)}
          onConfirm={(nextValue) => settle(nextValue)}
          {...request.options}
        />
      )}
    </ConfirmationContext.Provider>
  );
}

export function useConfirmation() {
  const context = React.useContext(ConfirmationContext);
  if (!context) throw new Error("useConfirmation ConfirmationProvider ichida ishlatilishi kerak");
  return context;
}
