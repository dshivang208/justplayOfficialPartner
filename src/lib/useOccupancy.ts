/**
 * Real occupancy: of the slots the venue actually offered, how many got
 * booked. Replaces the hardcoded "74%".
 *
 *   occupancy = booked / (booked + available)
 *
 * 'blocked' slots (maintenance, private events, owner-closed days) are left
 * out of BOTH sides — an hour the owner took off sale was never available to
 * sell, so it shouldn't drag the rate down. Past slots nobody bought stay in
 * the denominator as 'available': that unsold capacity is exactly what
 * occupancy is meant to show.
 *
 * Window and comparison match the other KPIs (last 7 days vs the 7 before).
 * Returns `rate: null` — rendered as "—", never as "0%" — when no slots
 * exist in the window (e.g. a venue that hasn't generated any yet), because
 * "no data" and "completely empty" are different statements.
 */
import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { localISODate, shiftISODate } from "./dashboardStats";

export type Occupancy = {
  /** 0-100, or null when there were no bookable slots in the window. */
  rate: number | null;
  /** Percentage-point change vs the previous 7 days, undefined if either window has no data. */
  delta: number | undefined;
};

async function rateForWindow(venueId: string, from: string, to: string): Promise<number | null> {
  const count = (status: "booked" | "available") =>
    supabase
      .from("slots")
      .select("id", { count: "exact", head: true })
      .eq("venue_id", venueId)
      .eq("status", status)
      .gte("date", from)
      .lte("date", to);

  const [booked, available] = await Promise.all([count("booked"), count("available")]);
  if (booked.error) throw new Error(booked.error.message);
  if (available.error) throw new Error(available.error.message);

  const total = (booked.count ?? 0) + (available.count ?? 0);
  if (total === 0) return null;
  return Math.round(((booked.count ?? 0) / total) * 100);
}

export function useOccupancy(venueId: string | null, refreshKey: unknown = 0) {
  const [occupancy, setOccupancy] = useState<Occupancy | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!venueId) return;
    let active = true;
    const today = localISODate(new Date());

    Promise.all([
      rateForWindow(venueId, shiftISODate(today, -6), today),
      rateForWindow(venueId, shiftISODate(today, -13), shiftISODate(today, -7)),
    ])
      .then(([current, previous]) => {
        if (!active) return;
        setError(null);
        setOccupancy({
          rate: current,
          delta: current != null && previous != null ? current - previous : undefined,
        });
      })
      .catch((e: unknown) => {
        if (!active) return;
        console.error("occupancy failed:", e);
        setError(e instanceof Error ? e.message : "Could not load occupancy.");
      });

    return () => {
      active = false;
    };
    // refreshKey: re-count when the number of bookings changes, since a new
    // or cancelled booking flips a slot between booked and available.
  }, [venueId, refreshKey]);

  return { occupancy, error, loading: occupancy === null && error === null };
}
