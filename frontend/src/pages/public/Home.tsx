import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Globe2, MessageSquareQuote, Rocket, Smartphone } from "lucide-react";
import { FlexCarousel, type FlexCarouselItem } from "../../components/carousel/FlexCarousel";
import { CtaBand } from "../../components/public/CtaBand";
import { ProcessTimeline } from "../../components/public/ProcessTimeline";
import { SectionHead } from "../../components/public/SectionHead";
import { ServiceCard } from "../../components/public/ServiceCard";
import { StatsStrip } from "../../components/public/StatsStrip";
import { TestimonialCard } from "../../components/public/TestimonialCard";
import { btnClasses } from "../../components/ui/Button";
import { ErrorState, LoadingState } from "../../components/ui/States";
import { useHome, useProjects, useServices, useTestimonials } from "../../hooks/public";
import { DIVISION_META } from "../../utils/format";

const FALLBACK_HERO_TITLE = "We build digital experiences that move people";
const FALLBACK_HERO_SUB =
  "Astrix Media is a full-stack studio: web platforms, brand systems, and growth content — engineered end to end under one roof.";

export function Home() {
  const home = useHome();

  // Real counts for the stats strip — never invented numbers.
  const projectsTotal = useProjects({ page: 1, pageSize: 1 });
  const services = useServices();
  const testimonials = useTestimonials();

  const carouselItems = useMemo<FlexCarouselItem[]>(
    () =>
      (home.data?.projects.featured ?? []).map((project) => ({
        slug: project.slug,
        title: project.title,
        subtitle: project.category?.name ?? DIVISION_META[project.division].short,
        image: project.thumbnail,
        href: `/projects/${project.slug}`,
      })),
    [home.data],
  );

  const stats = useMemo(() => {
    const items = [];
    if (projectsTotal.data !== undefined) {
      items.push({ value: String(projectsTotal.data.meta?.total ?? projectsTotal.data.data.length), label: "Projects shipped" });
    }
    if (services.data !== undefined) {
      items.push({ value: String(services.data.meta?.total ?? services.data.data.length), label: "Services offered" });
    }
    if (testimonials.data !== undefined) {
      items.push({ value: String(testimonials.data.meta?.total ?? testimonials.data.data.length), label: "Client testimonials" });
    }
    return items;
  }, [projectsTotal.data, services.data, testimonials.data]);

  const marqueeItems = useMemo(() => {
    const titles = home.data?.services.featured.map((service) => service.title) ?? [
      DIVISION_META.TECHNOLOGY.label,
      DIVISION_META.CREATIVE.label,
    ];
    return [...titles, ...titles];
  }, [home.data]);

  if (home.isError) {
    return (
      <section className="section">
        <div className="container">
          <ErrorState message="Could not load the site content." onRetry={() => void home.refetch()} />
        </div>
      </section>
    );
  }

  const hero = home.data?.hero;
  const agency = home.data?.agency;

  return (
    <>
      <section className="hero">
        <div className="container">
          <div className="hero-grid">
            <div>
              <p className="eyebrow">{agency?.tagline ?? "Full-stack digital studio"}</p>
              <h1 className="hero-title">{hero?.title ?? FALLBACK_HERO_TITLE}</h1>
              <p className="hero-sub">{hero?.subtitle ?? FALLBACK_HERO_SUB}</p>
              <div className="hero-actions">
                <Link to="/contact" className={btnClasses("primary", "lg")}>
                  Start a project <ArrowRight size={16} aria-hidden="true" />
                </Link>
                <Link to="/portfolio" className={btnClasses("glass", "lg")}>
                  Explore our work
                </Link>
              </div>
            </div>
            <div className="hero-orb" aria-hidden="true">
              <div className="hero-orb-ring" />
              <div className="hero-orb-core">
                <img src="/logo.jpeg" alt="" />
              </div>
              <div className="hero-orbit-chip chip-1">
                <Rocket size={14} /> Web &amp; SaaS
              </div>
              <div className="hero-orbit-chip chip-2">
                <Smartphone size={14} /> Brand &amp; Content
              </div>
              <div className="hero-orbit-chip chip-3">
                <Globe2 size={14} /> Growth
              </div>
            </div>
          </div>

          {home.isLoading ? (
            <LoadingState label="Loading highlights…" padded={false} />
          ) : (
            <div className="hero-marquee" aria-hidden="true">
              <div className="hero-marquee-track">
                {marqueeItems.map((title, index) => (
                  <span className="marquee-item" key={`${title}-${index}`}>
                    <span className="dot" />
                    {title}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {stats.length > 0 ? (
        <section className="section-tight">
          <div className="container">
            <StatsStrip stats={stats} />
          </div>
        </section>
      ) : null}

      <section className="section">
        <div className="container">
          <SectionHead
            eyebrow="What we do"
            title="Services built around outcomes"
            lede="Two divisions, one team: engineering-grade web platforms and scroll-stopping creative — briefed, built, and measured together."
            aside={
              <Link to="/services" className={btnClasses("ghost")}>
                All services <ArrowRight size={14} aria-hidden="true" />
              </Link>
            }
          />
          {home.isLoading ? (
            <LoadingState padded={false} />
          ) : (
            <div className="services-grid">
              {(home.data?.services.featured ?? []).slice(0, 6).map((service) => (
                <ServiceCard service={service} key={service.id} />
              ))}
            </div>
          )}
        </div>
      </section>

      {carouselItems.length > 0 ? (
        <section className="section" aria-label="Featured projects">
          <div className="container">
            <SectionHead
              eyebrow="Selected work"
              title="Projects we are proud to sign"
              lede="Drag through the reel and open any project for the full case study."
              aside={
                <Link to="/portfolio" className={btnClasses("ghost")}>
                  Full portfolio <ArrowRight size={14} aria-hidden="true" />
                </Link>
              }
            />
            <FlexCarousel items={carouselItems} />
          </div>
        </section>
      ) : null}

      <section className="section">
        <div className="container">
          <SectionHead
            eyebrow="How we work"
            title="A process you can see through"
            lede="No black boxes. Every engagement runs on the same transparent five-step arc."
          />
          <ProcessTimeline />
        </div>
      </section>

      {home.data !== undefined && home.data.testimonials.approved.length > 0 ? (
        <section className="section">
          <div className="container">
            <SectionHead
              eyebrow="Client love"
              title="What partners say after launch"
              aside={
                <span className="badge badge-violet">
                  <MessageSquareQuote size={13} aria-hidden="true" /> Verified testimonials
                </span>
              }
            />
            <div className="testimonials-grid">
              {home.data.testimonials.approved.slice(0, 6).map((testimonial) => (
                <TestimonialCard testimonial={testimonial} key={testimonial.id} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <CtaBand />
    </>
  );
}
