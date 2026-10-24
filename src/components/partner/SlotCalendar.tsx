import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Lock, User } from "lucide-react";
import {
  courtTimeRows,
  formatTimeLabel,
  weekDates,
  type Court,
  type RealSlot,
  type SlotStatus,
} from "@/data/inventory";

const STATUS_STYLES: Record<SlotStatus, string> = {
  available:
    "border border-primary/25 bg-primary/[0.06] text-foreground hover:bg-primary/[0.12] cursor-pointer",
  booked:
    "border border-primary/40 bg-primary/15 text-foreground hover:bg-primary/20 cursor-pointer",
  blocked:
    "border border-border bg-surface-raised text-muted-foreground hover:bg-secondary cursor-pointer",
  past: "border border-border/60 bg-surface-raised/50 text-muted-foreground/50 cursor-not-allowed",
};

function dayLabel(d: Date) {
  return d.toLocaleDateString("en-IN", { weekday: "short" });
}
function dayNumber(d: Date) {
  return d.getDate();
}
function isToday(d: Date) {
  const t = new Date();
  return d.toDateString() === t.toDateString();
}
function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function CalendarLegend() {
  const items: { status: SlotStatus; label: string }[] = [
    { status: "available", label: "Available" },
    { status: "booked", label: "Booked" },
    { status: "blocked", label: "Blocked" },
    { status: "past", label: "Past" },
  ];
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {items.map((it) => (
        <div key={it.status} className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span
            className={`h-3 w-3 rounded ${STATUS_STYLES[it.status].split(" ")[1]} border border-border`}
          />
          {it.label}
        </div>
      ))}
    </div>
  );
}

function SlotCell({
  slot,
  selected,
  onClick,
}: {
  slot: RealSlot | undefined;
  selected: boolean;
  onClick: (s: RealSlot) => void;
}) {
  if (!slot) return <div className="h-11 rounded-lg bg-transparent" />;

  const clickable = slot.status !== "past";

  return (
    <button
      disabled={!clickable}
      onClick={() => clickable && onClick(slot)}
      className={`flex h-11 w-full flex-col items-center justify-center rounded-lg text-[11px] font-semibold leading-tight transition-colors ${STATUS_STYLES[slot.status]} ${
        selected ? "ring-2 ring-primary ring-offset-1 ring-offset-surface" : ""
      }`}
      title={slot.status === "blocked" && slot.blockedReason ? slot.blockedReason : undefined}
    >
      {selected ? (
        <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
      ) : slot.status === "booked" ? (
        <User className="h-3.5 w-3.5" />
      ) : slot.status === "blocked" ? (
        <Lock className="h-3.5 w-3.5" />
      ) : slot.status === "past" ? (
        <span className="text-[10px]">&mdash;</span>
      ) : (
        <span>₹{slot.price}</span>
      )}
    </button>
  );
}

