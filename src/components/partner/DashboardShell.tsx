import { useMemo, useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  Bell,
  Building2,
  ChevronDown,
  LayoutDashboard,
  ListChecks,
  BookOpen,
  Wallet,
  Settings,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "./Logo";
import { AlertRow } from "./DashboardWidgets";
import { useAuth } from "@/lib/auth";
import { useBookings } from "@/lib/bookings";
import { usePayouts } from "@/lib/payouts";
import { buildDashboardAlerts } from "@/lib/alerts";

export type NavKey = "dashboard" | "slots" | "bookings" | "payouts" | "settings";

export const NAV_ITEMS: {
  key: NavKey;
  label: string;
  to: string;
  icon: LucideIcon;
  live: boolean;
  /** Hidden from the nav entirely (not just disabled) when role === "staff". */
  ownerOnly: boolean;
  phase?: string;
}[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    to: "/dashboard",
    icon: LayoutDashboard,
    live: true,
    ownerOnly: false,
  },
  {
    key: "slots",
    label: "Slots & Inventory",
    to: "/dashboard/slots",
    icon: ListChecks,
    live: true,
    ownerOnly: false,
  },
  {
    key: "bookings",
    label: "Bookings",
    to: "/dashboard/bookings",
    icon: BookOpen,
    live: true,
    ownerOnly: false,
  },
  {
    key: "payouts",
    label: "Payouts",
    to: "/dashboard/payouts",
    icon: Wallet,
    live: true,
    ownerOnly: true,
  },
  {
    key: "settings",
    label: "Venue Settings",
    to: "/dashboard/settings",
    icon: Settings,
    live: true,
    ownerOnly: true,
  },
];

function NavButton({
  item,
  active,
  onClick,
}: {
  item: (typeof NAV_ITEMS)[number];
  active: boolean;
  onClick?: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      to={item.to}
      onClick={onClick}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-colors ${
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      }`}
    >
      <Icon className="h-[18px] w-[18px] shrink-0" />
      <span className="flex-1">{item.label}</span>
      {!item.live && (
        <span className="rounded-full bg-surface-raised px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
          {item.phase}
        </span>
      )}
    </Link>
  );
}

export function DashboardShell({ children }: { children: ReactNode }) {
  const { partner, logout } = useAuth();
  const { bookings } = useBookings();
  const { pendingDeductions, pendingNet } = usePayouts();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const visibleNavItems = useMemo(
    () => NAV_ITEMS.filter((item) => !item.ownerOnly || partner?.role === "owner"),
    [partner?.role],
  );

  const alerts = useMemo(
    () => buildDashboardAlerts({ bookings, pendingDeductions, pendingNet }),
    [bookings, pendingDeductions, pendingNet],
  );

  if (!partner) return null;

  // Longest matching `to` wins, so /dashboard/slots doesn't also match
  // the /dashboard entry.
  const active =
    [...NAV_ITEMS]
      .sort((a, b) => b.to.length - a.to.length)
      .find((item) => location.pathname === item.to || location.pathname.startsWith(item.to + "/"))
      ?.key ?? "dashboard";

  const handleLogout = () => {
    logout();
    void navigate({ to: "/" });
  };

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-surface px-4 py-5 lg:flex">
        <div className="px-2">
          <Logo />
        </div>

        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {visibleNavItems.map((item) => (
            <NavButton key={item.key} item={item} active={item.key === active} />
          ))}
        </nav>

        <div className="mt-4 rounded-xl border border-border bg-surface-raised p-3.5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold text-foreground">Verified partner</span>
          </div>
          <p className="mt-1 text-[11.5px] leading-snug text-muted-foreground">
            {partner.venueName} is live and accepting bookings.
          </p>
        </div>
      </aside>

      {mobileNavOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setMobileNavOpen(false)} />
          <div className="relative flex h-full w-72 flex-col bg-surface px-4 py-5">
            <div className="flex items-center justify-between px-2">
              <Logo />
              <button onClick={() => setMobileNavOpen(false)} aria-label="Close menu">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            <nav className="mt-8 flex flex-col gap-1">
              {visibleNavItems.map((item) => (
                <NavButton
                  key={item.key}
                  item={item}
                  active={item.key === active}
                  onClick={() => setMobileNavOpen(false)}
                />
              ))}
            </nav>
          </div>
        </div>
      )}

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/90 px-5 py-3.5 backdrop-blur sm:px-8">
          <button
            className="lg:hidden"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5 text-muted-foreground" />
          </button>

          <button className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm font-semibold text-foreground">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            {partner.venueName}
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>

          {partner.role === "staff" && (
            <span className="rounded-full bg-accent/15 px-2.5 py-1 text-xs font-semibold text-accent">
              Staff access
            </span>
          )}

          <div className="ml-auto flex items-center gap-2.5">
            <div className="relative">
              <button
                onClick={() => {
                  setNotificationsOpen((v) => !v);
                  setProfileOpen(false);
                }}
                className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface"
                aria-label={alerts.length > 0 ? `${alerts.length} notifications` : "Notifications"}
              >
                <Bell className="h-4 w-4 text-muted-foreground" />
                {alerts.length > 0 && (
                  <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-destructive" />
                )}
              </button>
              {notificationsOpen && (
                <div className="absolute right-0 top-11 w-[22rem] max-w-[calc(100vw-2.5rem)] overflow-hidden rounded-xl border border-border bg-surface shadow-card">
                  <div className="border-b border-border px-3.5 py-2.5">
                    <p className="text-sm font-semibold text-foreground">Notifications</p>
                  </div>
                  {alerts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-2 px-4 py-8 text-center">
                      <Bell className="h-5 w-5 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Nothing needs your attention.</p>
                    </div>
                  ) : (
                    <div className="flex max-h-80 flex-col gap-2 overflow-y-auto p-2.5">
                      {alerts.map((a) => (
                        <div key={a.id} onClick={() => setNotificationsOpen(false)}>
                          <AlertRow alert={a} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => {
                  setProfileOpen((v) => !v);
                  setNotificationsOpen(false);
                }}
                className="flex items-center gap-2 rounded-xl border border-border bg-surface py-1.5 pl-1.5 pr-2.5"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
                  {partner.ownerName
                    .split(" ")
                    .map((p) => p[0])
                    .slice(0, 2)
                    .join("")}
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
              {profileOpen && (
                <div className="absolute right-0 top-11 w-64 overflow-hidden rounded-xl border border-border bg-surface shadow-card">
                  <div className="border-b border-border px-3.5 py-2.5">
                    <p className="text-sm font-semibold text-foreground">{partner.ownerName}</p>
                    <p className="text-xs text-muted-foreground">{partner.businessName}</p>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-3.5 py-2.5 text-sm font-semibold text-destructive"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 px-5 py-6 sm:px-8 sm:py-8">{children}</main>
      </div>
    </div>
  );
}