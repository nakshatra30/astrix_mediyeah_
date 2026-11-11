import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "./Button";
import { Modal } from "./Modal";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      footer={
        <>
          <Button variant="ghost" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start", color: "var(--text-muted)", fontSize: "0.925rem" }}>
        <AlertTriangle size={20} style={{ color: "var(--warning)", flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
        <div>{message}</div>
      </div>
    </Modal>
  );
}
