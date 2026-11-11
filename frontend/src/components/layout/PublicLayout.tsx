import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { ArrowRight, Menu, X } from "lucide-react";
import { useSiteSettings } from "../../hooks/public";
import { btnClasses } from "../ui/Button";
import { Footer } from "./Footer";

const NAV_LINKS = [
  { to: "/", label: "Home", end: true },
  { to: "/about", label: "About" },
  { to: "/services", label: "Services" },
  { to: "/portfolio", label: "Portfolio" },
  { to: "/contact", label: "Contact" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { data: settings } = useSiteSettings();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return (
    <header className={`nav${scrolled ? " scrolled" : ""}`}>
      <div className="container nav-inner">
        <Link to="/" className="nav-logo" aria-label={`${settings?.agencyName ?? "Astrix Media"} — home`}>
          <img src="/logo.jpeg" alt="" />
          <span>
            Astrix <span className="word">Media</span>
          </span>
        </Link>

        <nav id="primary-nav" className="nav-links" data-open={open} aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end === true} className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
              {link.label}
            </NavLink>
          ))}
          <Link to="/admin/login" className="nav-link" aria-label="Admin sign in">
            Admin
          </Link>
        </nav>

        <div className="nav-cta-group">
          <Link to="/contact" className={btnClasses("primary")}>
            Start a Project <ArrowRight size={15} aria-hidden="true" />
          </Link>
          <button
            type="button"
            className="btn-icon nav-burger"
            aria-expanded={open}
            aria-controls="primary-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X size={19} aria-hidden="true" /> : <Menu size={19} aria-hidden="true" />}
          </button>
        </div>
      </div>
    </header>
  );
}

export function PublicLayout() {
  return (
    <>
      <Navbar />
      <main id="main">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
