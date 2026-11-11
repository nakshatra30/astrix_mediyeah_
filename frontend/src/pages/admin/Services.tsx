import { useState, type FormEvent } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { DivisionBadge } from "../../components/ui/Badges";
import { Field } from "../../components/ui/Field";
import { SwitchField } from "../../components/ui/Switch";
import { Modal } from "../../components/ui/Modal";
import { EmptyState, ErrorState, LoadingState } from "../../components/ui/States";
import { TagInput } from "../../components/ui/TagInput";
import { useToast } from "../../components/ui/Toast";
import { ServiceIcon, SERVICE_ICON_KEYS } from "../../components/public/ServiceIcon";
import { ApiError } from "../../api/client";
import type { Division, Service, ServiceInput } from "../../api/types";
import {
  useAdminServices,
  useCreateService,
  useDeleteService,
  useUpdateService,
} from "../../hooks/admin";
import { DIVISIONS, DIVISION_META, slugify } from "../../utils/format";

interface FormState {
  title: string;
  slug: string;
  division: Division;
  shortDescription: string;
  description: string;
  deliverables: string[];
  iconKey: string;
  displayOrder: number;
  isActive: boolean;
}

const EMPTY_FORM: FormState = {
  title: "",
  slug: "",
  division: "TECHNOLOGY",
  shortDescription: "",
  description: "",
  deliverables: [],
  iconKey: "code",
  displayOrder: 0,
  isActive: true,
};

function toInput(form: FormState): ServiceInput {
  return {
    title: form.title.trim(),
    slug: form.slug.trim(),
    division: form.division,
    shortDescription: form.shortDescription.trim() === "" ? null : form.shortDescription.trim(),
    description: form.description.trim() === "" ? null : form.description.trim(),
    deliverables: form.deliverables,
    iconKey: form.iconKey,
    displayOrder: form.displayOrder,
    isActive: form.isActive,
  };
}

