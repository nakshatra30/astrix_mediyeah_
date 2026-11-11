import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";
import { ApiError } from "./api/client";
import { AuthProvider, handleUnauthorized } from "./auth/AuthContext";
import { ToastProvider } from "./components/ui/Toast";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/components.css";
import "./styles/public.css";
import "./styles/admin.css";
import "./styles/carousel.css";

/** A 401 from any cached query/mutation means the session is gone: expire it
 *  so the admin guard redirects to /admin login instead of failing forever. */
function onCacheError(error: unknown): void {
  if (error instanceof ApiError && error.status === 401) handleUnauthorized();
}

const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: onCacheError }),
  mutationCache: new MutationCache({ onError: onCacheError }),
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
      // Never retry deterministic client errors (401/403/404/422…) — only
      // transient failures (network, 5xx) and rate limits (429).
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status >= 400 && error.status !== 429) return false;
        return failureCount < 2;
      },
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
