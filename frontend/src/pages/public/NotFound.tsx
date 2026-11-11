import { Link } from "react-router-dom";
import { Home as HomeIcon, MessageCircle } from "lucide-react";
import { btnClasses } from "../../components/ui/Button";

export function NotFound() {
  return (
    <div className="nf">
      <div>
        <p className="nf-code" aria-hidden="true">
          404
        </p>
        <h1 style={{ fontSize: "var(--fs-h2)", marginTop: "var(--space-4)" }}>This page drifted off orbit</h1>
        <p className="muted" style={{ maxWidth: "44ch", margin: "var(--space-4) auto var(--space-6)" }}>
          The link may be outdated, or the page was moved. Let us get you back to known space.
        </p>
        <div className="hero-actions" style={{ justifyContent: "center" }}>
          <Link to="/" className={btnClasses("primary")}>
            <HomeIcon size={15} aria-hidden="true" /> Back home
          </Link>
          <Link to="/contact" className={btnClasses("glass")}>
            <MessageCircle size={15} aria-hidden="true" /> Contact us
          </Link>
        </div>
      </div>
    </div>
  );
}
