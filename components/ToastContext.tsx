"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import Link from "next/link";

export type ToastType = "success" | "error" | "info";
export type ToastAction = { label: string; href: string };

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  action?: ToastAction;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, action?: ToastAction) => void;
  success: (message: string, action?: ToastAction) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = "info", action?: ToastAction) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, type, message, action }]);

      setTimeout(() => {
        removeToast(id);
      }, action ? 8000 : 4000);
    },
    [removeToast]
  );

  const success = useCallback(
    (msg: string, action?: ToastAction) => showToast(msg, "success", action),
    [showToast]
  );
  const error = useCallback(
    (msg: string) => showToast(msg, "error"),
    [showToast]
  );
  const info = useCallback((msg: string) => showToast(msg, "info"), [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, info }}>
      {children}
      <div className="fixed bottom-5 inset-x-4 sm:left-auto sm:right-5 z-50 flex flex-col space-y-2 sm:max-w-md sm:w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-lg border text-sm transition-all duration-300 transform translate-y-0 ${
              toast.type === "success"
                ? "bg-white border-emerald-200 text-emerald-950 shadow-emerald-500/10"
                : toast.type === "error"
                ? "bg-white border-rose-200 text-rose-950 shadow-rose-500/10"
                : "bg-white border-sky-200 text-sky-950 shadow-sky-500/10"
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {toast.type === "success" && (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              )}
              {toast.type === "error" && (
                <AlertCircle className="w-5 h-5 text-rose-600" />
              )}
              {toast.type === "info" && (
                <Info className="w-5 h-5 text-sky-600" />
              )}
            </div>
            <div className="min-w-0 flex-1 font-medium wrap-anywhere">{toast.message}
              {toast.action && <Link href={toast.action.href} prefetch={false} className="mt-2 block font-semibold text-blue-700 underline">{toast.action.label}</Link>}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-gray-400 hover:text-gray-600 p-0.5 rounded-sm transition"
              aria-label="Close toast"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};
