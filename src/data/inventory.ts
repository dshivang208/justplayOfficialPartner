/**
 * Slot & Inventory data model — Backend Phase B.
 *
 * Courts, price bands, exceptions and slots are now real rows in the
 * shared Supabase project (`courts`, `venue_pricing`, `venue_exceptions`,
 * `slots`) — see supabase/migrations/20260829040000_partner_phase_b_slots.sql.
 * This file lost its old `deriveSlotsForDate` machinery: slots used to be
 * computed client-side from rules + overrides because there was nothing
 * to fetch; now there is, so the calendar just queries the real rows for
 * whatever date range is visible, the same way the consumer app already
 * fetches its own availability.
 *
 * `defaultCourtStubs` is the one piece kept purely for backward
 * compatibility — `lib/bookings.tsx` and `lib/payouts.tsx` (Backend Phases
 * C and D, not built yet) still use it to fabricate mock court references.
 * Once those phases go real, their court ids will come from the same
 * `courts` table this file now queries, and this function can go away.
 */
import { supabase } from "@/lib/supabaseClient";

export type SlotDurationMinutes = 30 | 45 | 60 | 90;

export type Court = {
  id: string;
  name: string;
  sport: string;
  status: "active" | "inactive";
  /** Null until the owner runs Bulk Setup at least once for this court. */
  opensAt: string | null; // "06:00"
  closesAt: string | null; // "23:00"
  slotDurationMinutes: SlotDurationMinutes | null;
  /** Date (yyyy-mm-dd) up to which slots have been generated, or null. */
  slotsGeneratedUntil: string | null;
};

export type PriceRule = {
  id: string;
  courtId: string;
  label: string;
  /** "06:00" */
  startTime: string;
  /** "12:00" — exclusive end of the band */
  endTime: string;
  pricePerSlot: number;
};

export type DateException = {
  id: string;
  date: string; // yyyy-mm-dd
  type: "closed" | "modified_hours";
  opensAt?: string;
  closesAt?: string;
  reason: string;
};

export type SlotStatus = "available" | "booked" | "blocked" | "past";

export type RealSlot = {
  id: string;
  courtId: string;
  sport: string;
  date: string;
  startTime: string; // "18:00"
  endTime: string; // "19:00"
  price: number;
  status: SlotStatus;
  blockedReason: string | null;
};

export const DURATION_OPTIONS: SlotDurationMinutes[] = [30, 45, 60, 90];

export const SPORT_OPTIONS = [
  "Box Cricket",
  "Football",
  "Badminton",
  "Table Tennis",
  "Tennis",
  "Pickleball",
  "Basketball",
];

export function defaultCourtStubs(sports: string[]): { id: string; name: string; sport: string }[] {
  if (sports.length === 0) return [];
  return sports.map((sport, i) => ({
    id: `court_${i + 1}`,
    name:
      sports.length > 1
        ? `${sport === "Box Cricket" ? "Cage" : "Turf"} ${i === 0 ? "A" : "B"} \u2014 ${sport}`
        : sport,
    sport,
  }));
}

/* --------------------------------------------------------------------- */

export function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function formatTimeLabel(t: string): string {
  const mins = timeToMinutes(t);
  const h24 = Math.floor(mins / 60);
  const m = mins % 60;
  const suffix = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
}

export function dateISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** True when closesAt is on or before opensAt — i.e. the court's hours
 *  cross midnight (including the "equal = 24 hours" case). Purely for
 *  display, so the UI can label the closing time "(next day)". */
export function isOvernightRange(opensAt: string, closesAt: string): boolean {
  return timeToMinutes(closesAt) <= timeToMinutes(opensAt);
}

export function addDays(d: Date, n: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
}

