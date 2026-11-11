import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, XCircle } from "lucide-react";

interface Toast {
  id: number;
  kind: "success" | "error";
  message: string;
}

interface ToastContextValue {
  push: (kind: Toast["kind"], message: string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const push = useCallback((kind: Toast["kind"], message: string) => {
    const id = nextId.current++;
    setToasts((current) => [...current, { id, kind, message }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 4200);
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({
      push,
      success: (message: string) => push("success", message),
      error: (message: string) => push("error", message),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div className="toast-region" aria-live="polite">
          {toasts.map((toast) => (
            <div key={toast.id} className={`toast toast-${toast.kind}`}>
              {toast.kind === "success" ? (
                <CheckCircle2 size={17} className="toast-icon" aria-hidden="true" />
              ) : (
                <XCircle size={17} className="toast-icon" aria-hidden="true" />
              )}
              <span>{toast.message}</span>
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (ctx === null) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
