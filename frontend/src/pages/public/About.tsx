import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { CtaBand } from "../../components/public/CtaBand";
import { SectionHead } from "../../components/public/SectionHead";
import { btnClasses } from "../../components/ui/Button";
import { ErrorState, LoadingState } from "../../components/ui/States";
import { useServices, useSiteSettings } from "../../hooks/public";
import { DIVISION_META } from "../../utils/format";

const FALLBACK_ABOUT =
  "Astrix Media pairs engineering discipline with creative instinct. We are the studio you call when the website needs to work as hard as the brand does.";

const VALUES = [
  {
    num: "01",
    title: "Craft over volume",
    text: "We take on fewer projects so every one gets senior attention — from the architecture down to the easing curves.",
  },
  {
    num: "02",
    title: "Own the outcome",
    text: "We measure ourselves by your numbers: signups, conversions, watch time, and the reduced cost of maintaining what we build.",
  },
  {
    num: "03",
    title: "No black boxes",
    text: "You see the roadmap, the code, and the analytics. Everything we hand over is documented and yours.",
  },
  {
    num: "04",
    title: "Momentum matters",
    text: "Short cycles, visible progress, honest trade-offs. Momentum is a feature — we protect it deliberately.",
  },
];

const DIVISION_BLURBS: Record<"TECHNOLOGY" | "CREATIVE", string> = {
  TECHNOLOGY:
    "Robust, fast, and maintainable web platforms — the engineering half of the studio, from database to deployment.",
  CREATIVE:
    "Identity, film, and growth content — the half that makes people feel something before they think anything.",
};

export function About() {
  const settings = useSiteSettings();
  const services = useServices();

  const byDivision = (division: "TECHNOLOGY" | "CREATIVE") =>
    (services.data?.data ?? []).filter((service) => service.division === division);

  return (
    <>
      <section className="section" style={{ paddingTop: "calc(76px + clamp(40px, 7vw, 80px))" }}>
        <div className="container">
          <div className="about-hero-grid">
            <div>
              <p className="eyebrow">About the studio</p>
              <h1 className="section-title" style={{ maxWidth: "18ch" }}>
                Built like a product team, delivers like an agency
              </h1>
              <p className="section-lede" style={{ marginTop: "var(--space-4)" }}>
                {settings.data?.aboutIntro ?? FALLBACK_ABOUT}
              </p>
              <div className="hero-actions" style={{ marginTop: "var(--space-6)" }}>
                <Link to="/portfolio" className={btnClasses("primary")}>
                  See the work <Check size={15} aria-hidden="true" />
                </Link>
                <Link to="/contact" className={btnClasses("glass")}>
                  Talk to us
                </Link>
              </div>
            </div>
            <div className="about-visual">
              <img src="/logo.jpeg" alt="Astrix Media emblem" />
              <p className="about-visual-caption">{settings.data?.agencyName ?? "Astrix Media"}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHead
            eyebrow="Two divisions"
            title="One studio, two sharpened edges"
            lede="Every engagement draws from both — strategy and engineering inform the creative, and the creative raises the bar for the build."
          />
          {services.isError ? (
            <ErrorState message="Could not load services." onRetry={() => void services.refetch()} />
          ) : services.isLoading ? (
            <LoadingState padded={false} />
          ) : (
            <div className="dash-panels" style={{ gridTemplateColumns: "1fr 1fr" }}>
              {(["TECHNOLOGY", "CREATIVE"] as const).map((division) => (
                <div className={`division-card ${division === "TECHNOLOGY" ? "tech" : "creative"}`} key={division}>
                  <p className="division-kicker">Division</p>
                  <h3 className="division-title">{DIVISION_META[division].label}</h3>
                  <p className="division-desc">{DIVISION_BLURBS[division]}</p>
                  <ul className="division-list">
                    {byDivision(division).map((service) => (
                      <li key={service.id}>
                        <Check size={14} aria-hidden="true" />
                        {service.title}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHead eyebrow="Operating principles" title="How we show up" />
          <div className="values-grid">
            {VALUES.map((value) => (
              <div className="value-card" key={value.num}>
                <p className="value-num">{value.num}</p>
                <h3 className="service-title" style={{ marginTop: "var(--space-3)" }}>
                  {value.title}
                </h3>
                <p className="muted" style={{ marginTop: "var(--space-2)", fontSize: "var(--fs-small)" }}>
                  {value.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CtaBand title="Want a studio that ships like this?" text="Tell us about the project — we will tell you honestly whether we are the right fit." />
    </>
  );
}
