import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  CheckCircle2,
  ChevronRight,
  Clock,
  IndianRupee,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useInventory } from "@/lib/inventory";
import { Button } from "@/components/partner/Button";
import { PillTabs } from "@/components/partner/PillTabs";
import { TextInput } from "@/components/partner/FormFields";
import {
  DURATION_OPTIONS,
  SPORT_OPTIONS,
  addDays,
  dateISO,
  isOvernightRange,
  rangeDurationMinutes,
  type SlotDurationMinutes,
} from "@/data/inventory";

export const Route = createFileRoute("/dashboard/slots/setup")({
  validateSearch: (search: Record<string, unknown>): { courtId?: string } => {
    const courtId = typeof search["courtId"] === "string" ? search["courtId"] : undefined;
    return courtId ? { courtId } : {};
  },
  head: () => ({ meta: [{ title: "Bulk Slot Setup | JustPlay Partner" }] }),
  component: BulkSetupPage,
});

type PriceBandDraft = {
  id: string;
  label: string;
  startTime: string;
  endTime: string;
  pricePerSlot: number;
};

const STEPS = ["Court", "Hours & duration", "Pricing", "Generate"];
const QUICK_RANGES = [7, 14, 30, 60];

function BulkSetupPage() {
  const { courts, priceRulesForCourt, addCourt, runBulkSetup } = useInventory();
  const navigate = useNavigate();
  const { courtId: preselectedCourtId } = Route.useSearch();

  const [step, setStep] = useState(0);
  const [courtId, setCourtId] = useState(preselectedCourtId ?? courts[0]?.id ?? "");
  const [addingCourt, setAddingCourt] = useState(courts.length === 0);
  const [newCourtName, setNewCourtName] = useState("");
  const [newCourtSport, setNewCourtSport] = useState(SPORT_OPTIONS[0]!);

  const selectedCourt = courts.find((c) => c.id === courtId);

  const [opensAt, setOpensAt] = useState(selectedCourt?.opensAt ?? "06:00");
  const [closesAt, setClosesAt] = useState(selectedCourt?.closesAt ?? "22:00");
  const [duration, setDuration] = useState<SlotDurationMinutes>(
    selectedCourt?.slotDurationMinutes ?? 60,
  );

  const existingRules = selectedCourt ? priceRulesForCourt(selectedCourt.id) : [];
  const [bands, setBands] = useState<PriceBandDraft[]>(
    existingRules.length > 0
      ? existingRules.map((r) => ({
          id: r.id,
          label: r.label,
          startTime: r.startTime,
          endTime: r.endTime,
          pricePerSlot: r.pricePerSlot,
        }))
      : [{ id: "b1", label: "All day", startTime: opensAt, endTime: closesAt, pricePerSlot: 700 }],
  );

  // Courts/price rules now load asynchronously (a real fetch, not
  // synchronous mock state), so the useState initializers above can run
  // before that data arrives, defaulting an existing court's edit session
  // to a blank "All day" band. Resync once the real data actually shows up.
  useEffect(() => {
    if (!selectedCourt) return;
    if (selectedCourt.opensAt) setOpensAt(selectedCourt.opensAt);
    if (selectedCourt.closesAt) setClosesAt(selectedCourt.closesAt);
    if (selectedCourt.slotDurationMinutes) setDuration(selectedCourt.slotDurationMinutes);
    const rules = priceRulesForCourt(selectedCourt.id);
    if (rules.length > 0) {
      setBands(
        rules.map((r) => ({
          id: r.id,
          label: r.label,
          startTime: r.startTime,
          endTime: r.endTime,
          pricePerSlot: r.pricePerSlot,
        })),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCourt?.id, selectedCourt?.opensAt, selectedCourt?.slotDurationMinutes]);

  const [generateDays, setGenerateDays] = useState(30);
  const [customDays, setCustomDays] = useState("");
  const [done, setDone] = useState(false);

  const effectiveCourtId = addingCourt ? null : courtId;

  const canProceedStep0 = addingCourt ? newCourtName.trim().length > 1 : Boolean(effectiveCourtId);
  // Any pair of opening/closing times is valid now: closesAt <= opensAt
  // means the court's hours cross midnight (or, when equal, run a full 24
  // hours) rather than being an error — see rangeDurationMinutes.
  const canProceedStep1 = true;
  const canProceedStep2 = bands.length > 0 && bands.every((b) => b.pricePerSlot > 0);

  const rowsPerDay = useMemo(() => {
    const total = rangeDurationMinutes(opensAt, closesAt);
    return Math.floor(total / duration);
  }, [opensAt, closesAt, duration]);

  const finalGenerateDays = customDays
    ? Math.max(1, Math.min(365, Number(customDays) || 0))
    : generateDays;
  const totalSlots = rowsPerDay * finalGenerateDays;
  const endDate = addDays(new Date(), finalGenerateDays - 1);

  const updateBand = (id: string, patch: Partial<PriceBandDraft>) => {
    setBands((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  };
  const addBand = () => {
    setBands((prev) => [
      ...prev,
      {
        id: `b${prev.length + 1}_${Date.now()}`,
        label: "New band",
        startTime: "17:00",
        endTime: "22:00",
        pricePerSlot: 900,
      },
    ]);
  };
  const removeBand = (id: string) => setBands((prev) => prev.filter((b) => b.id !== id));

  const [busyStep, setBusyStep] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);

  const goNext = async () => {
    if (step === 0 && addingCourt) {
      setBusyStep(true);
      setStepError(null);
      try {
        const created = await addCourt({ name: newCourtName.trim(), sport: newCourtSport });
        setCourtId(created.id);
        setAddingCourt(false);
      } catch (e) {
        setStepError(e instanceof Error ? e.message : "Could not add this court. Try again.");
        setBusyStep(false);
        return;
      }
      setBusyStep(false);
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!effectiveCourtId) return;
    setGenerating(true);
    setGenerateError(null);
    try {
      await runBulkSetup({
        courtId: effectiveCourtId,
        opensAt,
        closesAt,
        slotDurationMinutes: duration,
        priceRules: bands.map((b) => ({
          label: b.label,
          startTime: b.startTime,
          endTime: b.endTime,
          pricePerSlot: b.pricePerSlot,
        })),
        generateDays: finalGenerateDays,
      });
      setDone(true);
    } catch (e) {
      setGenerateError(e instanceof Error ? e.message : "Could not generate slots. Try again.");
    } finally {
      setGenerating(false);
    }
  };

  if (done) {
    const court = courts.find((c) => c.id === effectiveCourtId);
    return (
      <div className="surface-card mx-auto max-w-lg rounded-2xl p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <CheckCircle2 className="h-6 w-6 text-primary" />
        </div>
        <h2 className="mt-4 font-display text-xl font-semibold text-foreground">Slots generated</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {totalSlots.toLocaleString("en-IN")} slots created for{" "}
          <strong className="text-foreground">{court?.name}</strong> through{" "}
          {endDate.toLocaleDateString("en-IN", { day: "numeric", month: "long" })}.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => window.location.assign("/dashboard/slots/setup")}
          >
            Set up another court
          </Button>
          <Button asChild>
            <Link
              to="/dashboard/slots"
              search={effectiveCourtId ? { courtId: effectiveCourtId } : {}}
            >
              View calendar
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                i < step
                  ? "bg-primary text-primary-foreground"
                  : i === step
                    ? "border-2 border-primary text-primary"
                    : "bg-surface-raised text-muted-foreground"
              }`}
            >
              {i < step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
            </div>
            <span
              className={`text-xs font-semibold ${i === step ? "text-foreground" : "text-muted-foreground"}`}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && <ChevronRight className="h-3.5 w-3.5 text-border" />}
          </div>
        ))}
      </div>

      <div className="surface-card max-w-xl rounded-2xl p-6">
        {/* Step 0: court */}
        {step === 0 && (
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground">
              Which court is this for?
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Set operating hours, slot duration and pricing for one court or sport at a time.
            </p>

            {courts.length > 0 && !addingCourt && (
              <div className="mt-5 flex flex-col gap-2">
                {courts.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setCourtId(c.id)}
                    className={`flex items-center justify-between rounded-xl border p-3.5 text-left ${
                      courtId === c.id ? "border-primary bg-primary/5" : "border-border"
                    }`}
                  >
                    <span>
                      <span className="block text-sm font-semibold text-foreground">{c.name}</span>
                      <span className="block text-xs text-muted-foreground">
                        {c.opensAt
                          ? `${c.opensAt}\u2013${c.closesAt} \u00b7 already set up`
                          : "Not set up yet"}
                      </span>
                    </span>
                    {courtId === c.id && <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />}
                  </button>
                ))}
                <button
                  onClick={() => setAddingCourt(true)}
                  className="flex items-center gap-2 rounded-xl border border-dashed border-border p-3.5 text-sm font-semibold text-muted-foreground hover:border-primary hover:text-primary"
                >
                  <Plus className="h-4 w-4" /> Add a new court
                </button>
              </div>
            )}

            {(addingCourt || courts.length === 0) && (
              <div className="mt-5 flex flex-col gap-4">
                <TextInput
                  label="Court name"
                  placeholder="e.g. Turf A"
                  value={newCourtName}
                  onChange={(e) => setNewCourtName(e.target.value)}
                />
                <div>
                  <span className="mb-1.5 block text-sm font-semibold text-foreground">Sport</span>
                  <select
                    value={newCourtSport}
                    onChange={(e) => setNewCourtSport(e.target.value)}
                    className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary"
                  >
                    {SPORT_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                {courts.length > 0 && (
                  <button
                    onClick={() => setAddingCourt(false)}
                    className="self-start text-xs font-semibold text-primary"
                  >
                    Choose an existing court instead
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 1: hours & duration */}
        {step === 1 && (
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground">
              Operating hours & slot duration
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {selectedCourt?.name ?? newCourtName} &middot; used to generate individual bookable
              slots.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-4">
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-foreground">Opens at</span>
                <input
                  type="time"
                  value={opensAt}
                  onChange={(e) => setOpensAt(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-foreground">
                  Closes at
                </span>
                <input
                  type="time"
                  value={closesAt}
                  onChange={(e) => setClosesAt(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary"
                />
              </label>
            </div>

            <button
              onClick={() => {
                setOpensAt("00:00");
                setClosesAt("00:00");
              }}
              className={`mt-2.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors ${
                opensAt === "00:00" && closesAt === "00:00"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary hover:text-primary"
              }`}
            >
              Open 24 hours
            </button>

            {isOvernightRange(opensAt, closesAt) && (
              <p className="mt-2.5 text-xs text-muted-foreground">
                {opensAt === closesAt
                  ? "Open the full 24 hours, every day."
                  : `Hours cross midnight \u2014 closes at ${closesAt} the following day.`}
              </p>
            )}

            <div className="mt-5">
              <span className="mb-1.5 block text-sm font-semibold text-foreground">
                Slot duration
              </span>
              <div className="flex gap-2">
                {DURATION_OPTIONS.map((d) => (
                  <button
                    key={d}
                    onClick={() => setDuration(d)}
                    className={`flex-1 rounded-xl border py-2.5 text-sm font-semibold transition-colors ${
                      duration === d
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground"
                    }`}
                  >
                    {d} min
                  </button>
                ))}
              </div>
            </div>

            <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              That's {rowsPerDay} slots per day, {opensAt}
              {"\u2013"}
              {closesAt}
              {isOvernightRange(opensAt, closesAt) && opensAt !== closesAt ? " (+1 day)" : ""}.
            </p>
          </div>
        )}

        {/* Step 2: pricing */}
        {step === 2 && (
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground">Set your pricing</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Add a price band for each time range &mdash; e.g. price mornings lower than peak
              evening hours.
            </p>

            <div className="mt-5 flex flex-col gap-3">
              {bands.map((b) => (
                <div key={b.id} className="rounded-xl border border-border p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <input
                      value={b.label}
                      onChange={(e) => updateBand(b.id, { label: e.target.value })}
                      className="flex-1 bg-transparent text-sm font-semibold text-foreground outline-none"
                      placeholder="Band label"
                    />
                    {bands.length > 1 && (
                      <button
                        onClick={() => removeBand(b.id)}
                        className="text-muted-foreground hover:text-destructive"
                        aria-label="Remove band"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <input
                      type="time"
                      value={b.startTime}
                      onChange={(e) => updateBand(b.id, { startTime: e.target.value })}
                      className="rounded-lg border border-border bg-surface px-2.5 py-2 text-xs text-foreground outline-none focus:border-primary"
                    />
                    <input
                      type="time"
                      value={b.endTime}
                      onChange={(e) => updateBand(b.id, { endTime: e.target.value })}
                      className="rounded-lg border border-border bg-surface px-2.5 py-2 text-xs text-foreground outline-none focus:border-primary"
                    />
                    <div className="flex items-center gap-1 rounded-lg border border-border bg-surface px-2.5 py-2">
                      <IndianRupee className="h-3.5 w-3.5 text-muted-foreground" />
                      <input
                        type="number"
                        min={0}
                        value={b.pricePerSlot}
                        onChange={(e) => updateBand(b.id, { pricePerSlot: Number(e.target.value) })}
                        className="w-full bg-transparent text-xs text-foreground outline-none"
                      />
                    </div>
                  </div>
                  {isOvernightRange(b.startTime, b.endTime) && b.startTime !== b.endTime && (
                    <p className="mt-1.5 text-[11px] text-muted-foreground">
                      Crosses midnight &mdash; covers {b.startTime} through {b.endTime} the next
                      day.
                    </p>
                  )}
                </div>
              ))}
              <button
                onClick={addBand}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-border py-2.5 text-sm font-semibold text-muted-foreground hover:border-primary hover:text-primary"
              >
                <Plus className="h-4 w-4" /> Add price band
              </button>
            </div>
          </div>
        )}

        {/* Step 3: date range & review */}
        {step === 3 && (
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground">Generate slots</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Choose how far ahead to open up availability.
            </p>

            <div className="mt-5 grid grid-cols-4 gap-2">
              {QUICK_RANGES.map((n) => (
                <button
                  key={n}
                  onClick={() => {
                    setGenerateDays(n);
                    setCustomDays("");
                  }}
                  className={`rounded-xl border py-2.5 text-sm font-semibold transition-colors ${
                    !customDays && generateDays === n
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  {n} days
                </button>
              ))}
            </div>
            <div className="mt-2.5">
              <TextInput
                label="Or a custom number of days"
                type="number"
                min={1}
                max={365}
                placeholder="e.g. 45"
                value={customDays}
                onChange={(e) => setCustomDays(e.target.value.replace(/\D/g, ""))}
              />
            </div>

            <div className="mt-5 flex items-start gap-3 rounded-xl bg-primary/5 p-4">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <p className="text-sm text-foreground">
                This generates <strong>{totalSlots.toLocaleString("en-IN")} slots</strong> for{" "}
                <strong>{selectedCourt?.name ?? newCourtName}</strong>, from today through{" "}
                {endDate.toLocaleDateString("en-IN", { day: "numeric", month: "long" })} (
                {finalGenerateDays} days).
                {selectedCourt?.slotsGeneratedUntil && (
                  <> This replaces the existing setup for this court.</>
                )}
              </p>
            </div>
          </div>
        )}

        <div className="mt-7 flex justify-between gap-2">
          <Button
            variant="outline"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0 || busyStep || generating}
          >
            Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button
              onClick={goNext}
              disabled={
                busyStep ||
                (step === 0 && !canProceedStep0) ||
                (step === 1 && !canProceedStep1) ||
                (step === 2 && !canProceedStep2)
              }
            >
              {busyStep ? "Please wait\u2026" : "Continue"}
            </Button>
          ) : (
            <Button onClick={handleGenerate} disabled={totalSlots <= 0 || generating}>
              {generating ? "Generating\u2026" : "Generate slots"}
            </Button>
          )}
        </div>
        {(stepError || generateError) && (
          <p className="mt-3 text-right text-xs font-semibold text-destructive">
            {stepError ?? generateError}
          </p>
        )}
      </div>
    </div>
  );
}