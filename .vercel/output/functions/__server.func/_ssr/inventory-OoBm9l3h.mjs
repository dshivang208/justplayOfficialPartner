import { n as supabase } from "./auth-DbMKYDei.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/inventory-OoBm9l3h.js
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
var DURATION_OPTIONS = [
	30,
	45,
	60,
	90
];
var SPORT_OPTIONS = [
	"Box Cricket",
	"Football",
	"Badminton",
	"Table Tennis",
	"Tennis",
	"Pickleball",
	"Basketball"
];
function timeToMinutes(t) {
	const [h, m] = t.split(":").map(Number);
	return (h ?? 0) * 60 + (m ?? 0);
}
function minutesToTime(mins) {
	const h = Math.floor(mins / 60) % 24;
	const m = mins % 60;
	return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
function formatTimeLabel(t) {
	const mins = timeToMinutes(t);
	const h24 = Math.floor(mins / 60);
	const m = mins % 60;
	const suffix = h24 >= 12 ? "PM" : "AM";
	return `${h24 % 12 === 0 ? 12 : h24 % 12}:${String(m).padStart(2, "0")} ${suffix}`;
}
function dateISO(d) {
	return d.toISOString().slice(0, 10);
}
/** True when closesAt is on or before opensAt — i.e. the court's hours
*  cross midnight (including the "equal = 24 hours" case). Purely for
*  display, so the UI can label the closing time "(next day)". */
function isOvernightRange(opensAt, closesAt) {
	return timeToMinutes(closesAt) <= timeToMinutes(opensAt);
}
function addDays(d, n) {
	const copy = new Date(d);
	copy.setDate(copy.getDate() + n);
	return copy;
}
function startOfWeek(d) {
	const copy = new Date(d);
	const day = copy.getDay();
	const diff = day === 0 ? -6 : 1 - day;
	copy.setDate(copy.getDate() + diff);
	copy.setHours(0, 0, 0, 0);
	return copy;
}
function weekDates(weekStart) {
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
function rangeDurationMinutes(opensAt, closesAt) {
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
function courtTimeRows(court) {
	if (!court.opensAt || !court.closesAt || !court.slotDurationMinutes) return [];
	const startMin = timeToMinutes(court.opensAt);
	const duration = court.slotDurationMinutes;
	const totalMinutes = rangeDurationMinutes(court.opensAt, court.closesAt);
	const rows = [];
	for (let offset = 0; offset + duration <= totalMinutes; offset += duration) rows.push(minutesToTime(startMin + offset));
	return rows;
}
function rowToCourt(row) {
	return {
		id: row.id,
		name: row.name,
		sport: row.sport,
		status: row.status,
		opensAt: row.opens_at,
		closesAt: row.closes_at,
		slotDurationMinutes: row.slot_duration_minutes,
		slotsGeneratedUntil: row.slots_generated_until
	};
}
async function fetchCourts(venueId) {
	const { data, error } = await supabase.from("courts").select("id, name, sport, status, opens_at, closes_at, slot_duration_minutes, slots_generated_until").eq("venue_id", venueId).order("created_at", { ascending: true });
	if (error) {
		console.error("fetchCourts failed:", error.message);
		return [];
	}
	return (data ?? []).map(rowToCourt);
}
async function fetchPriceRules(venueId) {
	const { data, error } = await supabase.from("venue_pricing").select("id, court_id, band_label, start_time, end_time, price_per_slot").eq("venue_id", venueId).not("court_id", "is", null);
	if (error) {
		console.error("fetchPriceRules failed:", error.message);
		return [];
	}
	return (data ?? []).map((row) => ({
		id: row.id,
		courtId: row.court_id,
		label: row.band_label ?? "",
		startTime: row.start_time ?? "00:00",
		endTime: row.end_time ?? "23:59",
		pricePerSlot: row.price_per_slot
	}));
}
async function fetchExceptions(venueId) {
	const { data, error } = await supabase.from("venue_exceptions").select("id, date, type, opens_at, closes_at, reason").eq("venue_id", venueId).order("date", { ascending: true });
	if (error) {
		console.error("fetchExceptions failed:", error.message);
		return [];
	}
	return (data ?? []).map((row) => ({
		id: row.id,
		date: row.date,
		type: row.type,
		reason: row.reason,
		...row.opens_at ? { opensAt: row.opens_at } : {},
		...row.closes_at ? { closesAt: row.closes_at } : {}
	}));
}
/** Real slots for one court across an inclusive date range — the calendar
*  calls this for whatever 7-day week (or single day) is on screen. */
async function fetchSlotsForCourt(courtId, dateFrom, dateTo) {
	const { data, error } = await supabase.from("slots").select("id, court_id, sport, date, start_time, end_time, price, status, blocked_reason").eq("court_id", courtId).gte("date", dateFrom).lte("date", dateTo).order("date", { ascending: true }).order("start_time", { ascending: true });
	if (error) {
		console.error("fetchSlotsForCourt failed:", error.message);
		return [];
	}
	const now = Date.now();
	return (data ?? []).map((row) => {
		const slotStart = (/* @__PURE__ */ new Date(`${row.date}T${row.start_time}`)).getTime();
		const status = row.status === "available" && slotStart < now ? "past" : row.status;
		return {
			id: row.id,
			courtId: row.court_id,
			sport: row.sport,
			date: row.date,
			startTime: row.start_time.slice(0, 5),
			endTime: row.end_time.slice(0, 5),
			price: row.price,
			status,
			blockedReason: row.blocked_reason
		};
	});
}
//#endregion
export { dateISO as a, fetchPriceRules as c, isOvernightRange as d, rangeDurationMinutes as f, courtTimeRows as i, fetchSlotsForCourt as l, weekDates as m, SPORT_OPTIONS as n, fetchCourts as o, startOfWeek as p, addDays as r, fetchExceptions as s, DURATION_OPTIONS as t, formatTimeLabel as u };
