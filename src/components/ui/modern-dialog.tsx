"use client";

import React, { createContext, useContext, useMemo, useState } from "react";

type PromptOptions = {
  title?: string;
  message: string;
  defaultValue?: string;
  placeholder?: string;
};

type DialogApi = {
  alert: (message: string, title?: string) => Promise<void>;
  confirm: (message: string, title?: string) => Promise<boolean>;
  prompt: (options: PromptOptions) => Promise<string | null>;
};

type DialogState =
  | {
      kind: "alert";
      title: string;
      message: string;
      resolve: () => void;
    }
  | {
      kind: "confirm";
      title: string;
      message: string;
      resolve: (value: boolean) => void;
    }
  | {
      kind: "prompt";
      title: string;
      message: string;
      placeholder?: string;
      resolve: (value: string | null) => void;
    };

const DialogContext = createContext<DialogApi | null>(null);

export function ModernDialogProvider({ children }: { children: React.ReactNode }) {
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [promptValue, setPromptValue] = useState("");

  const api = useMemo<DialogApi>(
    () => ({
      alert: (message, title = "Informasi") =>
        new Promise<void>((resolve) => {
          setDialog({ kind: "alert", title, message, resolve });
        }),
      confirm: (message, title = "Konfirmasi") =>
        new Promise<boolean>((resolve) => {
          setDialog({ kind: "confirm", title, message, resolve });
        }),
      prompt: ({ message, title = "Input", defaultValue = "", placeholder }) =>
        new Promise<string | null>((resolve) => {
          setPromptValue(defaultValue);
          setDialog({ kind: "prompt", title, message, placeholder, resolve });
        }),
    }),
    []
  );

  return (
    <DialogContext.Provider value={api}>
      {children}

      {dialog && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-2xl">
            <h3 className="text-base font-bold text-foreground">{dialog.title}</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{dialog.message}</p>

            {dialog.kind === "prompt" && (
              <input
                value={promptValue}
                onChange={(e) => setPromptValue(e.target.value)}
                placeholder={dialog.placeholder}
                className="mt-3 h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-amber-600"
                autoFocus
              />
            )}

            <div className="mt-4 flex justify-end gap-2">
              {dialog.kind !== "alert" && (
                <button
                  type="button"
                  onClick={() => {
                    if (dialog.kind === "confirm") dialog.resolve(false);
                    if (dialog.kind === "prompt") dialog.resolve(null);
                    setDialog(null);
                    setPromptValue("");
                  }}
                  className="h-9 rounded-xl border border-border px-3 text-sm text-muted-foreground hover:bg-muted"
                >
                  Batal
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  if (dialog.kind === "alert") dialog.resolve();
                  if (dialog.kind === "confirm") dialog.resolve(true);
                  if (dialog.kind === "prompt") dialog.resolve(promptValue);
                  setDialog(null);
                  setPromptValue("");
                }}
                className="h-9 rounded-xl bg-amber-700 px-4 text-sm font-semibold text-white hover:bg-amber-600"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
}

export function useModernDialog(): DialogApi {
  const context = useContext(DialogContext);
  if (context) return context;

  // Fallback safety for unexpected usage outside provider.
  return {
    alert: async (message) => {
      console.warn("ModernDialogProvider is missing.", message);
    },
    confirm: async () => false,
    prompt: async ({ defaultValue }) => defaultValue ?? null,
  };
}
