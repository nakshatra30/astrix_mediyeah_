import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { ArrowRight, FolderKanban, Layers, Mail, MessageSquareQuote, Rocket } from "lucide-react";
import { EnquiryStatusBadge, StatusBadge } from "../../components/ui/Badges";
import { ErrorState, LoadingState } from "../../components/ui/States";
import {
  useAdminEnquiries,
  useAdminProjects,
  useAdminServices,
  useAdminTestimonials,
} from "../../hooks/admin";
import { coverBackground } from "../../utils/cover";
import { relativeTime } from "../../utils/format";

function StatCard({
  to,
  color,
  icon,
  value,
  label,
  loading,
}: {
  to: string;
  color: string;
  icon: ReactNode;
  value: number | undefined;
  label: string;
  loading: boolean;
}) {
  return (
    <Link to={to} className={`stat-card ${color}`} aria-label={`${label}: ${value ?? "loading"}`}>
      <div className="stat-card-top">
        <div className="stat-card-icon">{icon}</div>
        <ArrowRight size={15} aria-hidden="true" style={{ color: "var(--text-faint)" }} />
      </div>
      <p className="stat-value">{loading ? "…" : String(value ?? 0)}</p>
      <p className="stat-label">{label}</p>
    </Link>
  );
}

export function AdminDashboard() {
  const published = useAdminProjects({ status: "PUBLISHED", page: 1, pageSize: 1 });
  const newEnquiries = useAdminEnquiries("NEW", 1);
  const enquiries = useAdminEnquiries(undefined, 1);
  const services = useAdminServices(undefined, true);
  const testimonials = useAdminTestimonials();
  const recentProjects = useAdminProjects({ sort: "newest", page: 1, pageSize: 6 });

  const loadingAny = published.isLoading || newEnquiries.isLoading || services.isLoading || testimonials.isLoading;
  const error = published.error ?? newEnquiries.error ?? services.error ?? testimonials.error;

  if (error !== null) {
    return <ErrorState message="Could not load dashboard counts." />;
  }

  return (
    <>
      <div className="stat-grid">
        <StatCard
          to="/admin/projects"
          color="c-violet"
          icon={<FolderKanban size={18} aria-hidden="true" />}
          value={published.data?.meta?.total}
          label="Published projects"
          loading={loadingAny}
        />
        <StatCard
          to="/admin/enquiries"
          color="c-red"
          icon={<Mail size={18} aria-hidden="true" />}
          value={newEnquiries.data?.meta?.total}
          label="New enquiries"
          loading={loadingAny}
        />
        <StatCard
          to="/admin/services"
          color="c-blue"
          icon={<Rocket size={18} aria-hidden="true" />}
          value={services.data?.meta?.total}
          label="Services"
          loading={loadingAny}
        />
        <StatCard
          to="/admin/testimonials"
          color="c-green"
          icon={<MessageSquareQuote size={18} aria-hidden="true" />}
          value={testimonials.data?.meta?.total}
          label="Testimonials"
          loading={loadingAny}
        />
      </div>

      <div className="dash-panels">
        <section className="panel" aria-label="Latest enquiries">
          <div className="panel-head">
            <h2 className="panel-title">
              <Mail size={16} aria-hidden="true" /> Latest enquiries
            </h2>
            <Link to="/admin/enquiries" className="btn btn-ghost btn-sm">
              Open inbox <ArrowRight size={13} aria-hidden="true" />
            </Link>
          </div>
          <div className="panel-body">
            {enquiries.isLoading ? (
              <LoadingState padded={false} />
            ) : enquiries.data !== undefined && enquiries.data.data.length === 0 ? (
              <p className="muted" style={{ fontSize: "var(--fs-small)" }}>
                No enquiries yet. The public contact form feeds straight into this inbox.
              </p>
            ) : (
              (enquiries.data?.data ?? []).slice(0, 6).map((enquiry) => (
                <Link to="/admin/enquiries" key={enquiry.id} className="enquiry-mini">
                  <div className="enquiry-mini-main">
                    <p className="enquiry-mini-name">
                      {enquiry.name} <EnquiryStatusBadge status={enquiry.status} />
                    </p>
                    <p className="enquiry-mini-sub">
                      {enquiry.serviceNameSnapshot ?? "General enquiry"} · {relativeTime(enquiry.createdAt)}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>

        <section className="panel" aria-label="Recent projects">
          <div className="panel-head">
            <h2 className="panel-title">
              <Layers size={16} aria-hidden="true" /> Recent projects
            </h2>
            <Link to="/admin/projects" className="btn btn-ghost btn-sm">
              Manage <ArrowRight size={13} aria-hidden="true" />
            </Link>
          </div>
          <div className="panel-body">
            {recentProjects.isLoading ? (
              <LoadingState padded={false} />
            ) : recentProjects.data !== undefined && recentProjects.data.data.length === 0 ? (
              <p className="muted" style={{ fontSize: "var(--fs-small)" }}>
                No projects yet — create the first from the Projects tab.
              </p>
            ) : (
              (recentProjects.data?.data ?? []).map((project) => (
                <Link to="/admin/projects" key={project.id} className="project-mini">
                  <div className="mini-cover" style={{ background: coverBackground(project.slug) }} aria-hidden="true" />
                  <div className="enquiry-mini-main">
                    <p className="enquiry-mini-name">
                      {project.title} <StatusBadge status={project.status} />
                    </p>
                    <p className="enquiry-mini-sub">
                      {project.category?.name ?? "Uncategorised"} · updated {relativeTime(project.updatedAt)}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>
      </div>
    </>
  );
}
