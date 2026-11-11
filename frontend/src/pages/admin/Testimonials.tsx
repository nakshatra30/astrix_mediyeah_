import { useState, type FormEvent } from "react";
import { Pencil, Plus, Star, Trash2 } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { Field } from "../../components/ui/Field";
import { SwitchField } from "../../components/ui/Switch";
import { Modal } from "../../components/ui/Modal";
import { EmptyState, ErrorState, LoadingState } from "../../components/ui/States";
import { useToast } from "../../components/ui/Toast";
import { ApiError } from "../../api/client";
import type { Testimonial, TestimonialInput } from "../../api/types";
import {
  useAdminTestimonials,
  useCreateTestimonial,
  useDeleteTestimonial,
  useUpdateTestimonial,
} from "../../hooks/admin";

interface FormState {
  clientName: string;
  designation: string;
  companyName: string;
  quote: string;
  rating: number;
  displayOrder: number;
  isPublished: boolean;
}

const EMPTY_FORM: FormState = {
  clientName: "",
  designation: "",
  companyName: "",
  quote: "",
  rating: 5,
  displayOrder: 0,
  isPublished: true,
};

function toInput(form: FormState): TestimonialInput {
  return {
    clientName: form.clientName.trim(),
    designation: form.designation.trim() === "" ? null : form.designation.trim(),
    companyName: form.companyName.trim() === "" ? null : form.companyName.trim(),
    quote: form.quote.trim(),
    rating: form.rating,
    displayOrder: form.displayOrder,
    isPublished: form.isPublished,
  };
}

function Stars({ rating }: { rating: number }) {
  return (
    <span style={{ display: "inline-flex", gap: 2 }} aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          key={index}
          size={13}
          aria-hidden="true"
          fill={index < rating ? "currentColor" : "none"}
          style={{ color: index < rating ? "var(--warning)" : "var(--text-faint)" }}
        />
      ))}
    </span>
  );
}

