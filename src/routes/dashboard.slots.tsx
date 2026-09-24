import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/slots")({
  head: () => ({ meta: [{ title: "Slots & Inventory | JustPlay Partner" }] }),
  component: SlotsLayout,
});

const SECTIONS = [
  { to: "/dashboard/slots", label: "Calendar" },
  { to: "/dashboard/slots/setup", label: "Bulk Slot Setup" },
  { to: "/dashboard/slots/courts", label: "Courts & Sports" },
];

function SlotsLayout() {
  const location = useLocation();

  return (
    <div>
      <div>
        <h1 className="font-display text-2xl font-semibold text-foreground sm:text-[28px]">
          Slots & Inventory
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage availability, pricing and courts for your venue.
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
  );
}
