import { useState } from "react";
import { RotateCcw, Save } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Field } from "../../components/ui/Field";
import { LoadingState } from "../../components/ui/States";
import { useToast } from "../../components/ui/Toast";
import { ApiError } from "../../api/client";
import type { SiteSettings, SettingsInput } from "../../api/types";
import { useAdminSettings, useUpdateSettings } from "../../hooks/admin";
import { formatDateTime } from "../../utils/format";

type FormState = Record<keyof SettingsInput, string>;

const FIELDS: Array<{ key: keyof SettingsInput; label: string; hint?: string; textarea?: boolean; rows?: number }> = [
  { key: "agencyName", label: "Agency name" },
  { key: "tagline", label: "Tagline", hint: "Short line under the logo." },
  { key: "heroTitle", label: "Hero title", hint: "Home page headline." },
  { key: "heroSubtitle", label: "Hero subtitle" },
  { key: "aboutIntro", label: "About intro", textarea: true, rows: 4, hint: "Opening paragraph on the About page." },
  { key: "contactEmail", label: "Contact email" },
  { key: "contactPhone", label: "Contact phone" },
  { key: "whatsappNumber", label: "WhatsApp number", hint: "Digits only, with country code." },
  { key: "address", label: "Address", textarea: true, rows: 3 },
  { key: "socialInstagram", label: "Instagram URL" },
  { key: "socialLinkedIn", label: "LinkedIn URL" },
  { key: "socialX", label: "X (Twitter) URL" },
  { key: "socialFacebook", label: "Facebook URL" },
  { key: "socialYoutube", label: "YouTube URL" },
  { key: "footerText", label: "Footer text", textarea: true, rows: 3 },
  { key: "seoTitle", label: "SEO title", hint: "Browser tab / search result title." },
  { key: "seoDescription", label: "SEO description", textarea: true, rows: 3 },
];

const GROUPS: Array<{ title: string; keys: Array<keyof SettingsInput> }> = [
  { title: "Agency identity", keys: ["agencyName", "tagline", "heroTitle", "heroSubtitle", "aboutIntro"] },
  { title: "Contact details", keys: ["contactEmail", "contactPhone", "whatsappNumber", "address"] },
  { title: "Social links", keys: ["socialInstagram", "socialLinkedIn", "socialX", "socialFacebook", "socialYoutube"] },
  { title: "Footer & SEO", keys: ["footerText", "seoTitle", "seoDescription"] },
];

function toForm(settings: SiteSettings): FormState {
  const form = {} as FormState;
  for (const field of FIELDS) {
    form[field.key] = settings[field.key] ?? "";
  }
  return form;
}

function toInput(form: FormState): SettingsInput {
  const input: SettingsInput = {};
  for (const field of FIELDS) {
    input[field.key] = form[field.key].trim() === "" ? null : form[field.key].trim();
  }
  return input;
}

export function AdminSettings() {
  const settings = useAdminSettings();
  const update = useUpdateSettings();
  const toast = useToast();

  const [form, setForm] = useState<FormState | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  if (settings.isLoading) {
    return <LoadingState label="Loading settings…" />;
  }
  if (settings.isError) {
    return (
      <div className="state-block" role="alert">
        <p className="state-title">Could not load settings</p>
        <Button variant="glass" size="sm" onClick={() => void settings.refetch()}>
          Try again
        </Button>
      </div>
    );
  }
  if (settings.data === undefined) return null;

  const current = form ?? toForm(settings.data);

  const dirty = JSON.stringify(current) !== JSON.stringify(toForm(settings.data));

  const set = (key: keyof SettingsInput, value: string) => {
    setForm({ ...current, [key]: value });
  };

  const onSave = () => {
    update.mutate(toInput(current), {
      onSuccess: (data) => {
        setForm(null);
        setSavedAt(data.updatedAt);
        toast.success("Settings saved.");
      },
      onError: (error) => toast.error(error instanceof ApiError ? error.message : "Could not save settings."),
    });
  };

  const onReset = () => setForm(null);

  return (
    <>
      <div className="settings-grid">
        {GROUPS.map((group) => (
          <section className="settings-card" key={group.title} aria-label={group.title}>
            <h2 className="settings-card-title">{group.title}</h2>
            <div className="form-grid">
              {group.keys.map((key) => {
                const field = FIELDS.find((candidate) => candidate.key === key)!;
                const id = `set-${key}`;
                return field.textarea === true ? (
                  <div className="span-2" key={key}>
                    <Field label={field.label} htmlFor={id} hint={field.hint}>
                      <textarea
                        id={id}
                        className="textarea"
                        rows={field.rows ?? 3}
                        value={current[key]}
                        onChange={(event) => set(key, event.target.value)}
                      />
                    </Field>
                  </div>
                ) : (
                  <Field label={field.label} htmlFor={id} hint={field.hint} key={key}>
                    <input id={id} className="input" value={current[key]} onChange={(event) => set(key, event.target.value)} />
                  </Field>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <div className="settings-sticky-bar">
        <p className="muted" style={{ fontSize: "var(--fs-small)" }}>
          {dirty ? "You have unsaved changes." : savedAt !== null ? `Saved ${formatDateTime(savedAt)}.` : `Last saved ${formatDateTime(settings.data.updatedAt)}.`}
        </p>
        <div style={{ display: "flex", gap: "var(--space-2)" }}>
          <Button variant="ghost" onClick={onReset} disabled={!dirty || update.isPending}>
            <RotateCcw size={14} aria-hidden="true" /> Discard
          </Button>
          <Button variant="primary" onClick={onSave} loading={update.isPending} disabled={!dirty}>
            <Save size={15} aria-hidden="true" /> Save changes
          </Button>
        </div>
      </div>
    </>
  );
}
