import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ListChecks,
  Loader2,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useInventory } from "@/lib/inventory";
import { Button } from "@/components/partner/Button";
import { PillTabs } from "@/components/partner/PillTabs";
import { CalendarLegend, DailyCalendar, WeeklyCalendar } from "@/components/partner/SlotCalendar";
import { SlotActionModal } from "@/components/partner/SlotActionModal";
import {
  addDays,
  courtTimeRows,
  dateISO,
  fetchSlotsForCourt,
  startOfWeek,
  type RealSlot,
} from "@/data/inventory";

export const Route = createFileRoute("/dashboard/slots/")({
  validateSearch: (search: Record<string, unknown>): { courtId?: string } => {
    const courtId = typeof search["courtId"] === "string" ? search["courtId"] : undefined;
    return courtId ? { courtId } : {};
  },
  component: CalendarPage,
});

function weekRangeLabel(weekStart: Date) {
  const end = addDays(weekStart, 6);
  const sameMonth = weekStart.getMonth() === end.getMonth();
  const startLabel = weekStart.toLocaleDateString("en-IN", {
    day: "numeric",
    month: sameMonth ? undefined : "short",
  });
  const endLabel = end.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return `${startLabel} \u2013 ${endLabel}`;
}

function CalendarPage() {
  const { courts } = useInventory();
  const { courtId: preselectedCourtId } = Route.useSearch();
  const [selectedCourtId, setSelectedCourtId] = useState(preselectedCourtId ?? courts[0]?.id ?? "");
  const [view, setView] = useState<"week" | "day">("week");
  const [anchor, setAnchor] = useState(() => new Date());
  // Multi-select is only ever for a contiguous run of AVAILABLE slots on
  // the same day (walk-in booking / blocking a stretch of time) — a
  // single click on a booked/blocked slot instead opens that slot's own
  // one-slot view immediately via activeSlots directly, unrelated to
  // this pending selection.
  const [pendingSelection, setPendingSelection] = useState<RealSlot[]>([]);
  const [activeSlots, setActiveSlots] = useState<RealSlot[]>([]);
  const [slots, setSlots] = useState<RealSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  const selectedCourt = courts.find((c) => c.id === selectedCourtId) ?? courts[0];
  const weekStart = useMemo(() => startOfWeek(anchor), [anchor]);
  const rangeFrom = view === "week" ? dateISO(weekStart) : dateISO(anchor);
  const rangeTo = view === "week" ? dateISO(addDays(weekStart, 6)) : dateISO(anchor);
  const courtRows = useMemo(
    () => (selectedCourt ? courtTimeRows(selectedCourt) : []),
    [selectedCourt],
  );

  const step = (dir: 1 | -1) => setAnchor((d) => addDays(d, view === "week" ? dir * 7 : dir));

  const loadSlots = useCallback(async () => {
    if (!selectedCourt?.opensAt) {
      setSlots([]);
      return;
    }
    setSlotsLoading(true);
    const data = await fetchSlotsForCourt(selectedCourt.id, rangeFrom, rangeTo);
    setSlots(data);
    setSlotsLoading(false);
  }, [selectedCourt, rangeFrom, rangeTo]);

  useEffect(() => {
    void loadSlots();
  }, [loadSlots]);

  // Switching court, view, or date range invalidates any in-progress
  // selection — the slots it referred to may not even be on screen anymore.
  useEffect(() => {
    setPendingSelection([]);
  }, [selectedCourtId, view, rangeFrom, rangeTo]);

  // Courts load asynchronously, and the Bulk Setup wizard can hand back a
  // courtId for a court that didn't exist yet at mount — keep the
  // selection valid as the list changes.
  useEffect(() => {
    if (courts.length === 0) return;
    if (!courts.some((c) => c.id === selectedCourtId)) {
      setSelectedCourtId(preselectedCourtId ?? courts[0]!.id);
    }
  }, [courts, selectedCourtId, preselectedCourtId]);

  const handleSlotClick = (slot: RealSlot) => {
    if (slot.status !== "available") {
      // A booked/blocked slot has its own single-slot view regardless of
      // any pending multi-select — opening it clears the pending run so
      // there's no confusion about what "Continue" would apply to.
      setPendingSelection([]);
      setActiveSlots([slot]);
      return;
    }

    setPendingSelection((prev) => {
      const alreadyIn = prev.some((s) => s.id === slot.id);
      if (alreadyIn) return []; // clicking any selected slot cancels the whole run

      if (prev.length === 0) return [slot];
      if (prev[0]!.date !== slot.date) return [slot]; // different day — start fresh

      const firstIdx = courtRows.indexOf(prev[0]!.startTime);
      const lastIdx = courtRows.indexOf(prev[prev.length - 1]!.startTime);
      const slotIdx = courtRows.indexOf(slot.startTime);

      if (slotIdx === lastIdx + 1) return [...prev, slot]; // extends forward
      if (slotIdx === firstIdx - 1) return [slot, ...prev]; // extends backward
      return [slot]; // not adjacent to the current run — start fresh here instead
    });
  };

  const isSlotSelected = useCallback(
    (slot: RealSlot) => pendingSelection.some((s) => s.id === slot.id),
    [pendingSelection],
  );

  const pendingTotal = pendingSelection.reduce((sum, s) => sum + s.price, 0);

  if (courts.length === 0) {
    return (
      <div className="surface-card flex flex-col items-center justify-center rounded-2xl py-24 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-raised">
          <ListChecks className="h-6 w-6 text-muted-foreground" />
        </div>
        <h2 className="mt-4 font-display text-xl font-semibold text-foreground">
          You haven't added any courts yet
        </h2>
        <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
          Add a court or sport offering, then run Bulk Slot Setup to open it up for bookings.
        </p>
        <Button asChild className="mt-5">
          <Link to="/dashboard/slots/courts">Add your first court</Link>
        </Button>
      </div>
    );
  }

  const needsSetup = selectedCourt && !selectedCourt.opensAt;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        {courts.length > 1 ? (
          <PillTabs
            options={courts.map((c) => ({ key: c.id, label: c.name }))}
            value={selectedCourtId || courts[0]!.id}
            onChange={setSelectedCourtId}
          />
        ) : (
          <span className="rounded-xl bg-surface-raised px-4 py-2 text-sm font-semibold text-foreground">
            {courts[0]!.name}
          </span>
        )}

        <div className="ml-auto flex items-center gap-2">
          <PillTabs
            options={[
              { key: "week", label: "Week" },
              { key: "day", label: "Day" },
            ]}
            value={view}
            onChange={setView}
          />
        </div>
      </div>

      {needsSetup ? (
        <div className="surface-card mt-5 flex flex-col items-center justify-center rounded-2xl py-24 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-raised">
            <SlidersHorizontal className="h-6 w-6 text-muted-foreground" />
          </div>
          <h2 className="mt-4 font-display text-xl font-semibold text-foreground">
            {selectedCourt!.name} isn't set up yet
          </h2>
          <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
            Set operating hours, slot duration and pricing to start generating availability for this
            court.
          </p>
          <Button asChild className="mt-5">
            <Link to="/dashboard/slots/setup" search={{ courtId: selectedCourt!.id }}>
              Run Bulk Slot Setup
            </Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="mt-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => step(-1)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-secondary"
                aria-label="Previous"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => step(1)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-secondary"
                aria-label="Next"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <span className="ml-1 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                {view === "week"
                  ? weekRangeLabel(weekStart)
                  : anchor.toLocaleDateString("en-IN", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
              </span>
              <button
                onClick={() => setAnchor(new Date())}
                className="ml-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary/10"
              >
                Today
              </button>
            </div>

            <CalendarLegend />
          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            Click an available slot to select it, then click the next one to extend a run &mdash;
            handy for a walk-in booking or block spanning more than one slot.
          </p>

          <div className="surface-card relative mt-4 rounded-2xl p-4 sm:p-5">
            {slotsLoading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-surface/70">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}
            {view === "week" ? (
              <WeeklyCalendar
                court={selectedCourt!}
                slots={slots}
                weekStart={weekStart}
                isSelected={isSlotSelected}
                onSlotClick={handleSlotClick}
              />
            ) : (
              <DailyCalendar
                slots={slots}
                isSelected={isSlotSelected}
                onSlotClick={handleSlotClick}
              />
            )}
          </div>
        </>
      )}

      {pendingSelection.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface/95 px-4 py-3 backdrop-blur sm:inset-x-auto sm:bottom-6 sm:right-6 sm:rounded-2xl sm:border sm:shadow-lg">
          <div className="mx-auto flex max-w-lg items-center gap-3">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
            <div className="flex-1 text-sm">
              <p className="font-semibold text-foreground">
                {pendingSelection.length} slot{pendingSelection.length > 1 ? "s" : ""} selected
              </p>
              <p className="text-xs text-muted-foreground">
                \u20b9{pendingTotal.toLocaleString("en-IN")} total
              </p>
            </div>
            <button
              onClick={() => setPendingSelection([])}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary"
              aria-label="Cancel selection"
            >
              <X className="h-4 w-4" />
            </button>
            <Button
              onClick={() => {
                setActiveSlots(pendingSelection);
                setPendingSelection([]);
              }}
            >
              Continue
            </Button>
          </div>
        </div>
      )}

      <SlotActionModal
        slots={activeSlots}
        courtName={selectedCourt?.name ?? ""}
        onClose={() => setActiveSlots([])}
        onChanged={loadSlots}
      />
    </div>
  );
}