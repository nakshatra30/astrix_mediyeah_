import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { btnClasses } from "../ui/Button";

interface CtaBandProps {
  title?: string;
  text?: string;
  children?: ReactNode;
}

export function CtaBand({ title, text, children }: CtaBandProps) {
  return (
    <section className="section-tight" aria-labelledby="cta-title">
      <div className="cta-band">
        <p className="eyebrow">Next step</p>
        <h2 className="cta-title" id="cta-title">
          {title ?? "Have a project in mind?"}
        </h2>
        <p className="cta-text">
          {text ?? "Tell us what you are building. You will hear back from a real strategist — not a bot — within one business day."}
        </p>
        {children ?? (
          <div className="hero-actions" style={{ justifyContent: "center" }}>
            <Link to="/contact" className={btnClasses("primary", "lg")}>
              Start a project <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link to="/portfolio" className={btnClasses("glass", "lg")}>
              See our work
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
