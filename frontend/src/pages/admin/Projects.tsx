import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Archive, Pencil, Plus, Star } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { Field } from "../../components/ui/Field";
import { SwitchField } from "../../components/ui/Switch";
import { Modal } from "../../components/ui/Modal";
import { Pagination } from "../../components/ui/Pagination";
import { StatusBadge } from "../../components/ui/Badges";
import { EmptyState, ErrorState, LoadingState } from "../../components/ui/States";
import { TagInput } from "../../components/ui/TagInput";
import { useToast } from "../../components/ui/Toast";
import { ApiError } from "../../api/client";
import type { Category, Division, ProjectDetail, ProjectInput, ProjectStatus } from "../../api/types";
import {
  useAdminCategories,
  useAdminProject,
  useAdminProjects,
  useArchiveProject,
  useCreateProject,
  useUpdateProject,
} from "../../hooks/admin";
import { DIVISIONS, DIVISION_META, PROJECT_STATUSES, PROJECT_STATUS_META, formatDate, slugify } from "../../utils/format";
import { coverBackground } from "../../utils/cover";

interface FormState {
  title: string;
  slug: string;
  division: Division;
  categoryId: string;
  shortDescription: string;
  fullDescription: string;
  challenge: string;
  solution: string;
  process: string;
  technologies: string[];
  projectUrl: string;
  repositoryUrl: string;
  isFeatured: boolean;
  status: ProjectStatus;
}

const EMPTY_FORM: FormState = {
  title: "",
  slug: "",
  division: "TECHNOLOGY",
  categoryId: "",
  shortDescription: "",
  fullDescription: "",
  challenge: "",
  solution: "",
  process: "",
  technologies: [],
  projectUrl: "",
  repositoryUrl: "",
  isFeatured: false,
  status: "DRAFT",
};

function toForm(project: ProjectDetail): FormState {
  return {
    title: project.title,
    slug: project.slug,
    division: project.division,
    categoryId: project.categoryId ?? "",
    shortDescription: project.shortDescription ?? "",
    fullDescription: project.fullDescription ?? "",
    challenge: project.challenge ?? "",
    solution: project.solution ?? "",
    process: project.process ?? "",
    technologies: project.technologies,
    projectUrl: project.projectUrl ?? "",
    repositoryUrl: project.repositoryUrl ?? "",
    isFeatured: project.isFeatured,
    status: project.status,
  };
}

function toInput(form: FormState): ProjectInput {
  return {
    title: form.title.trim(),
    slug: form.slug.trim(),
    division: form.division,
    categoryId: form.categoryId === "" ? null : form.categoryId,
    shortDescription: form.shortDescription.trim() === "" ? null : form.shortDescription.trim(),
    fullDescription: form.fullDescription.trim() === "" ? null : form.fullDescription.trim(),
    challenge: form.challenge.trim() === "" ? null : form.challenge.trim(),
    solution: form.solution.trim() === "" ? null : form.solution.trim(),
    process: form.process.trim() === "" ? null : form.process.trim(),
    technologies: form.technologies,
    projectUrl: form.projectUrl.trim() === "" ? null : form.projectUrl.trim(),
    repositoryUrl: form.repositoryUrl.trim() === "" ? null : form.repositoryUrl.trim(),
    isFeatured: form.isFeatured,
    status: form.status,
  };
}

const RICH_HINT = "Basic HTML allowed — <p>, <strong>, <em>, <ul>, <li>. Sanitised on save.";

