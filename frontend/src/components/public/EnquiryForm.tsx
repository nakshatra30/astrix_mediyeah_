import { useState, type FormEvent } from "react";
import { AlertTriangle, CheckCircle2, Send } from "lucide-react";
import { ApiError } from "../../api/client";
import type { EnquiryInput, PreferredContactMethod } from "../../api/types";
import { useServices, useSubmitEnquiry } from "../../hooks/public";
import { BUDGET_RANGES, PREFERRED_CONTACT_LABELS } from "../../utils/format";
import { Button } from "../ui/Button";
import { Field } from "../ui/Field";

interface FormState {
  name: string;
  email: string;
  phone: string;
  company: string;
  serviceId: string;
  budgetRange: string;
  preferredContactMethod: string;
  projectDescription: string;
  privacyConsent: boolean;
}

const EMPTY: FormState = {
  name: "",
  email: "",
  phone: "",
  company: "",
  serviceId: "",
  budgetRange: "",
  preferredContactMethod: "",
  projectDescription: "",
  privacyConsent: false,
};

function rateLimitMessage(): string {
  return "You have reached our enquiry limit for now. Please try again in about 15 minutes — or email us directly using the details on this page.";
}

export function EnquiryForm({ sourcePage }: { sourcePage?: string }) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [sent, setSent] = useState(false);
  const { data: services } = useServices();
  const submit = useSubmitEnquiry();

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const validate = (): boolean => {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (form.name.trim().length < 2) next.name = "Please tell us your name.";
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) next.email = "Enter a valid email address.";
    if (form.phone.trim() !== "" && !/^[+\d][\d\s-()]{6,19}$/.test(form.phone.trim()))
      next.phone = "Enter a valid phone number.";
    if (form.projectDescription.trim().length < 20)
      next.projectDescription = "Give us at least a couple of sentences about the project.";
    if (!form.privacyConsent) next.privacyConsent = "Please accept the privacy policy so we can reply.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!validate()) return;
    const input: EnquiryInput = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() === "" ? null : form.phone.trim(),
      company: form.company.trim() === "" ? null : form.company.trim(),
      serviceId: form.serviceId === "" ? null : form.serviceId,
      budgetRange: form.budgetRange === "" ? null : form.budgetRange,
      preferredContactMethod:
        form.preferredContactMethod === "" ? null : (form.preferredContactMethod as PreferredContactMethod),
      projectDescription: form.projectDescription.trim(),
      privacyConsent: true,
      sourcePage: sourcePage ?? window.location.pathname,
    };
    submit.mutate(input, {
      onSuccess: () => {
        setSent(true);
        setForm(EMPTY);
      },
    });
  };

  if (sent) {
    return (
      <div className="form-success">
        <div className="form-success-icon">
          <CheckCircle2 size={32} aria-hidden="true" />
        </div>
        <h3>Message received</h3>
        <p className="muted">
          Thanks for reaching out. A strategist will review your brief and reply within one business day.
        </p>
        <Button variant="glass" onClick={() => setSent(false)}>
          Send another message
        </Button>
      </div>
    );
  }

  const serverError =
    submit.error instanceof ApiError && submit.error.status === 429
      ? rateLimitMessage()
      : submit.error instanceof ApiError && submit.error.status === 400
        ? submit.error.message
        : submit.error !== null
          ? "Something went wrong sending your message. Please try again in a moment."
          : "";

  return (
    <form onSubmit={onSubmit} noValidate>
      <div className="form-grid">
        <Field label="Your name" htmlFor="enq-name" required error={errors.name}>
          <input
            id="enq-name"
            className="input"
            autoComplete="name"
            value={form.name}
            onChange={(event) => set("name", event.target.value)}
            aria-invalid={errors.name !== undefined}
          />
        </Field>
        <Field label="Email" htmlFor="enq-email" required error={errors.email}>
          <input
            id="enq-email"
            className="input"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={(event) => set("email", event.target.value)}
            aria-invalid={errors.email !== undefined}
          />
        </Field>
        <Field label="Phone" htmlFor="enq-phone" hint="Optional — only if you prefer a call." error={errors.phone}>
          <input
            id="enq-phone"
            className="input"
            type="tel"
            autoComplete="tel"
            value={form.phone}
            onChange={(event) => set("phone", event.target.value)}
            aria-invalid={errors.phone !== undefined}
          />
        </Field>
        <Field label="Company" htmlFor="enq-company" hint="Optional.">
          <input
            id="enq-company"
            className="input"
            autoComplete="organization"
            value={form.company}
            onChange={(event) => set("company", event.target.value)}
          />
        </Field>
        <Field label="Service" htmlFor="enq-service" hint="Pick the closest match — or leave blank.">
          <select id="enq-service" className="select" value={form.serviceId} onChange={(event) => set("serviceId", event.target.value)}>
            <option value="">Not sure yet</option>
            {(services?.data ?? []).map((service) => (
              <option value={service.id} key={service.id}>
                {service.title}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Budget range" htmlFor="enq-budget">
          <select id="enq-budget" className="select" value={form.budgetRange} onChange={(event) => set("budgetRange", event.target.value)}>
            <option value="">Prefer not to say</option>
            {BUDGET_RANGES.map((range) => (
              <option value={range} key={range}>
                {range}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Preferred contact" htmlFor="enq-contact">
          <select
            id="enq-contact"
            className="select"
            value={form.preferredContactMethod}
            onChange={(event) => set("preferredContactMethod", event.target.value)}
          >
            <option value="">Email by default</option>
            {Object.entries(PREFERRED_CONTACT_LABELS).map(([value, label]) => (
              <option value={value} key={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>
        <div className="span-2">
          <Field label="Project brief" htmlFor="enq-desc" required error={errors.projectDescription}>
            <textarea
              id="enq-desc"
              className="textarea"
              rows={5}
              value={form.projectDescription}
              onChange={(event) => set("projectDescription", event.target.value)}
              placeholder="What are you building, who is it for, and what does success look like?"
              aria-invalid={errors.projectDescription !== undefined}
            />
          </Field>
        </div>
      </div>

      <div className="field" style={{ marginTop: "var(--space-4)" }}>
        <label className="check">
          <input
            type="checkbox"
            checked={form.privacyConsent}
            onChange={(event) => set("privacyConsent", event.target.checked)}
            aria-invalid={errors.privacyConsent !== undefined}
          />
          <span>
            I agree that Astrix Media may store this brief to respond to my enquiry, as described in the privacy policy.
          </span>
        </label>
        {errors.privacyConsent !== undefined ? (
          <p className="field-error" role="alert">
            {errors.privacyConsent}
          </p>
        ) : null}
      </div>

      {serverError !== "" ? (
        <div className="login-alert" style={{ marginTop: "var(--space-4)" }} role="alert">
          <AlertTriangle size={16} aria-hidden="true" />
          <span>{serverError}</span>
        </div>
      ) : null}

      <div style={{ marginTop: "var(--space-5)", display: "flex", justifyContent: "flex-end" }}>
        <Button type="submit" size="lg" loading={submit.isPending}>
          Send enquiry <Send size={15} aria-hidden="true" />
        </Button>
      </div>
    </form>
  );
}
