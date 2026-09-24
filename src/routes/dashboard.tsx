import { useEffect } from "react";
import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { DashboardShell } from "@/components/partner/DashboardShell";

export const Route = createFileRoute("/dashboard")({
  component: DashboardLayout,
});

function DashboardLayout() {
  const navigate = useNavigate();
  const { partner, hydrated } = useAuth();

  useEffect(() => {
    if (!hydrated) return;
    if (!partner) {
      void navigate({ to: "/" });
    } else if (partner.status !== "active") {
      void navigate({ to: "/pending" });
    }
  }, [partner, hydrated, navigate]);

  if (!hydrated || !partner || partner.status !== "active") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <DashboardShell>
      <Outlet />
    </DashboardShell>
  );
}