export function AdminProjects() {
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | undefined>(undefined);
  const [divisionFilter, setDivisionFilter] = useState<Division | undefined>(undefined);
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [page, setPage] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null); // null = closed, "" = create
  const [archiveId, setArchiveId] = useState<string | null>(null);

  const projects = useAdminProjects({ status: statusFilter, division: divisionFilter, sort, page });
  const categories = useAdminCategories();

  const openEditor = (id: string | null) => setEditingId(id);
  const closeEditor = () => setEditingId(null);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, divisionFilter, sort]);

  return (
    <>
      <div className="toolbar">
        <select
          className="select"
          value={statusFilter ?? ""}
          onChange={(event) => setStatusFilter(event.target.value === "" ? undefined : (event.target.value as ProjectStatus))}
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          {PROJECT_STATUSES.map((value) => (
            <option value={value} key={value}>
              {PROJECT_STATUS_META[value].label}
            </option>
          ))}
        </select>
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
        <select className="select" value={sort} onChange={(event) => setSort(event.target.value as "newest" | "oldest")} aria-label="Sort">
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </select>
        <div style={{ marginLeft: "auto" }}>
          <Button variant="primary" onClick={() => openEditor("")}>
            <Plus size={15} aria-hidden="true" /> New project
          </Button>
        </div>
      </div>

      {projects.isError ? (
        <ErrorState message="Could not load projects." onRetry={() => void projects.refetch()} />
      ) : projects.isLoading ? (
        <LoadingState padded={false} />
      ) : projects.data !== undefined && projects.data.data.length === 0 ? (
        <EmptyState
          title="No projects here"
          message="Adjust the filters, or create the first project."
          action={
            <Button variant="glass" size="sm" onClick={() => openEditor("")}>
              <Plus size={14} aria-hidden="true" /> New project
            </Button>
          }
        />
      ) : (
        <>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Status</th>
                  <th>Featured</th>
                  <th>Updated</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {(projects.data?.data ?? []).map((project) => (
                  <tr key={project.id}>
                    <td>
                      <div className="cover-cell">
                        <div className="cover-thumb" style={{ background: coverBackground(project.slug) }} aria-hidden="true" />
                        <div>
                          <p className="cell-title">{project.title}</p>
                          <p className="cell-sub">
                            {project.category?.name ?? "Uncategorised"} · {project.technologies.slice(0, 3).join(", ") || "—"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td data-label="Status">
                      <StatusBadge status={project.status} />
                    </td>
                    <td data-label="Featured">
                      {project.isFeatured ? (
                        <Star size={15} fill="currentColor" style={{ color: "var(--warning)" }} aria-label="Featured" />
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                    <td data-label="Updated">{formatDate(project.updatedAt)}</td>
                    <td>
                      <div className="row-actions">
                        <button type="button" className="row-action" aria-label={`Edit ${project.title}`} onClick={() => openEditor(project.id)}>
                          <Pencil aria-hidden="true" />
                        </button>
                        {project.status !== "ARCHIVED" ? (
                          <button
                            type="button"
                            className="row-action danger"
                            aria-label={`Archive ${project.title}`}
                            onClick={() => setArchiveId(project.id)}
                          >
                            <Archive aria-hidden="true" />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {projects.data?.meta !== undefined && projects.data.data.length > 0 ? (
            <Pagination meta={projects.data.meta} onChangePage={setPage} />
          ) : null}
        </>
      )}

      <ProjectEditor
        editingId={editingId}
        categories={categories.data?.data ?? []}
        onClose={closeEditor}
      />

      <ArchiveDialog
        archiveId={archiveId}
        projects={projects.data?.data ?? []}
        onClose={() => setArchiveId(null)}
      />
    </>
  );
}

function ProjectEditor({
  editingId,
  categories,
  onClose,
}: {
  editingId: string | null;
  categories: Category[];
  onClose: () => void;
}) {
  const open = editingId !== null;
  const isCreate = editingId === "";
  const toast = useToast();
  const existing = useAdminProject(editingId ?? "");

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [slugTouched, setSlugTouched] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  // Load the project into the form once it arrives.
  useEffect(() => {
    if (open && !isCreate && existing.data !== undefined) {
      setForm(toForm(existing.data));
      setSlugTouched(true);
    }
    if (open && isCreate) {
      setForm(EMPTY_FORM);
      setSlugTouched(false);
      setErrors({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isCreate, existing.data]);

  const create = useCreateProject();
  const update = useUpdateProject();

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const categoriesForDivision = useMemo(
    () => categories.filter((category) => category.division === form.division),
    [categories, form.division],
  );

  const onTitleChange = (value: string) => {
    set("title", value);
    if (!slugTouched && isCreate) set("slug", slugify(value));
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const next: Partial<Record<keyof FormState, string>> = {};
    if (form.title.trim().length < 2) next.title = "Title is required.";
    if (form.slug.trim() === "" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug.trim()))
      next.slug = "Slug: lowercase letters, numbers and dashes.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const input = toInput(form);
    const onError = (error: Error) => {
      const message =
        error instanceof ApiError
          ? `${error.message}${error.status === 409 ? " — slug already in use?" : ""}`
          : "Could not save the project.";
      toast.error(message);
    };

    if (isCreate) {
      create.mutate(input, {
        onSuccess: () => {
          toast.success("Project created.");
          onClose();
        },
        onError,
      });
    } else if (editingId !== null) {
      update.mutate(
        { id: editingId, input },
        {
          onSuccess: () => {
            toast.success("Project saved.");
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
      open={open}
      onClose={onClose}
      title={isCreate ? "New project" : `Edit — ${existing.data?.title ?? "project"}`}
      large
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="project-form" loading={saving}>
            {isCreate ? "Create project" : "Save changes"}
          </Button>
        </>
      }
    >
      <form id="project-form" onSubmit={onSubmit} noValidate>
        <div className="form-grid">
          <Field label="Title" htmlFor="p-title" required error={errors.title}>
            <input id="p-title" className="input" value={form.title} onChange={(event) => onTitleChange(event.target.value)} />
          </Field>
          <Field label="Slug" htmlFor="p-slug" required error={errors.slug} hint="URL segment, e.g. my-case-study">
            <input
              id="p-slug"
              className="input"
              value={form.slug}
              onChange={(event) => {
                setSlugTouched(true);
                set("slug", slugify(event.target.value));
              }}
            />
          </Field>
          <Field label="Division" htmlFor="p-division">
            <select
              id="p-division"
              className="select"
              value={form.division}
              onChange={(event) => {
                const division = event.target.value as Division;
                setForm((current) => ({ ...current, division, categoryId: "" }));
              }}
            >
              {DIVISIONS.map((value) => (
                <option value={value} key={value}>
                  {DIVISION_META[value].label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Category" htmlFor="p-category" hint="Only categories in the selected division are listed.">
            <select id="p-category" className="select" value={form.categoryId} onChange={(event) => set("categoryId", event.target.value)}>
              <option value="">Uncategorised</option>
              {categoriesForDivision.map((category) => (
                <option value={category.id} key={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Status" htmlFor="p-status">
            <select id="p-status" className="select" value={form.status} onChange={(event) => set("status", event.target.value as ProjectStatus)}>
              {PROJECT_STATUSES.map((value) => (
                <option value={value} key={value}>
                  {PROJECT_STATUS_META[value].label}
                </option>
              ))}
            </select>
          </Field>
          <SwitchField
            id="p-featured"
            legend="Visibility"
            label="Feature on the home page"
            checked={form.isFeatured}
            onChange={(checked) => set("isFeatured", checked)}
          />
          <div className="span-2">
            <Field label="Short description" htmlFor="p-short" hint="One or two lines shown on cards.">
              <input
                id="p-short"
                className="input"
                value={form.shortDescription}
                onChange={(event) => set("shortDescription", event.target.value)}
              />
            </Field>
          </div>
          <div className="span-2">
            <Field label="Project link" htmlFor="p-url" hint="Live URL, if public.">
              <input id="p-url" className="input" type="url" value={form.projectUrl} onChange={(event) => set("projectUrl", event.target.value)} />
            </Field>
          </div>
          <Field label="Repository" htmlFor="p-repo" hint="Optional.">
            <input id="p-repo" className="input" type="url" value={form.repositoryUrl} onChange={(event) => set("repositoryUrl", event.target.value)} />
          </Field>
          <Field label="Tech stack" htmlFor="p-tech" hint="Enter to add each tag.">
            <TagInput
              id="p-tech"
              value={form.technologies}
              onChange={(value) => set("technologies", value)}
              placeholder="React, Node.js…"
            />
          </Field>
          <div className="span-2">
            <Field label="Full description" htmlFor="p-full" hint={RICH_HINT}>
              <textarea id="p-full" className="textarea" rows={6} value={form.fullDescription} onChange={(event) => set("fullDescription", event.target.value)} />
            </Field>
          </div>
          <div className="span-2">
            <Field label="Challenge" htmlFor="p-challenge" hint={RICH_HINT}>
              <textarea id="p-challenge" className="textarea" rows={4} value={form.challenge} onChange={(event) => set("challenge", event.target.value)} />
            </Field>
          </div>
          <div className="span-2">
            <Field label="Solution" htmlFor="p-solution" hint={RICH_HINT}>
              <textarea id="p-solution" className="textarea" rows={4} value={form.solution} onChange={(event) => set("solution", event.target.value)} />
            </Field>
          </div>
          <div className="span-2">
            <Field label="Process notes" htmlFor="p-process" hint={RICH_HINT}>
              <textarea id="p-process" className="textarea" rows={4} value={form.process} onChange={(event) => set("process", event.target.value)} />
            </Field>
          </div>
        </div>
      </form>
      <p className="field-hint" style={{ marginTop: "var(--space-4)" }}>
        Images are managed in the Media library and attached on the backend — this form covers all other fields.
      </p>
    </Modal>
  );
}

function ArchiveDialog({
  archiveId,
  projects,
  onClose,
}: {
  archiveId: string | null;
  projects: Array<{ id: string; title: string }>;
  onClose: () => void;
}) {
  const toast = useToast();
  const archive = useArchiveProject();
  const project = projects.find((candidate) => candidate.id === archiveId) ?? null;

  return (
    <ConfirmDialog
      open={archiveId !== null && project !== null}
      title="Archive project"
      message={
        <>
          <strong>{project?.title}</strong> will move to the archive. It disappears from the public site immediately and can
          be restored later.
        </>
      }
      confirmLabel="Archive project"
      loading={archive.isPending}
      onCancel={onClose}
      onConfirm={() => {
        if (archiveId === null) return;
        archive.mutate(archiveId, {
          onSuccess: () => {
            toast.success("Project archived.");
            onClose();
          },
          onError: (error) => toast.error(error instanceof ApiError ? error.message : "Could not archive the project."),
        });
      }}
    />
  );
}
