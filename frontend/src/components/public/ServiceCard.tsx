import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { ServiceIcon } from "./ServiceIcon";

/** Structural subset of Service — works for list endpoints and the home aggregate. */
export interface ServiceCardData {
  title: string;
  slug: string;
  shortDescription: string | null;
  iconKey: string | null;
  deliverables?: string[];
}

export function ServiceCard({ service }: { service: ServiceCardData }) {
  return (
    <Link to={`/services/${service.slug}`} className="service-card" aria-label={`Explore ${service.title}`}>
      <div className="service-icon">
        <ServiceIcon iconKey={service.iconKey} />
      </div>
      <h3 className="service-title">{service.title}</h3>
      {service.shortDescription !== null ? <p className="service-desc">{service.shortDescription}</p> : null}
      {service.deliverables !== undefined && service.deliverables.length > 0 ? (
        <div className="service-tags">
          {service.deliverables.slice(0, 3).map((tag) => (
            <span className="badge badge-neutral" key={tag}>
              {tag}
            </span>
          ))}
          {service.deliverables.length > 3 ? (
            <span className="badge badge-neutral">+{service.deliverables.length - 3}</span>
          ) : null}
        </div>
      ) : null}
      <span className="service-more">
        Learn more <ArrowRight size={13} aria-hidden="true" />
      </span>
    </Link>
  );
}
