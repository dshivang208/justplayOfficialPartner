import { createFileRoute } from "@tanstack/react-router";
import { NotificationPanel } from "@/components/partner/NotificationPanel";

export const Route = createFileRoute("/dashboard/notifications")({
  head: () => ({ meta: [{ title: "Notifications | JustPlay Partner" }] }),
  component: NotificationsPage,
});

function NotificationsPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl font-semibold text-foreground sm:text-[28px]">Notifications</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Everything that happened at your venue. Choose which alerts you want under Venue Settings →
        Notifications.
      </p>
      <div className="surface-card mt-6 overflow-hidden rounded-2xl">
        <NotificationPanel maxHeightClass="max-h-none" />
      </div>
    </div>
  );
}
