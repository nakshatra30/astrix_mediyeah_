import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function Drawer({ open, onClose, title, children }: DrawerProps) {
  const titleId = useRef(`drawer-${Math.random().toString(36).slice(2)}`).current;

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
    <>
      <div className="drawer-overlay" onMouseDown={onClose} aria-hidden="true" />
      <aside className="drawer" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="enquiry-drawer-head">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <h2 className="modal-title" id={titleId}>
              {title}
            </h2>
            <button type="button" className="btn-icon" onClick={onClose} aria-label="Close panel" style={{ width: 36, height: 36 }}>
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
        <div className="enquiry-drawer-body">{children}</div>
      </aside>
    </>,
    document.body,
  );
}
