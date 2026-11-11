import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  large?: boolean;
}

export function Modal({ open, onClose, title, children, footer, large = false }: ModalProps) {
  const titleId = useRef(`modal-${Math.random().toString(36).slice(2)}`).current;

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className={`modal${large ? " modal-lg" : ""}`} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="modal-head">
          <h2 className="modal-title" id={titleId}>
            {title}
          </h2>
          <button type="button" className="btn-icon" onClick={onClose} aria-label="Close dialog" style={{ width: 36, height: 36 }}>
            <X size={16} aria-hidden="true" />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer !== undefined ? <div className="modal-foot">{footer}</div> : null}
      </div>
    </div>,
    document.body,
  );
}