export function startOfWeek(d: Date): Date {
  const copy = new Date(d);
  const day = copy.getDay(); // 0 = Sun
  const diff = day === 0 ? -6 : 1 - day; // week starts Monday
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function weekDates(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

/**
 * Minutes between opensAt and closesAt, treating closesAt <= opensAt as
 * wrapping past midnight into the next day rather than as invalid —
 * "22:00–06:00" is an 8-hour overnight window, and opensAt === closesAt
 * (e.g. "06:00"–"06:00") is a full 24-hour day, not zero hours. This is
 * the one place that math lives; both the setup wizard's slot-count
 * preview and courtTimeRows below go through it so they can't drift.
 */
export function rangeDurationMinutes(opensAt: string, closesAt: string): number {
  const startMin = timeToMinutes(opensAt);
  const endMin = timeToMinutes(closesAt);
  return endMin > startMin ? endMin - startMin : 1440 - startMin + endMin;
}

/**
 * The court's time rows (start times), independent of any date — the
 * shared row axis the weekly grid renders across all 7 columns. Purely
 * derived from the court's own opens/closes/duration, same math the
 * backend's partner_generate_slots RPC used to actually create the rows,
 * so the grid's rows always line up with what's really in the DB.
 *
 * Handles overnight courts (closesAt <= opensAt) — minutesToTime already
 * wraps any total past 1440 back into a valid 00:00–23:59 time-of-day, so
 * a 22:00-opening court's rows correctly continue 22:00, 23:00, 00:00,
 * 01:00, ... rather than stopping dead at opensAt.
 */
export function courtTimeRows(court: Court): string[] {
  if (!court.opensAt || !court.closesAt || !court.slotDurationMinutes) return [];
  const startMin = timeToMinutes(court.opensAt);
  const duration = court.slotDurationMinutes;
  const totalMinutes = rangeDurationMinutes(court.opensAt, court.closesAt);
  const rows: string[] = [];
  for (let offset = 0; offset + duration <= totalMinutes; offset += duration) {
    rows.push(minutesToTime(startMin + offset));
  }
  return rows;
}

/* --------------------------------------------------------------------- */
/* Real Supabase reads                                                    */
/* --------------------------------------------------------------------- */

type CourtRow = {
  id: string;
  name: string;
  sport: string;
  status: "active" | "inactive";
  opens_at: string | null;
  closes_at: string | null;
  slot_duration_minutes: SlotDurationMinutes | null;
  slots_generated_until: string | null;
};

function rowToCourt(row: CourtRow): Court {
  return {
    id: row.id,
    name: row.name,
    sport: row.sport,
    status: row.status,
    opensAt: row.opens_at,
    closesAt: row.closes_at,
    slotDurationMinutes: row.slot_duration_minutes,
    slotsGeneratedUntil: row.slots_generated_until,
  };
}

export async function fetchCourts(venueId: string): Promise<Court[]> {
  const { data, error } = await supabase
    .from("courts")
    .select(
      "id, name, sport, status, opens_at, closes_at, slot_duration_minutes, slots_generated_until",
    )
    .eq("venue_id", venueId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("fetchCourts failed:", error.message);
    return [];
  }
  return (data ?? []).map(rowToCourt);
}

type PriceRow = {
  id: string;
  court_id: string | null;
  band_label: string | null;
  start_time: string | null;
  end_time: string | null;
  price_per_slot: number;
};

export async function fetchPriceRules(venueId: string): Promise<PriceRule[]> {
  const { data, error } = await supabase
    .from("venue_pricing")
    .select("id, court_id, band_label, start_time, end_time, price_per_slot")
    .eq("venue_id", venueId)
    .not("court_id", "is", null);

  if (error) {
    console.error("fetchPriceRules failed:", error.message);
    return [];
  }

  return (data ?? []).map((row: PriceRow) => ({
    id: row.id,
    courtId: row.court_id!,
    label: row.band_label ?? "",
    startTime: row.start_time ?? "00:00",
    endTime: row.end_time ?? "23:59",
    pricePerSlot: row.price_per_slot,
  }));
}

type ExceptionRow = {
  id: string;
  date: string;
  type: "closed" | "modified_hours";
  opens_at: string | null;
  closes_at: string | null;
  reason: string;
};

export async function fetchExceptions(venueId: string): Promise<DateException[]> {
  const { data, error } = await supabase
    .from("venue_exceptions")
    .select("id, date, type, opens_at, closes_at, reason")
    .eq("venue_id", venueId)
    .order("date", { ascending: true });

  if (error) {
    console.error("fetchExceptions failed:", error.message);
    return [];
  }

  return (data ?? []).map((row: ExceptionRow) => ({
    id: row.id,
    date: row.date,
    type: row.type,
    reason: row.reason,
    ...(row.opens_at ? { opensAt: row.opens_at } : {}),
    ...(row.closes_at ? { closesAt: row.closes_at } : {}),
  }));
}

type SlotRow = {
  id: string;
  court_id: string;
  sport: string;
  date: string;
  start_time: string;
  end_time: string;
  price: number;
  status: "available" | "booked" | "blocked";
  blocked_reason: string | null;
};

/** Real slots for one court across an inclusive date range — the calendar
 *  calls this for whatever 7-day week (or single day) is on screen. */
export async function fetchSlotsForCourt(
  courtId: string,
  dateFrom: string,
  dateTo: string,
): Promise<RealSlot[]> {
  const { data, error } = await supabase
    .from("slots")
    .select("id, court_id, sport, date, start_time, end_time, price, status, blocked_reason")
    .eq("court_id", courtId)
    .gte("date", dateFrom)
    .lte("date", dateTo)
    .order("date", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) {
    console.error("fetchSlotsForCourt failed:", error.message);
    return [];
  }

  const now = Date.now();

  return (data ?? []).map((row: SlotRow) => {
    const slotStart = new Date(`${row.date}T${row.start_time}`).getTime();
    const status: SlotStatus = row.status === "available" && slotStart < now ? "past" : row.status;
    return {
      id: row.id,
      courtId: row.court_id,
      sport: row.sport,
      date: row.date,
      startTime: row.start_time.slice(0, 5),
      endTime: row.end_time.slice(0, 5),
      price: row.price,
      status,
      blockedReason: row.blocked_reason,
    };
  });
}