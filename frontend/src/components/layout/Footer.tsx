import { Link } from "react-router-dom";
import { ArrowUpRight, MapPin, Mail, Phone } from "lucide-react";
import { useSiteSettings } from "../../hooks/public";

export function Footer() {
  const { data: settings } = useSiteSettings();

  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <Link to="/" className="nav-logo" aria-label="Astrix Media — home">
            <img src="/logo.jpeg" alt="" />
            <span>
              Astrix <span className="word">Media</span>
            </span>
          </Link>
          <p className="footer-tagline">
            {settings?.tagline ?? "Premium digital experiences engineered to convert."}
          </p>
          <div className="footer-contact">
            {settings?.contactEmail ? (
              <a href={`mailto:${settings.contactEmail}`}>
                <Mail size={15} aria-hidden="true" /> {settings.contactEmail}
              </a>
            ) : null}
            {settings?.contactPhone ? (
              <a href={`tel:${settings.contactPhone}`}>
                <Phone size={15} aria-hidden="true" /> {settings.contactPhone}
              </a>
            ) : null}
            {settings?.address ? (
              <span>
                <MapPin size={15} aria-hidden="true" /> {settings.address}
              </span>
            ) : null}
          </div>
        </div>

        <nav className="footer-col" aria-label="Site">
          <p className="footer-heading">Site</p>
          <div className="footer-links">
            <Link to="/" className="footer-link">Home</Link>
            <Link to="/about" className="footer-link">About</Link>
            <Link to="/services" className="footer-link">Services</Link>
            <Link to="/portfolio" className="footer-link">Portfolio</Link>
            <Link to="/contact" className="footer-link">Contact</Link>
          </div>
        </nav>

        <nav className="footer-col" aria-label="Divisions">
          <p className="footer-heading">Divisions</p>
          <div className="footer-links">
            <Link to="/services?division=TECHNOLOGY" className="footer-link">
              Technology &amp; Web Solutions
            </Link>
            <Link to="/services?division=CREATIVE" className="footer-link">
              Creative &amp; Digital Growth
            </Link>
            <Link to="/portfolio?division=TECHNOLOGY" className="footer-link">
              Web portfolio <ArrowUpRight size={13} aria-hidden="true" />
            </Link>
            <Link to="/portfolio?division=CREATIVE" className="footer-link">
              Creative portfolio <ArrowUpRight size={13} aria-hidden="true" />
            </Link>
          </div>
        </nav>

        <div className="footer-col">
          <p className="footer-heading">Start something</p>
          <p className="footer-note">Tell us about your project — we respond within one business day.</p>
          <Link to="/contact" className="btn btn-primary">
            Start a Project <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
        </div>
      </div>

      <div className="container footer-bottom">
        <p>
          © {new Date().getFullYear()} {settings?.agencyName ?? "Astrix Media"}. All rights reserved.
        </p>
        <p className="footer-made">Crafted with obsessive attention to detail.</p>
      </div>
    </footer>
  );
}
