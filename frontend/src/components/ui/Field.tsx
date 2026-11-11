import type { ReactNode } from "react";

interface FieldProps {
  label: string;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}

export function Field({ label, htmlFor, required = false, error, hint, children, className = "" }: FieldProps) {
  return (
    <div className={`field ${className}`}>
      <label className="label" htmlFor={htmlFor}>
        {label}
        {required ? (
          <span className="req" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>
      {children}
      {error !== undefined && error !== "" ? (
        <p className="field-error" role="alert">
          {error}
        </p>
      ) : hint !== undefined && hint !== "" ? (
        <p className="field-hint">{hint}</p>
      ) : null}
    </div>
  );
}
