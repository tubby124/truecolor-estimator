"use client";

import { useEffect, useState } from "react";

export type ToastType = "success" | "error" | "info";

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onDismiss?: () => void;
  action?: { label: string; onClick: () => void };
}

const TYPE_STYLES: Record<ToastType, string> = {
  success: "bg-green-600 text-white",
  error: "bg-red-600 text-white",
  info: "bg-[#16C2F3] text-white",
};

const TYPE_ICONS: Record<ToastType, string> = {
  success: "✓",
  error: "✕",
  info: "ℹ",
};

/** Individual toast notification — self-dismissing */
export function Toast({
  message,
  type = "success",
  duration = 3500,
  onDismiss,
  action,
}: ToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDismiss?.(), 300); // allow fade-out
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onDismiss]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium
        transition-all duration-300 ${TYPE_STYLES[type]}
        ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}
    >
      <span aria-hidden="true">{TYPE_ICONS[type]}</span>
      <span>{message}</span>
      {action && (
        <button
          onClick={() => {
            action.onClick();
            setVisible(false);
            setTimeout(() => onDismiss?.(), 300);
          }}
          className="ml-2 font-bold underline opacity-90 hover:opacity-100 transition-opacity"
        >
          {action.label}
        </button>
      )}
      <button
        onClick={() => { setVisible(false); setTimeout(() => onDismiss?.(), 300); }}
        className="ml-2 opacity-70 hover:opacity-100 transition-opacity"
        aria-label="Dismiss notification"
      >
        ✕
      </button>
    </div>
  );
}

/** Toast container — place in layout or page root */
export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  action?: { label: string; onClick: () => void };
}

interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;
  return (
    <div
      className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          action={toast.action}
          onDismiss={() => onDismiss(toast.id)}
        />
      ))}
    </div>
  );
}

/**
 * Hook for managing toasts.
 * 
 * Usage:
 *   const { toasts, showToast, dismissToast } = useToast();
 *   showToast("Quote sent to customer!", "success");
 *   return <ToastContainer toasts={toasts} onDismiss={dismissToast} />;
 */
export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = (message: string, type: ToastType = "success", action?: { label: string; onClick: () => void }) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type, action }]);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return { toasts, showToast, dismissToast };
}
