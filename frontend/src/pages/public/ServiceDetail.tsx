import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Check } from "lucide-react";
import { CtaBand } from "../../components/public/CtaBand";
import { ServiceIcon } from "../../components/public/ServiceIcon";
import { btnClasses } from "../../components/ui/Button";
import { ErrorState, LoadingState } from "../../components/ui/States";
import { RichText } from "../../components/ui/RichText";
import { useService } from "../../hooks/public";
import { DIVISION_META } from "../../utils/format";

export function ServiceDetailPage() {
  const { slug = "" } = useParams();
  const service = useService(slug);

  if (service.isLoading) {
    return (
      <section className="section" style={{ paddingTop: "calc(76px + 60px)" }}>
        <div className="container">
          <LoadingState />
        </div>
      </section>
    );
  }

  if (service.isError || service.data === undefined) {
    return (
      <section className="section" style={{ paddingTop: "calc(76px + 60px)" }}>
        <div className="container">
          <ErrorState
            message="This service could not be found — it may have been renamed or retired."
            onRetry={() => void service.refetch()}
          />
          <div style={{ display: "flex", justifyContent: "center", marginTop: "var(--space-4)" }}>
            <Link to="/services" className={btnClasses("glass")}>
              <ArrowLeft size={15} aria-hidden="true" /> Back to services
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const data = service.data;

  return (
    <>
      <section className="service-hero">
        <div className="container">
          <Link to="/services" className="pd-back">
            <ArrowLeft size={15} aria-hidden="true" /> All services
          </Link>
          <p className="eyebrow">{DIVISION_META[data.division].label}</p>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)", marginTop: "var(--space-4)", flexWrap: "wrap" }}>
            <span className="service-icon" style={{ width: 64, height: 64 }}>
              <ServiceIcon iconKey={data.iconKey} size={30} />
            </span>
            <h1 className="section-title" style={{ margin: 0 }}>
              {data.title}
            </h1>
          </div>
          {data.shortDescription !== null ? (
            <p className="section-lede" style={{ marginTop: "var(--space-5)", maxWidth: "60ch" }}>
              {data.shortDescription}
            </p>
          ) : null}

          {data.deliverables.length > 0 ? (
            <div className="service-detail-grid">
              {data.deliverables.map((deliverable) => (
                <div className="deliverable" key={deliverable}>
                  <Check size={15} aria-hidden="true" />
                  {deliverable}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {data.description !== null ? (
        <section className="section-tight">
          <div className="container">
            <RichText html={data.description} />
          </div>
        </section>
      ) : null}

      <CtaBand
        title={`Ready to start a ${data.title.toLowerCase()} engagement?`}
        text="Send a short brief and we will come back with an honest read on scope, timeline, and fit."
      />
    </>
  );
}
