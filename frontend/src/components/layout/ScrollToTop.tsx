import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/** Reset scroll on route change (except when only the hash changes). */
export function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname]);
  return null;
}
