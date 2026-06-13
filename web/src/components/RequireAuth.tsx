import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { authEnabled } from "../lib/supabase";
import { useSession } from "../lib/useSession";

/**
 * Gates a route behind sign-in. Redirects to /login (preserving the intended
 * destination) when auth is configured but no session exists. When auth is
 * not configured at all, the wrapped page renders and shows its own
 * "sign-in unavailable" state — anonymous-only deployments keep working.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { session, loading } = useSession();
  const location = useLocation();

  if (!authEnabled) return <>{children}</>;
  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-teal-300/30 border-t-teal-300" />
      </div>
    );
  }
  if (!session) {
    return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />;
  }
  return <>{children}</>;
}
