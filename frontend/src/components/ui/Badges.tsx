import type { Division, EnquiryStatus, ProjectStatus } from "../../api/types";
import { DIVISION_META, ENQUIRY_STATUS_META, PROJECT_STATUS_META } from "../../utils/format";

export function StatusBadge({ status }: { status: ProjectStatus }) {
  const meta = PROJECT_STATUS_META[status];
  return (
    <span className={`badge ${meta.badge}`}>
      <span className="badge-dot" aria-hidden="true" />
      {meta.label}
    </span>
  );
}

export function EnquiryStatusBadge({ status }: { status: EnquiryStatus }) {
  const meta = ENQUIRY_STATUS_META[status];
  return (
    <span className={`badge ${meta.badge}`}>
      <span className="badge-dot" aria-hidden="true" />
      {meta.label}
    </span>
  );
}

export function DivisionBadge({ division, short = false }: { division: Division; short?: boolean }) {
  const meta = DIVISION_META[division];
  return (
    <span className={`badge ${meta.badge}`}>
      <span className="badge-dot" aria-hidden="true" />
      {short ? meta.short : meta.label}
    </span>
  );
}
