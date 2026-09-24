/**
 * JustPlay Partner — notification preferences (Backend Phase E).
 *
 * True CRUD against `partner_settings`, scoped to this signed-in partner
 * (RLS: `auth.uid() = partner_id`) — plain client reads/writes, no RPC
 * needed, per the brief's own "straightforward CRUD" framing. Toggling a
 * single cell is optimistic (flip locally, upsert in the background,
 * revert + log on failure) so the toggle grid still feels instant.
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

export type NotificationChannel = "sms" | "email" | "inApp";
export type NotificationEvent = "newBooking" | "cancellation" | "payout" | "lowOccupancy";

export type NotificationPrefs = Record<NotificationEvent, Record<NotificationChannel, boolean>>;

const DEFAULT_PREFS: NotificationPrefs = {
  newBooking: { sms: true, email: false, inApp: true },
  cancellation: { sms: true, email: true, inApp: true },
  payout: { sms: false, email: true, inApp: true },
  lowOccupancy: { sms: false, email: false, inApp: true },
};

type NotificationPrefsContextValue = {
  loading: boolean;
  prefs: NotificationPrefs;
  toggle: (event: NotificationEvent, channel: NotificationChannel) => void;
};

const NotificationPrefsContext = createContext<NotificationPrefsContextValue | null>(null);

export function NotificationPrefsProvider({ children }: { children: ReactNode }) {
  const { partner } = useAuth();
  const [loading, setLoading] = useState(false);
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS);

  useEffect(() => {
    if (!partner) {
      setPrefs(DEFAULT_PREFS);
      return;
    }
    setLoading(true);
    void supabase
      .from("partner_settings")
      .select("notification_prefs")
      .eq("partner_id", partner.id)
      .maybeSingle<{ notification_prefs: NotificationPrefs }>()
      .then(({ data, error }) => {
        if (error) console.error("fetch partner_settings failed:", error.message);
        setPrefs(data?.notification_prefs ?? DEFAULT_PREFS);
        setLoading(false);
      });
  }, [partner]);

  const toggle = useCallback(
    (event: NotificationEvent, channel: NotificationChannel) => {
      if (!partner) return;
      let next: NotificationPrefs | null = null;
      setPrefs((prev) => {
        next = { ...prev, [event]: { ...prev[event], [channel]: !prev[event][channel] } };
        return next;
      });

      void supabase
        .from("partner_settings")
        .upsert(
          {
            partner_id: partner.id,
            notification_prefs: next,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "partner_id" },
        )
        .then(({ error }) => {
          if (error) {
            console.error("save notification_prefs failed:", error.message);
            setPrefs((prev) => ({
              ...prev,
              [event]: { ...prev[event], [channel]: !prev[event][channel] },
            }));
          }
        });
    },
    [partner],
  );

  const value = useMemo<NotificationPrefsContextValue>(
    () => ({ loading, prefs, toggle }),
    [loading, prefs, toggle],
  );

  return (
    <NotificationPrefsContext.Provider value={value}>{children}</NotificationPrefsContext.Provider>
  );
}

export function useNotificationPrefs() {
  const ctx = useContext(NotificationPrefsContext);
  if (!ctx) throw new Error("useNotificationPrefs must be used inside <NotificationPrefsProvider>");
  return ctx;
}