export function WeeklyCalendar({
  court,
  slots,
  weekStart,
  isSelected,
  onSlotClick,
}: {
  court: Court;
  slots: RealSlot[];
  weekStart: Date;
  isSelected: (slot: RealSlot) => boolean;
  onSlotClick: (slot: RealSlot) => void;
}) {
  const rows = useMemo(() => courtTimeRows(court), [court]);
  const days = useMemo(() => weekDates(weekStart), [weekStart]);

  const slotsByDay = useMemo(() => {
    const map = new Map<string, Map<string, RealSlot>>();
    for (const s of slots) {
      if (!map.has(s.date)) map.set(s.date, new Map());
      map.get(s.date)!.set(s.startTime, s);
    }
    return map;
  }, [slots]);

  if (rows.length === 0) return null;

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[720px]">
        <div className="grid grid-cols-[64px_repeat(7,1fr)] gap-1.5">
          <div />
          {days.map((d) => (
            <div
              key={iso(d)}
              className={`rounded-lg py-1.5 text-center ${isToday(d) ? "bg-primary/10" : ""}`}
            >
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {dayLabel(d)}
              </p>
              <p className={`text-sm font-bold ${isToday(d) ? "text-primary" : "text-foreground"}`}>
                {dayNumber(d)}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-1.5 flex flex-col gap-1.5">
          {rows.map((time) => (
            <div key={time} className="grid grid-cols-[64px_repeat(7,1fr)] items-center gap-1.5">
              <span className="pr-1 text-right text-[11px] font-medium text-muted-foreground">
                {formatTimeLabel(time)}
              </span>
              {days.map((d) => {
                const dateStr = iso(d);
                const slot = slotsByDay.get(dateStr)?.get(time);
                return (
                  <SlotCell
                    key={dateStr + time}
                    slot={slot}
                    selected={slot ? isSelected(slot) : false}
                    onClick={onSlotClick}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function DailyCalendar({
  slots,
  isSelected,
  onSlotClick,
}: {
  slots: RealSlot[];
  isSelected: (slot: RealSlot) => boolean;
  onSlotClick: (slot: RealSlot) => void;
}) {
  if (slots.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {slots.map((slot) => {
        const clickable = slot.status !== "past";
        const selected = isSelected(slot);
        return (
          <button
            key={slot.id}
            disabled={!clickable}
            onClick={() => clickable && onSlotClick(slot)}
            className={`flex items-center justify-between rounded-xl px-4 py-3 text-left text-sm transition-colors ${STATUS_STYLES[slot.status]} ${
              selected ? "ring-2 ring-primary ring-offset-1 ring-offset-surface" : ""
            }`}
          >
            <span className="flex items-center gap-2 font-semibold text-foreground">
              {selected && <CheckCircle2 className="h-4 w-4 text-primary" />}
              {formatTimeLabel(slot.startTime)} &ndash; {formatTimeLabel(slot.endTime)}
            </span>
            {slot.status === "booked" ? (
              <span className="flex items-center gap-2 text-xs font-semibold">
                <User className="h-3.5 w-3.5" />
                Booked
              </span>
            ) : slot.status === "blocked" ? (
              <span className="flex items-center gap-1.5 text-xs font-semibold">
                <Lock className="h-3.5 w-3.5" />
                {slot.blockedReason ?? "Blocked"}
              </span>
            ) : slot.status === "past" ? (
              <span className="text-xs">Past</span>
            ) : (
              <span className="text-xs font-semibold">
                ₹{slot.price.toLocaleString("en-IN")} &middot; Available
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
/**
 * Phone-friendly week view: a strip of the 7 days to pick from, then that
 * day's slots as a two-column grid of tappable tiles (time + price/status).
 * Selection and click handling are identical to the desktop grid.
 */
export function MobileWeekCalendar({
  slots,
  weekStart,
  isSelected,
  onSlotClick,
}: {
  slots: RealSlot[];
  weekStart: Date;
  isSelected: (slot: RealSlot) => boolean;
  onSlotClick: (slot: RealSlot) => void;
}) {
  const days = useMemo(() => weekDates(weekStart), [weekStart]);
  const [dayIso, setDayIso] = useState(() => iso(new Date()));

  // Keep the chosen day inside the visible week (today if present, else Monday).
  useEffect(() => {
    if (days.some((d) => iso(d) === dayIso)) return;
    const today = days.find(isToday);
    setDayIso(iso(today ?? days[0]!));
  }, [days, dayIso]);

  const daySlots = useMemo(
    () => slots.filter((s) => s.date === dayIso).sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [slots, dayIso],
  );

  const countFor = (d: Date) =>
    slots.filter((s) => s.date === iso(d) && s.status === "available").length;

  return (
    <div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((d) => {
          const active = iso(d) === dayIso;
          const free = countFor(d);
          return (
            <button
              key={iso(d)}
              onClick={() => setDayIso(iso(d))}
              className={`flex flex-col items-center rounded-xl border py-1.5 transition-colors ${
                active
                  ? "border-primary bg-primary/10"
                  : isToday(d)
                    ? "border-primary/30"
                    : "border-border"
              }`}
            >
              <span className="text-[10px] font-semibold uppercase text-muted-foreground">
                {dayLabel(d).slice(0, 3)}
              </span>
              <span className={`text-sm font-bold ${active ? "text-primary" : "text-foreground"}`}>
                {dayNumber(d)}
              </span>
              <span
                className={`mt-0.5 h-1 w-1 rounded-full ${free > 0 ? "bg-primary" : "bg-transparent"}`}
              />
            </button>
          );
        })}
      </div>

      {daySlots.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">No slots on this day.</p>
      ) : (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {daySlots.map((slot) => {
            const clickable = slot.status !== "past";
            const selected = isSelected(slot);
            return (
              <button
                key={slot.id}
                disabled={!clickable}
                onClick={() => clickable && onSlotClick(slot)}
                className={`flex flex-col items-start rounded-xl px-3 py-2 text-left transition-colors ${STATUS_STYLES[slot.status]} ${
                  selected ? "ring-2 ring-primary ring-offset-1 ring-offset-surface" : ""
                }`}
              >
                <span className="flex w-full items-center justify-between text-xs font-semibold text-foreground">
                  {formatTimeLabel(slot.startTime)}
                  {selected && <CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
                </span>
                <span className="mt-0.5 flex items-center gap-1 text-[11px] font-semibold">
                  {slot.status === "booked" ? (
                    <>
                      <User className="h-3 w-3" /> Booked
                    </>
                  ) : slot.status === "blocked" ? (
                    <>
                      <Lock className="h-3 w-3" /> Blocked
                    </>
                  ) : slot.status === "past" ? (
                    "Past"
                  ) : (
                    `₹${slot.price.toLocaleString("en-IN")}`
                  )}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
