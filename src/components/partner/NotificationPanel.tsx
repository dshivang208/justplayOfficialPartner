import { useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  BellOff,
  Building2,
  CalendarCheck,
  CalendarX2,
  CheckCheck,
  Headset,
  Star,
  Wallet,
} from "lucide-react";
import {
  usePartnerNotifications,
  type NotificationKind,
  type PartnerNotification,
} from "@/lib/partnerNotifications";

const ICONS: Record<NotificationKind, { icon: ReactNode; tone: string }> = {
  new_booking: { icon: <CalendarCheck className="h-4 w-4" />, tone: "bg-primary/10 text-primary" },
  cancellation: { icon: <CalendarX2 className="h-4 w-4" />, tone: "bg-destructive/10 text-destructive" },
  payout: { icon: <Wallet className="h-4 w-4" />, tone: "bg-accent/15 text-accent" },
  venue_status: { icon: <Building2 className="h-4 w-4" />, tone: "bg-primary/10 text-primary" },
  review: { icon: <Star className="h-4 w-4" />, tone: "bg-accent/15 text-accent" },
  support: { icon: <Headset className="h-4 w-4" />, tone: "bg-primary/10 text-primary" },
  system: { icon: <Building2 className="h-4 w-4" />, tone: "bg-secondary text-muted-foreground" },
};

function timeAgo(iso: string) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function groupLabel(iso: string) {
  const start = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((start(new Date()) - start(new Date(iso))) / 86_400_000);
  if (diff <= 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return "This week";
  return "Earlier";
}

/**
 * The notification inbox — used in the bell dropdown and on the full
 * notifications page. Grouped by day, tap to open the related page.
 */
export function NotificationPanel({
  onNavigate,
  header,
  maxHeightClass = "max-h-[min(26rem,60vh)]",
}: {
  onNavigate?: () => void;
  /** Extra content above the list (e.g. the "needs attention" alerts). */
  header?: ReactNode;
  maxHeightClass?: string;
}) {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = usePartnerNotifications();
  const [tab, setTab] = useState<"all" | "unread">("all");

  const grouped = useMemo(() => {
    const list = tab === "unread" ? notifications.filter((n) => !n.read) : notifications;
    const out: { label: string; items: PartnerNotification[] }[] = [];
    for (const n of list) {
      const label = groupLabel(n.createdAt);
      const last = out[out.length - 1];
      if (last && last.label === label) last.items.push(n);
      else out.push({ label, items: [n] });
    }
    return out;
  }, [notifications, tab]);

  const open = (n: PartnerNotification) => {
    if (!n.read) markAsRead(n.id);
    if (n.link) {
      onNavigate?.();
      void navigate({ to: n.link as "/dashboard" });
    }
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold text-foreground">Notifications</p>
          {unreadCount > 0 ? (
            <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-bold text-destructive">
              {unreadCount} new
            </span>
          ) : null}
        </div>
        {unreadCount > 0 ? (
          <button
            type="button"
            onClick={markAllAsRead}
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            <CheckCheck className="h-3.5 w-3.5" /> Mark all read
          </button>
        ) : null}
      </div>

      <div className="flex gap-1 border-b border-border px-3 py-2">
        {(["all", "unread"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-full px-3 py-1 text-xs font-semibold capitalize transition-colors ${
              tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className={`min-h-0 overflow-y-auto ${maxHeightClass}`}>
        {header}
        {grouped.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-muted-foreground">
              <BellOff className="h-5 w-5" />
            </span>
            <p className="text-sm font-semibold text-foreground">
              {tab === "unread" ? "No unread notifications" : "You're all caught up"}
            </p>
            <p className="text-xs text-muted-foreground">
              New bookings, cancellations, payouts, reviews and replies from JustPlay Support show up here.
            </p>
          </div>
        ) : (
          grouped.map((g) => (
            <section key={g.label}>
              <p className="sticky top-0 bg-surface-raised px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {g.label}
              </p>
              <ul className="divide-y divide-border">
                {g.items.map((n) => {
                  const meta = ICONS[n.kind] ?? ICONS.system;
                  return (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={() => open(n)}
                        className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary/60 ${
                          n.read ? "" : "bg-primary/5"
                        }`}
                      >
                        <span
                          className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${meta.tone}`}
                        >
                          {meta.icon}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center justify-between gap-2">
                            <span
                              className={`truncate text-sm text-foreground ${n.read ? "font-medium" : "font-bold"}`}
                            >
                              {n.title}
                            </span>
                            <span className="shrink-0 text-[11px] text-muted-foreground">
                              {timeAgo(n.createdAt)}
                            </span>
                          </span>
                          <span className="mt-0.5 line-clamp-3 block text-[13px] leading-snug text-muted-foreground">
                            {n.body}
                          </span>
                        </span>
                        {!n.read ? (
                          <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))
        )}
      </div>
    </div>
  );
}
