import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "glass" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

export function btnClasses(variant: Variant = "primary", size: Size = "md", block = false): string {
  return ["btn", `btn-${variant}`, size !== "md" ? `btn-${size}` : "", block ? "btn-block" : ""]
    .filter(Boolean)
    .join(" ");
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  block?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  block = false,
  className = "",
  children,
  disabled,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`${btnClasses(variant, size, block)} ${className}`}
      disabled={disabled === true || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? (
        <span
          className="spinner"
          style={{ width: 15, height: 15, borderWidth: 2, flexShrink: 0 }}
          aria-hidden="true"
        />
      ) : null}
      {children}
    </button>
  );
}
