import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { OwnerOnlyGuard } from "@/components/partner/OwnerOnlyGuard";

export const Route = createFileRoute("/dashboard/settings")({
  component: SettingsLayout,
});

const SECTIONS = [
  { to: "/dashboard/settings", label: "Venue Profile" },
  { to: "/dashboard/settings/staff", label: "Staff" },
  { to: "/dashboard/settings/notifications", label: "Notifications" },
  { to: "/dashboard/settings/account", label: "Account" },
];

function SettingsLayout() {
  const location = useLocation();

  return (
    <OwnerOnlyGuard>
      <div>
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground sm:text-[28px]">
            Venue Settings
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your venue's public profile, who has access, and how you're notified.
          </p>
        </div>

        <div className="mt-5 flex gap-1 overflow-x-auto border-b border-border">
          {SECTIONS.map((s) => {
            const active = location.pathname === s.to;
            return (
              <Link
                key={s.to}
                to={s.to}
                className={`whitespace-nowrap border-b-2 px-3.5 py-2.5 text-sm font-semibold transition-colors ${
                  active
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {s.label}
              </Link>
            );
          })}
        </div>

        <div className="mt-6">
          <Outlet />
        </div>
      </div>
    </OwnerOnlyGuard>
  );
}
