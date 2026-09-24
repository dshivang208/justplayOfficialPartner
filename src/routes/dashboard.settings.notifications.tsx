import { createFileRoute } from "@tanstack/react-router";
import {
  useNotificationPrefs,
  type NotificationChannel,
  type NotificationEvent,
} from "@/lib/notifications";
import { Toggle } from "@/components/partner/Toggle";

export const Route = createFileRoute("/dashboard/settings/notifications")({
  head: () => ({ meta: [{ title: "Notifications | JustPlay Partner" }] }),
  component: NotificationsPage,
});

const EVENTS: { key: NotificationEvent; label: string; description: string }[] = [
  { key: "newBooking", label: "New booking", description: "Someone books a slot at your venue" },
  { key: "cancellation", label: "Cancellation", description: "A booking is cancelled" },
  { key: "payout", label: "Payout", description: "A payout is processed or scheduled" },
  {
    key: "lowOccupancy",
    label: "Low occupancy",
    description: "Upcoming slots are unusually empty",
  },
];

const CHANNELS: { key: NotificationChannel; label: string }[] = [
  { key: "sms", label: "SMS" },
  { key: "email", label: "Email" },
  { key: "inApp", label: "In-app" },
];

function NotificationsPage() {
  const { prefs, toggle } = useNotificationPrefs();

  return (
    <div className="surface-card overflow-hidden rounded-2xl">
      <div className="grid grid-cols-[1fr_repeat(3,80px)] items-center gap-2 border-b border-border bg-surface-raised px-5 py-3">
        <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
          Event
        </span>
        {CHANNELS.map((c) => (
          <span
            key={c.key}
            className="text-center text-[11px] font-bold uppercase tracking-wide text-muted-foreground"
          >
            {c.label}
          </span>
        ))}
      </div>
      <div className="flex flex-col divide-y divide-border">
        {EVENTS.map((event) => (
          <div
            key={event.key}
            className="grid grid-cols-[1fr_repeat(3,80px)] items-center gap-2 px-5 py-4"
          >
            <div>
              <p className="text-sm font-semibold text-foreground">{event.label}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{event.description}</p>
            </div>
            {CHANNELS.map((c) => (
              <div key={c.key} className="flex justify-center">
                <Toggle
                  checked={prefs[event.key][c.key]}
                  onChange={() => toggle(event.key, c.key)}
                  label={`${event.label} via ${c.label}`}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
