import { useState, type FormEvent } from "react";
import { AlertTriangle, LogIn } from "lucide-react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { ApiError } from "../../api/client";
import { Button } from "../../components/ui/Button";
import { Field } from "../../components/ui/Field";

export function AdminLogin() {
  const { login, status } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const from = (location.state as { from?: string } | null)?.from ?? "/admin/dashboard";

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (email.trim() === "" || password === "") {
      setError("Enter both email and password.");
      return;
    }
    setBusy(true);
    try {
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 400)) {
        setError("Those credentials did not match an admin account.");
      } else {
        setError("Could not sign in right now. Please try again.");
      }
    } finally {
      setBusy(false);
    }
  };

  // Already signed in? Skip the form.
  if (status === "authenticated") {
    return <Navigate to={from} replace />;
  }

  return (
    <div className="login-wrap">
      <div className="aurora" aria-hidden="true" />
      <div className="login-card">
        <div className="login-logo">
          <img src="/logo.jpeg" alt="" />
          <h1 className="modal-title">Control Room</h1>
          <p className="muted" style={{ fontSize: "var(--fs-small)" }}>
            Astrix Mediyeah admin sign-in
          </p>
        </div>

        {error !== "" ? (
          <div className="login-alert" role="alert">
            <AlertTriangle size={16} aria-hidden="true" />
            <span>{error}</span>
          </div>
        ) : null}

        <form onSubmit={(event) => void onSubmit(event)} noValidate>
          <Field label="Email" htmlFor="login-email" required>
            <input
              id="login-email"
              className="input"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoFocus
            />
          </Field>
          <Field label="Password" htmlFor="login-password" required>
            <input
              id="login-password"
              className="input"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </Field>
          <Button type="submit" block size="lg" loading={busy} style={{ marginTop: "var(--space-4)" }}>
            <LogIn size={16} aria-hidden="true" /> Sign in
          </Button>
        </form>
      </div>
    </div>
  );
}