export function AdminServices() {
  const [divisionFilter, setDivisionFilter] = useState<Division | undefined>(undefined);
  const [editorState, setEditorState] = useState<{ open: boolean; service: Service | null }>({ open: false, service: null });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const services = useAdminServices(divisionFilter);
  const closeEditor = () => setEditorState({ open: false, service: null });

  return (
    <>
      <div className="toolbar">
        <select
          className="select"
          value={divisionFilter ?? ""}
          onChange={(event) => setDivisionFilter(event.target.value === "" ? undefined : (event.target.value as Division))}
          aria-label="Filter by division"
        >
          <option value="">All divisions</option>
          {DIVISIONS.map((value) => (
            <option value={value} key={value}>
              {DIVISION_META[value].label}
            </option>
          ))}
        </select>
        <div style={{ marginLeft: "auto" }}>
          <Button variant="primary" onClick={() => setEditorState({ open: true, service: null })}>
            <Plus size={15} aria-hidden="true" /> New service
          </Button>
        </div>
      </div>

      {services.isError ? (
        <ErrorState message="Could not load services." onRetry={() => void services.refetch()} />
      ) : services.isLoading ? (
        <LoadingState padded={false} />
      ) : services.data !== undefined && services.data.data.length === 0 ? (
        <EmptyState
          title="No services yet"
          message="Services power the public Services page and the enquiry form dropdown."
          action={
            <Button variant="glass" size="sm" onClick={() => setEditorState({ open: true, service: null })}>
              <Plus size={14} aria-hidden="true" /> New service
            </Button>
          }
        />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Service</th>
                <th>Division</th>
                <th>Deliverables</th>
                <th>Order</th>
                <th>Status</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {(services.data?.data ?? []).map((service) => (
                <tr key={service.id}>
                  <td>
                    <div className="cover-cell">
                      <div className="cover-thumb" style={{ display: "grid", placeItems: "center", color: "var(--text-faint)" }} aria-hidden="true">
                        <ServiceIcon iconKey={service.iconKey} size={18} />
                      </div>
                      <div>
                        <p className="cell-title">{service.title}</p>
                        <p className="cell-sub">{service.shortDescription ?? service.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td data-label="Division">
                    <DivisionBadge division={service.division} />
                  </td>
                  <td data-label="Deliverables">{service.deliverables.length}</td>
                  <td data-label="Order">{service.displayOrder}</td>
                  <td data-label="Status">
                    {service.isActive ? (
                      <span className="badge badge-green">Active</span>
                    ) : (
                      <span className="badge badge-neutral">Hidden</span>
                    )}
                  </td>
                  <td>
                    <div className="row-actions">
                      <button
                        type="button"
                        className="row-action"
                        aria-label={`Edit ${service.title}`}
                        onClick={() => setEditorState({ open: true, service })}
                      >
                        <Pencil aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className="row-action danger"
                        aria-label={`Delete ${service.title}`}
                        onClick={() => setDeleteId(service.id)}
                      >
                        <Trash2 aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ServiceEditor key={editorState.service?.id ?? "new"} state={editorState} onClose={closeEditor} />

      <DeleteDialog deleteId={deleteId} services={services.data?.data ?? []} onClose={() => setDeleteId(null)} />
    </>
  );
}

function ServiceEditor({ state, onClose }: { state: { open: boolean; service: Service | null }; onClose: () => void }) {
  const toast = useToast();
  const create = useCreateService();
  const update = useUpdateService();
  const isEdit = state.service !== null;

  const [form, setForm] = useState<FormState>(() =>
    state.service !== null
      ? {
          title: state.service.title,
          slug: state.service.slug,
          division: state.service.division,
          shortDescription: state.service.shortDescription ?? "",
          description: state.service.description ?? "",
          deliverables: state.service.deliverables,
          iconKey: state.service.iconKey ?? "code",
          displayOrder: state.service.displayOrder,
          isActive: state.service.isActive,
        }
      : EMPTY_FORM,
  );
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [error, setError] = useState<string | undefined>(undefined);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setError(undefined);
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (form.title.trim().length < 2) {
      setError("Title is required.");
      return;
    }
    const input = toInput(form);
    const onError = (err: Error) => {
      const message =
        err instanceof ApiError
          ? `${err.message}${err.status === 409 ? " — slug already in use?" : ""}`
          : "Could not save the service.";
      toast.error(message);
    };
    if (state.service === null) {
      create.mutate(input, {
        onSuccess: () => {
          toast.success("Service created.");
          onClose();
        },
        onError,
      });
    } else {
      update.mutate(
        { id: state.service.id, input },
        {
          onSuccess: () => {
            toast.success("Service saved.");
            onClose();
          },
          onError,
        },
      );
    }
  };

  const saving = create.isPending || update.isPending;

  return (
    <Modal
      open={state.open}
      onClose={onClose}
      title={isEdit ? `Edit — ${state.service?.title ?? "service"}` : "New service"}
      large
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="service-form" loading={saving}>
            {isEdit ? "Save changes" : "Create service"}
          </Button>
        </>
      }
    >
      <form id="service-form" onSubmit={onSubmit} noValidate>
        <div className="form-grid">
          <Field label="Title" htmlFor="s-title" required error={error}>
            <input
              id="s-title"
              className="input"
              value={form.title}
              onChange={(event) => {
                set("title", event.target.value);
                if (!slugTouched && !isEdit) set("slug", slugify(event.target.value));
              }}
            />
          </Field>
          <Field label="Slug" htmlFor="s-slug" required hint="URL segment, e.g. brand-films">
            <input
              id="s-slug"
              className="input"
              value={form.slug}
              onChange={(event) => {
                setSlugTouched(true);
                set("slug", slugify(event.target.value));
              }}
            />
          </Field>
          <Field label="Division" htmlFor="s-division">
            <select id="s-division" className="select" value={form.division} onChange={(event) => set("division", event.target.value as Division)}>
              {DIVISIONS.map((value) => (
                <option value={value} key={value}>
                  {DIVISION_META[value].label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Icon" htmlFor="s-icon" hint="Shown on service cards.">
            <div className="cover-cell">
              <div
                className="cover-thumb"
                style={{ display: "grid", placeItems: "center", color: "var(--text-faint)" }}
                aria-hidden="true"
              >
                <ServiceIcon iconKey={form.iconKey} size={16} />
              </div>
              <select id="s-icon" className="select" value={form.iconKey} onChange={(event) => set("iconKey", event.target.value)}>
                {SERVICE_ICON_KEYS.map((key) => (
                  <option value={key} key={key}>
                    {key}
                  </option>
                ))}
              </select>
            </div>
          </Field>
          <div className="span-2">
            <Field label="Short description" htmlFor="s-short" hint="One line for cards and lists.">
              <input id="s-short" className="input" value={form.shortDescription} onChange={(event) => set("shortDescription", event.target.value)} />
            </Field>
          </div>
          <div className="span-2">
            <Field label="Full description" htmlFor="s-desc" hint="Shown on the service detail page. Basic HTML allowed.">
              <textarea id="s-desc" className="textarea" rows={6} value={form.description} onChange={(event) => set("description", event.target.value)} />
            </Field>
          </div>
          <div className="span-2">
            <Field label="Deliverables" htmlFor="s-deliv" hint="Bullet points on the detail page. Enter to add each.">
              <TagInput
                id="s-deliv"
                value={form.deliverables}
                onChange={(value) => set("deliverables", value)}
                placeholder="Landing page, CMS setup…"
              />
            </Field>
          </div>
          <Field label="Display order" htmlFor="s-order" hint="Lower numbers show first.">
            <input
              id="s-order"
              className="input"
              type="number"
              min={0}
              value={form.displayOrder}
              onChange={(event) => set("displayOrder", Number(event.target.value))}
            />
          </Field>
          <SwitchField
            id="s-active"
            legend="Visibility"
            label="Show publicly"
            checked={form.isActive}
            onChange={(checked) => set("isActive", checked)}
          />
        </div>
      </form>
    </Modal>
  );
}

function DeleteDialog({ deleteId, services, onClose }: { deleteId: string | null; services: Service[]; onClose: () => void }) {
  const toast = useToast();
  const remove = useDeleteService();
  const service = services.find((candidate) => candidate.id === deleteId) ?? null;

  return (
    <ConfirmDialog
      open={deleteId !== null && service !== null}
      title="Delete service"
      message={
        <>
          Delete <strong>{service?.title}</strong>? Services referenced by past enquiries are kept for record integrity —
          the backend will refuse it.
        </>
      }
      confirmLabel="Delete service"
      loading={remove.isPending}
      onCancel={onClose}
      onConfirm={() => {
        if (deleteId === null) return;
        remove.mutate(deleteId, {
          onSuccess: () => {
            toast.success("Service deleted.");
            onClose();
          },
          onError: (error) => toast.error(error instanceof ApiError ? error.message : "Could not delete the service."),
        });
      }}
    />
  );
}