export function AdminTestimonials() {
  const testimonials = useAdminTestimonials();
  const [editorState, setEditorState] = useState<{ open: boolean; testimonial: Testimonial | null }>({
    open: false,
    testimonial: null,
  });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const closeEditor = () => setEditorState({ open: false, testimonial: null });

  return (
    <>
      <div className="toolbar">
        <p className="muted" style={{ fontSize: "var(--fs-small)", marginInlineEnd: "auto" }}>
          Published testimonials appear on the home page in display order.
        </p>
        <Button variant="primary" onClick={() => setEditorState({ open: true, testimonial: null })}>
          <Plus size={15} aria-hidden="true" /> New testimonial
        </Button>
      </div>

      {testimonials.isError ? (
        <ErrorState message="Could not load testimonials." onRetry={() => void testimonials.refetch()} />
      ) : testimonials.isLoading ? (
        <LoadingState padded={false} />
      ) : testimonials.data !== undefined && testimonials.data.data.length === 0 ? (
        <EmptyState
          title="No testimonials yet"
          message="Client quotes build trust on the home page."
          action={
            <Button variant="glass" size="sm" onClick={() => setEditorState({ open: true, testimonial: null })}>
              <Plus size={14} aria-hidden="true" /> New testimonial
            </Button>
          }
        />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Quote</th>
                <th>Rating</th>
                <th>Order</th>
                <th>Status</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {(testimonials.data?.data ?? []).map((testimonial) => (
                <tr key={testimonial.id}>
                  <td>
                    <p className="cell-title">{testimonial.clientName}</p>
                    <p className="cell-sub">
                      {[testimonial.designation, testimonial.companyName].filter((part) => part !== null && part !== "").join(" · ") || "—"}
                    </p>
                  </td>
                  <td data-label="Quote" style={{ maxWidth: "34ch" }}>
                    <p className="cell-sub" style={{ whiteSpace: "normal" }}>
                      {testimonial.quote.length > 90 ? `${testimonial.quote.slice(0, 90)}…` : testimonial.quote}
                    </p>
                  </td>
                  <td data-label="Rating">
                    <Stars rating={testimonial.rating} />
                  </td>
                  <td data-label="Order">{testimonial.displayOrder}</td>
                  <td data-label="Status">
                    {testimonial.isPublished ? (
                      <span className="badge badge-green">Published</span>
                    ) : (
                      <span className="badge badge-neutral">Hidden</span>
                    )}
                  </td>
                  <td>
                    <div className="row-actions">
                      <button
                        type="button"
                        className="row-action"
                        aria-label={`Edit testimonial from ${testimonial.clientName}`}
                        onClick={() => setEditorState({ open: true, testimonial })}
                      >
                        <Pencil aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className="row-action danger"
                        aria-label={`Delete testimonial from ${testimonial.clientName}`}
                        onClick={() => setDeleteId(testimonial.id)}
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

      <TestimonialEditor key={editorState.testimonial?.id ?? "new"} state={editorState} onClose={closeEditor} />

      <DeleteDialog
        deleteId={deleteId}
        testimonials={testimonials.data?.data ?? []}
        onClose={() => setDeleteId(null)}
      />
    </>
  );
}

function TestimonialEditor({
  state,
  onClose,
}: {
  state: { open: boolean; testimonial: Testimonial | null };
  onClose: () => void;
}) {
  const toast = useToast();
  const create = useCreateTestimonial();
  const update = useUpdateTestimonial();
  const isEdit = state.testimonial !== null;

  const [form, setForm] = useState<FormState>(() =>
    state.testimonial !== null
      ? {
          clientName: state.testimonial.clientName,
          designation: state.testimonial.designation ?? "",
          companyName: state.testimonial.companyName ?? "",
          quote: state.testimonial.quote,
          rating: state.testimonial.rating,
          displayOrder: state.testimonial.displayOrder,
          isPublished: state.testimonial.isPublished,
        }
      : EMPTY_FORM,
  );
  const [error, setError] = useState<string | undefined>(undefined);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setError(undefined);
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (form.clientName.trim().length < 2) {
      setError("Client name is required.");
      return;
    }
    if (form.quote.trim().length < 10) {
      setError("The quote needs at least a short sentence.");
      return;
    }
    const input = toInput(form);
    const onError = (err: Error) => toast.error(err instanceof ApiError ? err.message : "Could not save the testimonial.");

    if (state.testimonial === null) {
      create.mutate(input, {
        onSuccess: () => {
          toast.success("Testimonial created.");
          onClose();
        },
        onError,
      });
    } else {
      update.mutate(
        { id: state.testimonial.id, input },
        {
          onSuccess: () => {
            toast.success("Testimonial saved.");
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
      title={isEdit ? `Edit — ${state.testimonial?.clientName ?? "testimonial"}` : "New testimonial"}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="testimonial-form" loading={saving}>
            {isEdit ? "Save changes" : "Create testimonial"}
          </Button>
        </>
      }
    >
      <form id="testimonial-form" onSubmit={onSubmit} noValidate>
        <div className="form-grid">
          <Field label="Client name" htmlFor="t-name" required error={error}>
            <input id="t-name" className="input" value={form.clientName} onChange={(event) => set("clientName", event.target.value)} />
          </Field>
          <Field label="Designation" htmlFor="t-role" hint="e.g. Founder">
            <input id="t-role" className="input" value={form.designation} onChange={(event) => set("designation", event.target.value)} />
          </Field>
          <Field label="Company" htmlFor="t-company">
            <input id="t-company" className="input" value={form.companyName} onChange={(event) => set("companyName", event.target.value)} />
          </Field>
          <Field label="Rating" htmlFor="t-rating">
            <select id="t-rating" className="select" value={form.rating} onChange={(event) => set("rating", Number(event.target.value))}>
              {[5, 4, 3, 2, 1].map((value) => (
                <option value={value} key={value}>
                  {value} star{value === 1 ? "" : "s"}
                </option>
              ))}
            </select>
          </Field>
          <div className="span-2">
            <Field label="Quote" htmlFor="t-quote" required>
              <textarea id="t-quote" className="textarea" rows={5} value={form.quote} onChange={(event) => set("quote", event.target.value)} />
            </Field>
          </div>
          <Field label="Display order" htmlFor="t-order" hint="Lower numbers show first.">
            <input
              id="t-order"
              className="input"
              type="number"
              min={0}
              value={form.displayOrder}
              onChange={(event) => set("displayOrder", Number(event.target.value))}
            />
          </Field>
          <SwitchField
            id="t-published"
            legend="Visibility"
            label="Show on home page"
            checked={form.isPublished}
            onChange={(checked) => set("isPublished", checked)}
          />
        </div>
      </form>
    </Modal>
  );
}

function DeleteDialog({
  deleteId,
  testimonials,
  onClose,
}: {
  deleteId: string | null;
  testimonials: Testimonial[];
  onClose: () => void;
}) {
  const toast = useToast();
  const remove = useDeleteTestimonial();
  const testimonial = testimonials.find((candidate) => candidate.id === deleteId) ?? null;

  return (
    <ConfirmDialog
      open={deleteId !== null && testimonial !== null}
      title="Delete testimonial"
      message={
        <>
          Delete the quote from <strong>{testimonial?.clientName}</strong>? This cannot be undone.
        </>
      }
      confirmLabel="Delete testimonial"
      loading={remove.isPending}
      onCancel={onClose}
      onConfirm={() => {
        if (deleteId === null) return;
        remove.mutate(deleteId, {
          onSuccess: () => {
            toast.success("Testimonial deleted.");
            onClose();
          },
          onError: (error) => toast.error(error instanceof ApiError ? error.message : "Could not delete the testimonial."),
        });
      }}
    />
  );
}