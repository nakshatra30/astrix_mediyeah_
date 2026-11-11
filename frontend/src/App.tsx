import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { PublicLayout } from "./components/layout/PublicLayout";
import { AdminLayout } from "./components/layout/AdminLayout";
import { ScrollToTop } from "./components/layout/ScrollToTop";
import { Home } from "./pages/public/Home";
import { About } from "./pages/public/About";
import { Services } from "./pages/public/Services";
import { ServiceDetailPage } from "./pages/public/ServiceDetail";
import { Portfolio } from "./pages/public/Portfolio";
import { ProjectDetailPage } from "./pages/public/ProjectDetailPage";
import { Contact } from "./pages/public/Contact";
import { NotFound } from "./pages/public/NotFound";
import { AdminLogin } from "./pages/admin/Login";
import { AdminDashboard } from "./pages/admin/Dashboard";
import { AdminProjects } from "./pages/admin/Projects";
import { AdminCategories } from "./pages/admin/Categories";
import { AdminServices } from "./pages/admin/Services";
import { AdminTestimonials } from "./pages/admin/Testimonials";
import { AdminEnquiries } from "./pages/admin/Enquiries";
import { AdminSettings } from "./pages/admin/Settings";
import { AdminMedia } from "./pages/admin/Media";

/** Keep the document title in sync with the route. */
const TITLES: Array<[RegExp, string]> = [
  [/^\/$/, "Astrix Media — Premium Digital Experiences"],
  [/^\/about/, "About — Astrix Media"],
  [/^\/services/, "Services — Astrix Media"],
  [/^\/portfolio/, "Portfolio — Astrix Media"],
  [/^\/projects\//, "Project — Astrix Media"],
  [/^\/contact/, "Contact — Astrix Media"],
  [/^\/admin\/login/, "Sign in — Astrix Mediyeah Admin"],
  [/^\/admin/, "Admin — Astrix Mediyeah"],
];

export function App() {
  const location = useLocation();

  useEffect(() => {
    for (const [pattern, title] of TITLES) {
      if (pattern.test(location.pathname)) {
        document.title = title;
        return;
      }
    }
    document.title = "Astrix Media";
  }, [location.pathname]);

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <div className="aurora" aria-hidden="true" />
      <ScrollToTop />
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/services" element={<Services />} />
          <Route path="/services/:slug" element={<ServiceDetailPage />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/projects/:slug" element={<ProjectDetailPage />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="projects" element={<AdminProjects />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="services" element={<AdminServices />} />
          <Route path="testimonials" element={<AdminTestimonials />} />
          <Route path="enquiries" element={<AdminEnquiries />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="media" element={<AdminMedia />} />
        </Route>
      </Routes>
    </>
  );
}
