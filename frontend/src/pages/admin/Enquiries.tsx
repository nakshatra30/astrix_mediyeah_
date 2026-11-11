import { useState, type ReactNode } from "react";
import { Eye, Mail, MessageSquarePlus, Phone, Send } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Drawer } from "../../components/ui/Drawer";
import { EnquiryStatusBadge } from "../../components/ui/Badges";
import { EmptyState, ErrorState, LoadingState } from "../../components/ui/States";
import { Pagination } from "../../components/ui/Pagination";
import { useToast } from "../../components/ui/Toast";
import { ApiError } from "../../api/client";
import type { EnquiryStatus } from "../../api/types";
import { useAdminEnquiries, useAdminEnquiry, useCreateEnquiryNote, useUpdateEnquiryStatus } from "../../hooks/admin";
import { ENQUIRY_STATUSES, ENQUIRY_STATUS_META, PREFERRED_CONTACT_LABELS, formatDateTime, relativeTime } from "../../utils/format";

export function AdminEnquiries() {
  const [statusFilter, setStatusFilter] = useState<EnquiryStatus | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<string | null>(null);

  const enquiries = useAdminEnquiries(statusFilter, page);

  return (
    <>
      <div className="toolbar">
        <select
          className="select"
          value={statusFilter ?? ""}
          onChange={(event) => {
            setStatusFilter(event.target.value === "" ? undefined : (event.target.value as EnquiryStatus));
            setPage(1);
          }}
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          {ENQUIRY_STATUSES.map((value) => (
            <option value={value} key={value}>
              {ENQUIRY_STATUS_META[value].label}
            </option>
          ))}
        </select>
        <p className="muted" style={{ fontSize: "var(--fs-small)", marginLeft: "auto" }}>
          {enquiries.data?.meta?.total ?? "…"} total
        </p>
      </div>

      {enquiries.isError ? (
        <ErrorState message="Could not load the inbox." onRetry={() => void enquiries.refetch()} />
      ) : enquiries.isLoading ? (
        <LoadingState padded={false} />
      ) : enquiries.data !== undefined && enquiries.data.data.length === 0 ? (
        <EmptyState
          title="Inbox zero"
          message={statusFilter === undefined ? "No enquiries yet — the public contact form feeds straight in." : "Nothing matches this filter."}
        />
      ) : (
        <>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>From</th>
                  <th>Service</th>
                  <th>Budget</th>
                  <th>Status</th>
                  <th>Received</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {(enquiries.data?.data ?? []).map((enquiry) => (
                  <tr key={enquiry.id}>
                    <td>
                      <p className="cell-title">{enquiry.name}</p>
                      <p className="cell-sub">{enquiry.email}</p>
                    </td>
                    <td data-label="Service">{enquiry.serviceNameSnapshot ?? "—"}</td>
                    <td data-label="Budget">{enquiry.budgetRange ?? "—"}</td>
                    <td data-label="Status">
                      <EnquiryStatusBadge status={enquiry.status} />
                    </td>
                    <td data-label="Received">
                      <span title={formatDateTime(enquiry.createdAt)}>{relativeTime(enquiry.createdAt)}</span>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button
                          type="button"
                          className="row-action"
                          aria-label={`Open enquiry from ${enquiry.name}`}
                          onClick={() => setOpenId(enquiry.id)}
                        >
                          <Eye aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {enquiries.data?.meta !== undefined && enquiries.data.data.length > 0 ? (
            <Pagination meta={enquiries.data.meta} onChangePage={setPage} />
          ) : null}
        </>
      )}

      <EnquiryDrawer enquiryId={openId} onClose={() => setOpenId(null)} />
    </>
  );
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="enquiry-fact">
      <p className="enquiry-fact-label">{label}</p>
      <p className="enquiry-fact-value">{children}</p>
    </div>
  );
}

function EnquiryDrawer({ enquiryId, onClose }: { enquiryId: string | null; onClose: () => void }) {
  const toast = useToast();
  const enquiry = useAdminEnquiry(enquiryId ?? "");
  const updateStatus = useUpdateEnquiryStatus();
  const addNote = useCreateEnquiryNote();
  const [noteDraft, setNoteDraft] = useState("");

  const data = enquiry.data;

  const onStatusChange = (status: EnquiryStatus) => {
    if (enquiryId === null) return;
    updateStatus.mutate(
      { id: enquiryId, status },
      {
        onSuccess: () => toast.success(`Marked as ${ENQUIRY_STATUS_META[status].label.toLowerCase()}.`),
        onError: (error) => toast.error(error instanceof ApiError ? error.message : "Could not update the status."),
      },
    );
  };

  const onAddNote = () => {
    const body = noteDraft.trim();
    if (body === "" || enquiryId === null) return;
    addNote.mutate(
      { id: enquiryId, body },
      {
        onSuccess: () => {
          setNoteDraft("");
          toast.success("Note added.");
        },
        onError: (error) => toast.error(error instanceof ApiError ? error.message : "Could not add the note."),
      },
    );
  };

  return (
    <Drawer open={enquiryId !== null} onClose={onClose} title={data?.name ?? "Enquiry"}>
      {enquiry.isLoading || enquiry.isFetching ? (
        <LoadingState padded={false} />
      ) : enquiry.isError ? (
        <ErrorState message="Could not load this enquiry." onRetry={() => void enquiry.refetch()} />
      ) : data === undefined ? null : (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: "var(--space-4)" }}>
            <EnquiryStatusBadge status={data.status} />
            <select
              className="select"
              style={{ width: "auto", marginLeft: "auto" }}
              value={data.status}
              onChange={(event) => onStatusChange(event.target.value as EnquiryStatus)}
              aria-label="Change status"
              disabled={updateStatus.isPending}
            >
              {ENQUIRY_STATUSES.map((value) => (
                <option value={value} key={value}>
                  {ENQUIRY_STATUS_META[value].label}
                </option>
              ))}
            </select>
          </div>

          <div className="enquiry-facts">
            <Fact label="Email">
              <a href={`mailto:${data.email}`}>{data.email}</a>
            </Fact>
            {data.phone !== null ? (
              <Fact label="Phone">
                <a href={`tel:${data.phone}`}>{data.phone}</a>
              </Fact>
            ) : null}
            <Fact label="Company">{data.company ?? "—"}</Fact>
            <Fact label="Service">{data.service?.title ?? data.serviceNameSnapshot ?? "General"}</Fact>
            <Fact label="Budget">{data.budgetRange ?? "—"}</Fact>
            <Fact label="Preferred contact">
              {data.preferredContactMethod !== null ? PREFERRED_CONTACT_LABELS[data.preferredContactMethod] : "—"}
            </Fact>
            <Fact label="Source page">{data.sourcePage ?? "—"}</Fact>
            <Fact label="Received">{formatDateTime(data.createdAt)}</Fact>
          </div>

          <section aria-label="Project description" style={{ marginBlock: "var(--space-5)" }}>
            <h3 className="panel-title" style={{ marginBottom: "var(--space-2)" }}>
              Project description
            </h3>
            <div className="prose">
              <p>{data.projectDescription}</p>
            </div>
          </section>

          <section aria-label="Notes">
            <h3 className="panel-title" style={{ marginBottom: "var(--space-2)" }}>
              <MessageSquarePlus size={15} aria-hidden="true" /> Internal notes ({data.notes.length})
            </h3>
            {data.notes.length === 0 ? (
              <p className="muted" style={{ fontSize: "var(--fs-small)" }}>
                No notes yet. Notes stay internal to the team.
              </p>
            ) : (
              <div className="note-list">
                {data.notes.map((note) => (
                  <article className="note" key={note.id}>
                    <p className="note-meta">{formatDateTime(note.createdAt)}</p>
                    <p className="note-body">{note.body}</p>
                  </article>
                ))}
              </div>
            )}
            <div className="note-form" style={{ marginTop: "var(--space-3)" }}>
              <label className="sr-only" htmlFor="note-body">
                New note
              </label>
              <textarea
                id="note-body"
                className="textarea"
                rows={3}
                placeholder="Add an internal note…"
                value={noteDraft}
                onChange={(event) => setNoteDraft(event.target.value)}
              />
              <div className="note-form-foot">
                <Button size="sm" variant="primary" onClick={onAddNote} loading={addNote.isPending} disabled={noteDraft.trim() === ""}>
                  <Send size={13} aria-hidden="true" /> Add note
                </Button>
              </div>
            </div>
          </section>

          {data.preferredContactMethod === "EMAIL" || data.preferredContactMethod === null ? (
            <Button
              variant="glass"
              size="sm"
              style={{ marginTop: "var(--space-4)" }}
              onClick={() => window.open(`mailto:${data.email}?subject=Re: your enquiry to Astrix Mediyeah`, "_blank")}
            >
              <Mail size={14} aria-hidden="true" /> Reply by email
            </Button>
          ) : (
            <Button
              variant="glass"
              size="sm"
              style={{ marginTop: "var(--space-4)" }}
              onClick={() =>
                data.phone !== null ? window.open(`tel:${data.phone}`, "_blank") : window.open(`mailto:${data.email}`, "_blank")
              }
            >
              <Phone size={14} aria-hidden="true" /> Contact them
            </Button>
          )}
        </>
      )}
    </Drawer>
  );
}
