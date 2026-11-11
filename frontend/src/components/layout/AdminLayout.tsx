import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  BarChart3,
  FolderKanban,
  Layers,
  LayoutGrid,
  LogOut,
  Mail,
  Menu,
  MessageSquareQuote,
  Settings,
  Upload,
  X,
} from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { useAdminEnquiries } from "../../hooks/admin";
import { initials } from "../../utils/format";

const NAV_SECTIONS = [
  {
    label: "Overview",
    items: [{ to: "/admin/dashboard", label: "Dashboard", icon: BarChart3, end: true }],
  },
  {
    label: "Content",
    items: [
      { to: "/admin/projects", label: "Projects", icon: FolderKanban, end: false },
      { to: "/admin/categories", label: "Categories", icon: Layers, end: false },
      { to: "/admin/services", label: "Services", icon: LayoutGrid, end: false },
      { to: "/admin/testimonials", label: "Testimonials", icon: MessageSquareQuote, end: false },
    ],
  },
  {
    label: "Inbox",
    items: [{ to: "/admin/enquiries", label: "Enquiries", icon: Mail, end: false }],
  },
  {
    label: "System",
    items: [
      { to: "/admin/media", label: "Media", icon: Upload, end: false },
      { to: "/admin/settings", label: "Settings", icon: Settings, end: false },
    ],
  },
];

export function AdminLayout() {
  const { status, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  // NEW enquiries badge — real count from the API, not a mock.
  const { data: enquiriesData } = useAdminEnquiries(status === "authenticated" ? "NEW" : undefined, 1);
  const newCount = enquiriesData?.meta?.total ?? 0;

  useEffect(() => {
    if (status === "unauthenticated") {
      navigate("/admin/login", { replace: true, state: { from: location.pathname + location.search } });
    }
  }, [status, navigate, location.pathname, location.search]);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  if (status !== "authenticated") {
    return (
      <div className="login-wrap">
        <div className="spinner spinner-lg" role="status" aria-label="Checking session" />
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <div className="admin-sidebar-backdrop" data-open={open} onMouseDown={() => setOpen(false)} aria-hidden="true" />
      <aside className="admin-sidebar" data-open={open} aria-label="Admin navigation">
        <div className="admin-brand">
          <Link to="/admin/dashboard" aria-label="Astrix Mediyeah admin home">
            <img src="/logo.jpeg" alt="" />
          </Link>
          <div className="admin-brand-text">
            <p className="admin-brand-name">Astrix Mediyeah</p>
            <span className="admin-brand-sub">Control Room</span>
          </div>
          <button
            type="button"
            className="btn-icon"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            style={{ marginLeft: "auto", display: open ? "inline-flex" : "none" }}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <nav className="admin-nav">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              <p className="admin-nav-label">{section.label}</p>
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) => `admin-nav-link${isActive ? " active" : ""}`}
                >
                  <item.icon size={17} aria-hidden="true" />
                  <span>{item.label}</span>
                  {item.label === "Enquiries" && newCount > 0 ? (
                    <span className="nav-count">{newCount > 99 ? "99+" : newCount}</span>
                  ) : null}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="admin-sidebar-foot">
          <div className="admin-user">
            <div className="admin-user-avatar" aria-hidden="true">
              {initials(user?.name ?? "AM")}
            </div>
            <div style={{ minWidth: 0 }}>
              <p className="admin-user-name">{user?.name}</p>
              <p className="admin-user-email">{user?.email}</p>
            </div>
            <button type="button" className="btn-icon" onClick={() => void logout()} aria-label="Sign out" title="Sign out">
              <LogOut size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <button type="button" className="btn-icon admin-burger" aria-label="Open menu" onClick={() => setOpen(true)}>
            <Menu size={18} aria-hidden="true" />
          </button>
          <div>
            <p className="admin-page-title">Astrix Mediyeah Control Room</p>
            <p className="admin-page-sub">Signed in as {user?.email}</p>
          </div>
          <div className="admin-actions">
            <Link to="/" className="btn btn-ghost btn-sm" target="_blank" rel="noreferrer">
              View site
            </Link>
          </div>
        </header>
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
