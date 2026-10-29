import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { VenueQrCard, type QrStats } from "@/components/partner/VenueQrCard";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabaseClient";

export const Route = createFileRoute("/dashboard/settings/qr")({
  head: () => ({ meta: [{ title: "QR Code | JustPlay Partner" }] }),
  component: VenueQrPage,
});

function VenueQrPage() {
  const { partner } = useAuth();
  const venueId = partner?.venueId;
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [stats, setStats] = useState<QrStats>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!venueId) return;
    let active = true;
    void (async () => {
      // Both are best-effort: before the qr_entry migration is applied the column / function
      // don't exist yet, and the card explains that instead of breaking the page.
      const { data } = await supabase.from("venues").select("qr_code").eq("id", venueId).maybeSingle();
      const { data: s } = await supabase.rpc("partner_venue_qr_stats", { p_venue_id: venueId });
      if (!active) return;
      setQrCode((data as { qr_code?: string | null } | null)?.qr_code ?? null);
      const row = Array.isArray(s) ? s[0] : null;
      setStats(row ? { total: Number(row.total), last7d: Number(row.last_7d), last30d: Number(row.last_30d) } : null);
      setLoaded(true);
    })();
    return () => {
      active = false;
    };
  }, [venueId]);

  if (!partner || !loaded) return <p className="text-sm text-muted-foreground">Loading…</p>;
  return <VenueQrCard venueName={partner.venueName} qrCode={qrCode} stats={stats} />;
}
