import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { OwnerOnlyGuard } from "@/components/partner/OwnerOnlyGuard";

export const Route = createFileRoute("/dashboard/payouts")({
  component: PayoutsLayout,
});

const SECTIONS = [
  { to: "/dashboard/payouts", label: "Overview" },
  { to: "/dashboard/payouts/history", label: "Payout History" },
  { to: "/dashboard/payouts/settings", label: "Bank Details" },
];

function PayoutsLayout() {
  const location = useLocation();

  return (
    <OwnerOnlyGuard>
      <div>
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground sm:text-[28px]">
            Payouts & Earnings
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track what you've earned, what's coming, and where it lands.
          </p>
        </div>

        <div className="mt-5 flex gap-1 border-b border-border">
          {SECTIONS.map((s) => {
            const active = location.pathname === s.to;
            return (
              <Link
                key={s.to}
                to={s.to}
                className={`border-b-2 px-3.5 py-2.5 text-sm font-semibold transition-colors ${
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
