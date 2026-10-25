/**
 * Partner notifications — the persisted inbox behind the bell.
 *
 * Rows in `partner_notifications` are written by database triggers when
 * something really happens (new booking, cancellation, payout, venue
 * approval, review, support reply) — see 20261024010000_partner_notifications.sql.
 * This provider loads them, keeps them live over Realtime (with a slow poll
 * as a safety net), and owns the read / mark-all-read actions.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "./supabaseClient";
import { useAuth } from "./auth";
import { onForegroundPush, refreshPushToken } from "./push";

export type NotificationKind =
  | "new_booking"
  | "cancellation"
  | "payout"
  | "venue_status"
  | "review"
  | "support"
  | "system";

export type PartnerNotification = {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  link: string | null;
  createdAt: string;
  read: boolean;
};

type Row = {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  link: string | null;
  created_at: string;
  read_at: string | null;
};

type Ctx = {
  notifications: PartnerNotification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
};

const NotificationsContext = createContext<Ctx | null>(null);

const POLL_MS = 90_000;

export function PartnerNotificationsProvider({ children }: { children: ReactNode }) {
  const { partner } = useAuth();
  const partnerId = partner?.id ?? null;
  const [notifications, setNotifications] = useState<PartnerNotification[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!partnerId) {
      setNotifications([]);
      return;
    }
    const { data, error } = await supabase
      .from("partner_notifications")
      .select("id, kind, title, body, link, created_at, read_at")
      .eq("partner_id", partnerId)
      .order("created_at", { ascending: false })
      .limit(100)
      .returns<Row[]>();
    if (error) {
      // Table not installed yet (migration pending) — behave as an empty inbox.
      console.error("fetch partner_notifications failed:", error.message);
      return;
    }
    setNotifications(
      (data ?? []).map((r) => ({
        id: r.id,
        kind: r.kind,
        title: r.title,
        body: r.body,
        link: r.link,
        createdAt: r.created_at,
        read: r.read_at !== null,
      })),
    );
  }, [partnerId]);

  useEffect(() => {
    if (!partnerId) {
      setNotifications([]);
      return;
    }
    setLoading(true);
    void refresh().finally(() => setLoading(false));

    const channel = supabase
      .channel(`partner-notifications-${partnerId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "partner_notifications",
          filter: `partner_id=eq.${partnerId}`,
        },
        () => void refresh(),
      )
      .subscribe();
    const poll = setInterval(() => void refresh(), POLL_MS);
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);

    return () => {
      clearInterval(poll);
      window.removeEventListener("focus", onFocus);
      void supabase.removeChannel(channel);
    };
  }, [partnerId, refresh]);

  // Already allowed notifications? Keep this browser's token on the account,
  // and refresh the bell the moment a push lands while the dashboard is open.
  useEffect(() => {
    if (!partnerId) return;
    void refreshPushToken("partner");
    let off: (() => void) | undefined;
    let cancelled = false;
    void onForegroundPush(() => void refresh()).then((u) => {
      if (cancelled) u();
      else off = u;
    });
    return () => {
      cancelled = true;
      off?.();
    };
  }, [partnerId, refresh]);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    // supabase-js builders are lazy: the request is only sent once .then() is
    // called, so a bare `void supabase.rpc(...)` never reaches the server.
    void supabase.rpc("mark_partner_notification_read", { p_id: id }).then(({ error }) => {
      if (error) {
        console.error("mark notification read failed:", error.message);
        void refresh(); // roll the optimistic change back to the server's truth
      }
    });
  }, [refresh]);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    void supabase.rpc("mark_all_partner_notifications_read").then(({ error }) => {
      if (error) {
        console.error("mark all notifications read failed:", error.message);
        void refresh();
      }
    });
  }, [refresh]);

  const value = useMemo<Ctx>(
    () => ({
      notifications,
      unreadCount: notifications.filter((n) => !n.read).length,
      loading,
      markAsRead,
      markAllAsRead,
    }),
    [notifications, loading, markAsRead, markAllAsRead],
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function usePartnerNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("usePartnerNotifications must be used inside <PartnerNotificationsProvider>");
  return ctx;
}
