import { useState, type FormEvent } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { DivisionBadge } from "../../components/ui/Badges";
import { Field } from "../../components/ui/Field";
import { SwitchField } from "../../components/ui/Switch";
import { Modal } from "../../components/ui/Modal";
import { EmptyState, ErrorState, LoadingState } from "../../components/ui/States";
import { useToast } from "../../components/ui/Toast";
import { ApiError } from "../../api/client";
import type { Category, CategoryInput, Division } from "../../api/types";
import {
  useAdminCategories,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from "../../hooks/admin";
import { DIVISIONS, DIVISION_META, slugify } from "../../utils/format";

interface FormState {
  name: string;
  slug: string;
  division: Division;
  description: string;
  displayOrder: number;
  isActive: boolean;
}

const EMPTY_FORM: FormState = {
  name: "",
  slug: "",
  division: "TECHNOLOGY",
  description: "",
  displayOrder: 0,
  isActive: true,
};

function toInput(form: FormState): CategoryInput {
  return {
    name: form.name.trim(),
    slug: form.slug.trim(),
    division: form.division,
    description: form.description.trim() === "" ? null : form.description.trim(),
    displayOrder: form.displayOrder,
    isActive: form.isActive,
  };
}

export function AdminCategories() {
  const [divisionFilter, setDivisionFilter] = useState<Division | undefined>(undefined);
  const [editorState, setEditorState] = useState<{ open: boolean; category: Category | null }>({ open: false, category: null });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const categories = useAdminCategories(divisionFilter);
  const allForDelete = useAdminCategories();

  const closeEditor = () => setEditorState({ open: false, category: null });

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
          <Button variant="primary" onClick={() => setEditorState({ open: true, category: null })}>
            <Plus size={15} aria-hidden="true" /> New category
          </Button>
        </div>
      </div>

      {categories.isError ? (
        <ErrorState message="Could not load categories." onRetry={() => void categories.refetch()} />
      ) : categories.isLoading ? (
        <LoadingState padded={false} />
      ) : categories.data !== undefined && categories.data.data.length === 0 ? (
        <EmptyState
          title="No categories yet"
          message="Categories group portfolio projects by discipline."
          action={
            <Button variant="glass" size="sm" onClick={() => setEditorState({ open: true, category: null })}>
              <Plus size={14} aria-hidden="true" /> New category
            </Button>
          }
        />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Division</th>
                <th>Order</th>
                <th>Status</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {(categories.data?.data ?? []).map((category) => (
                <tr key={category.id}>
                  <td>
                    <p className="cell-title">{category.name}</p>
                    <p className="cell-sub">{category.description ?? category.slug}</p>
                  </td>
                  <td data-label="Division">
                    <DivisionBadge division={category.division} />
                  </td>
                  <td data-label="Order">{category.displayOrder}</td>
                  <td data-label="Status">
                    {category.isActive ? (
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
                        aria-label={`Edit ${category.name}`}
                        onClick={() => setEditorState({ open: true, category })}
                      >
                        <Pencil aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className="row-action danger"
                        aria-label={`Delete ${category.name}`}
                        onClick={() => setDeleteId(category.id)}
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

      <CategoryEditor key={editorState.category?.id ?? "new"} state={editorState} onClose={closeEditor} />

      <DeleteDialog
        deleteId={deleteId}
        categories={allForDelete.data?.data ?? []}
        onClose={() => setDeleteId(null)}
      />
    </>
  );
}

function CategoryEditor({ state, onClose }: { state: { open: boolean; category: Category | null }; onClose: () => void }) {
  const toast = useToast();
  const create = useCreateCategory();
  const update = useUpdateCategory();
  const isEdit = state.category !== null;

  const [form, setForm] = useState<FormState>(() =>
    state.category !== null
      ? {
          name: state.category.name,
          slug: state.category.slug,
          division: state.category.division,
          description: state.category.description ?? "",
          displayOrder: state.category.displayOrder,
          isActive: state.category.isActive,
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
    if (form.name.trim().length < 2) {
      setError("Name is required.");
      return;
    }
    const input = toInput(form);
    const onError = (err: Error) => {
      const message =
        err instanceof ApiError
          ? `${err.message}${err.status === 409 ? " — slug already in use?" : ""}`
          : "Could not save the category.";
      toast.error(message);
    };
    if (state.category === null) {
      create.mutate(input, {
        onSuccess: () => {
          toast.success("Category created.");
          onClose();
        },
        onError,
      });
    } else {
      update.mutate(
        { id: state.category.id, input },
        {
          onSuccess: () => {
            toast.success("Category saved.");
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
      title={isEdit ? `Edit — ${state.category?.name ?? "category"}` : "New category"}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="category-form" loading={saving}>
            {isEdit ? "Save changes" : "Create category"}
          </Button>
        </>
      }
    >
      <form id="category-form" onSubmit={onSubmit} noValidate>
        <div className="form-grid">
          <Field label="Name" htmlFor="c-name" required error={error}>
            <input
              id="c-name"
              className="input"
              value={form.name}
              onChange={(event) => {
                set("name", event.target.value);
                if (!slugTouched && !isEdit) set("slug", slugify(event.target.value));
              }}
            />
          </Field>
          <Field label="Slug" htmlFor="c-slug" required hint="URL segment, e.g. web-development">
            <input
              id="c-slug"
              className="input"
              value={form.slug}
              onChange={(event) => {
                setSlugTouched(true);
                set("slug", slugify(event.target.value));
              }}
            />
          </Field>
          <Field label="Division" htmlFor="c-division">
            <select id="c-division" className="select" value={form.division} onChange={(event) => set("division", event.target.value as Division)}>
              {DIVISIONS.map((value) => (
                <option value={value} key={value}>
                  {DIVISION_META[value].label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Display order" htmlFor="c-order" hint="Lower numbers show first.">
            <input
              id="c-order"
              className="input"
              type="number"
              min={0}
              value={form.displayOrder}
              onChange={(event) => set("displayOrder", Number(event.target.value))}
            />
          </Field>
          <div className="span-2">
            <Field label="Description" htmlFor="c-desc">
              <textarea id="c-desc" className="textarea" rows={3} value={form.description} onChange={(event) => set("description", event.target.value)} />
            </Field>
          </div>
          <SwitchField
            id="c-active"
            legend="Visibility"
            label="Show in public filters"
            checked={form.isActive}
            onChange={(checked) => set("isActive", checked)}
          />
        </div>
      </form>
    </Modal>
  );
}

function DeleteDialog({
  deleteId,
  categories,
  onClose,
}: {
  deleteId: string | null;
  categories: Category[];
  onClose: () => void;
}) {
  const toast = useToast();
  const remove = useDeleteCategory();
  const category = categories.find((candidate) => candidate.id === deleteId) ?? null;

  return (
    <ConfirmDialog
      open={deleteId !== null && category !== null}
      title="Delete category"
      message={
        <>
          Delete <strong>{category?.name}</strong>? Categories in use by projects cannot be deleted — the backend will
          refuse it.
        </>
      }
      confirmLabel="Delete category"
      loading={remove.isPending}
      onCancel={onClose}
      onConfirm={() => {
        if (deleteId === null) return;
        remove.mutate(deleteId, {
          onSuccess: () => {
            toast.success("Category deleted.");
            onClose();
          },
          onError: (error) => toast.error(error instanceof ApiError ? error.message : "Could not delete the category."),
        });
      }}
    />
  );
}
