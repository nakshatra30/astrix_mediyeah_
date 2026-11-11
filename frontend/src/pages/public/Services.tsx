import { useState } from "react";
import { CtaBand } from "../../components/public/CtaBand";
import { SectionHead } from "../../components/public/SectionHead";
import { ServiceCard } from "../../components/public/ServiceCard";
import { EmptyState, ErrorState, LoadingState } from "../../components/ui/States";
import { useServices } from "../../hooks/public";
import type { Division } from "../../api/types";
import { DIVISION_META } from "../../utils/format";

export function Services() {
  const [division, setDivision] = useState<Division | undefined>(undefined);
  const services = useServices(division);

  const filters: Array<{ value: Division | undefined; label: string }> = [
    { value: undefined, label: "All services" },
    { value: "TECHNOLOGY", label: DIVISION_META.TECHNOLOGY.label },
    { value: "CREATIVE", label: DIVISION_META.CREATIVE.label },
  ];

  return (
    <>
      <section className="section" style={{ paddingTop: "calc(76px + clamp(40px, 7vw, 80px))" }}>
        <div className="container">
          <SectionHead
            eyebrow="Services"
            title="Everything a launch needs, under one roof"
            lede="Pick a division or browse the full catalogue — each service page lists exactly what ships."
          />
          <div className="pill-group" style={{ marginBottom: "var(--space-6)" }} role="group" aria-label="Filter services by division">
            {filters.map((filter) => (
              <button
                type="button"
                key={filter.label}
                className="pill"
                aria-pressed={division === filter.value}
                onClick={() => setDivision(filter.value)}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {services.isError ? (
            <ErrorState message="Could not load services." onRetry={() => void services.refetch()} />
          ) : services.isLoading ? (
            <LoadingState padded={false} />
          ) : services.data !== undefined && services.data.data.length === 0 ? (
            <EmptyState
              title="No services here yet"
              message="This division is being finalised. Reach out and we will happily scope your request anyway."
            />
          ) : (
            <div className="services-grid" style={{ transition: "opacity var(--dur-fast)" }}>
              {(services.data?.data ?? []).map((service) => (
                <ServiceCard service={service} key={service.id} />
              ))}
            </div>
          )}
        </div>
      </section>

      <CtaBand
        title="Not sure which service you need?"
        text="Describe the outcome you want — we will map it to the right engagement and tell you what it takes."
      />
    </>
  );
}
