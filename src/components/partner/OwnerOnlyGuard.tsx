import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";

/** Wraps an owner-only route layout. A staff-role partner who navigates
 *  here directly (the nav link is already hidden for them, but a typed
 *  URL still resolves) gets redirected to the dashboard rather than
 *  seeing owner-only content with some fields merely disabled. */
export function OwnerOnlyGuard({ children }: { children: ReactNode }) {
  const { partner } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (partner && partner.role !== "owner") {
      void navigate({ to: "/dashboard" });
    }
  }, [partner, navigate]);

  if (!partner || partner.role !== "owner") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <>{children}</>;
}
