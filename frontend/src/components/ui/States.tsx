import type { ReactNode } from "react";
import { AlertTriangle, Inbox, RefreshCw } from "lucide-react";
import { Button } from "./Button";

export function Spinner({ large = false }: { large?: boolean }) {
  return <div className={`spinner${large ? " spinner-lg" : ""}`} role="status" aria-label="Loading" />;
}

export function LoadingState({ label = "Loading…", padded = true }: { label?: string; padded?: boolean }) {
  return (
    <div className="state-block" style={padded ? undefined : { padding: "var(--space-5)" }}>
      <Spinner large />
      <p className="state-text">{label}</p>
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
  padded = true,
}: {
  message: string;
  onRetry?: () => void;
  padded?: boolean;
}) {
  return (
    <div className="state-block" style={padded ? undefined : { padding: "var(--space-5)" }} role="alert">
      <AlertTriangle size={36} aria-hidden="true" />
      <div>
        <p className="state-title">Something went wrong</p>
        <p className="state-text">{message}</p>
      </div>
      {onRetry !== undefined ? (
        <Button variant="glass" size="sm" onClick={onRetry}>
          <RefreshCw size={14} aria-hidden="true" /> Try again
        </Button>
      ) : null}
    </div>
  );
}

export function EmptyState({
  title,
  message,
  action,
  padded = true,
}: {
  title: string;
  message?: string;
  action?: ReactNode;
  padded?: boolean;
}) {
  return (
    <div className="state-block" style={padded ? undefined : { padding: "var(--space-5)" }}>
      <Inbox size={36} aria-hidden="true" />
      <div>
        <p className="state-title">{title}</p>
        {message !== undefined ? <p className="state-text">{message}</p> : null}
      </div>
      {action}
    </div>
  );
}
