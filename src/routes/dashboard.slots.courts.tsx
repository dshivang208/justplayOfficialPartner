import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarOff, CircleSlash, MapPin, Pencil, Plus, Sparkles, Trash2 } from "lucide-react";
import { useInventory } from "@/lib/inventory";
import { Button } from "@/components/partner/Button";
import { Modal } from "@/components/partner/Modal";
import { TextInput } from "@/components/partner/FormFields";
import { SPORT_OPTIONS, formatTimeLabel, isOvernightRange, type Court } from "@/data/inventory";

export const Route = createFileRoute("/dashboard/slots/courts")({
  head: () => ({ meta: [{ title: "Courts & Sports | JustPlay Partner" }] }),
  component: CourtsPage,
});

function CourtsPage() {
  const {
    courts,
    priceRulesForCourt,
    addCourt,
    updateCourt,
    deleteCourt,
    exceptions,
    addException,
    removeException,
  } = useInventory();

  const [addOpen, setAddOpen] = useState(false);
  const [editCourt, setEditCourt] = useState<Court | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<Court | null>(null);
  const [exceptionOpen, setExceptionOpen] = useState(false);

  return (
    <div className="flex flex-col gap-8">
      <section>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-foreground">Courts & sports</h2>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" /> Add court
          </Button>
        </div>

        {courts.length === 0 ? (
          <div className="surface-card mt-4 flex flex-col items-center justify-center rounded-2xl py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-raised">
              <MapPin className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="mt-3.5 text-sm font-semibold text-foreground">No courts yet</p>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">
              Add each court or sport your venue offers &mdash; e.g. "Turf A &mdash; Football".
            </p>
            <Button className="mt-4" onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4" /> Add your first court
            </Button>
          </div>
        ) : (
          <div className="mt-4 flex flex-col gap-2.5">
            {courts.map((court) => {
              const rules = priceRulesForCourt(court.id);
              const priceLow = rules.length ? Math.min(...rules.map((r) => r.pricePerSlot)) : null;
              const priceHigh = rules.length ? Math.max(...rules.map((r) => r.pricePerSlot)) : null;

              return (
                <div
                  key={court.id}
                  className="surface-card flex flex-wrap items-center gap-4 rounded-2xl p-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-display text-base font-semibold text-foreground">
                        {court.name}
                      </p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          court.status === "active"
                            ? "bg-primary/10 text-primary"
                            : "bg-surface-raised text-muted-foreground"
                        }`}
                      >
                        {court.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{court.sport}</p>
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      {court.opensAt && court.closesAt
                        ? `${formatTimeLabel(court.opensAt)} \u2013 ${formatTimeLabel(court.closesAt)}${
                            isOvernightRange(court.opensAt, court.closesAt)
                              ? court.opensAt === court.closesAt
                                ? " (24 hours)"
                                : " (+1 day)"
                              : ""
                          } \u00b7 ${court.slotDurationMinutes}-min slots`
                        : "Hours not set up yet"}
                      {priceLow != null && (
                        <>
                          {" "}
                          &middot; ₹{priceLow}
                          {priceHigh !== priceLow ? `\u2013\u20B9${priceHigh}` : ""}
                        </>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" asChild>
                      <Link to="/dashboard/slots/setup" search={{ courtId: court.id }}>
                        <Sparkles className="h-3.5 w-3.5" />
                        {court.opensAt ? "Edit hours & pricing" : "Set up"}
                      </Link>
                    </Button>
                    <button
                      onClick={() => setEditCourt(court)}
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted-foreground hover:bg-secondary"
                      aria-label="Edit court"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleteCandidate(court)}
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted-foreground hover:border-destructive hover:text-destructive"
                      aria-label="Delete court"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground">
              Holidays & exceptions
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Close the venue or change hours for a specific date.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setExceptionOpen(true)}
            disabled={courts.length === 0}
          >
            <CalendarOff className="h-4 w-4" /> Add exception
          </Button>
        </div>

        {exceptions.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            No exceptions set. Every date follows normal operating hours.
          </p>
        ) : (
          <div className="mt-4 flex flex-col gap-2">
            {exceptions.map((e) => (
              <div key={e.id} className="surface-card flex items-center gap-3 rounded-xl p-3.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15">
                  <CircleSlash className="h-4 w-4 text-accent" />
                </span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">
                    {new Date(`${e.date}T00:00:00`).toLocaleDateString("en-IN", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {e.type === "closed"
                      ? "Closed"
                      : `Modified hours: ${e.opensAt} \u2013 ${e.closesAt}`}
                    {e.reason ? ` \u00b7 ${e.reason}` : ""}
                  </p>
                </div>
                <button
                  onClick={() =>
                    removeException(e.id).catch((err) =>
                      console.error("Could not remove exception:", err),
                    )
                  }
                  className="text-xs font-semibold text-destructive"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <AddCourtModal open={addOpen} onClose={() => setAddOpen(false)} onAdd={addCourt} />
      <EditCourtModal
        key={editCourt?.id ?? "none"}
        court={editCourt}
        onClose={() => setEditCourt(null)}
        onSave={updateCourt}
      />
      <DeleteCourtModal
        court={deleteCandidate}
        onClose={() => setDeleteCandidate(null)}
        onDelete={async (id) => {
          await deleteCourt(id);
          setDeleteCandidate(null);
        }}
      />
      <AddExceptionModal
        open={exceptionOpen}
        onClose={() => setExceptionOpen(false)}
        onAdd={addException}
      />
    </div>
  );
}

function AddCourtModal({
  open,
  onClose,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (input: { name: string; sport: string }) => Promise<Court>;
}) {
  const [name, setName] = useState("");
  const [sport, setSport] = useState(SPORT_OPTIONS[0]!);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    setName("");
    setSport(SPORT_OPTIONS[0]!);
    setError(null);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title="Add a court or sport"
      description="You can set operating hours and pricing next, via Bulk Slot Setup."
    >
      <div className="flex flex-col gap-4">
        <TextInput
          label="Court name"
          placeholder="e.g. Turf A"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
        <div>
          <span className="mb-1.5 block text-sm font-semibold text-foreground">Sport</span>
          <select
            value={sport}
            onChange={(e) => setSport(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary"
          >
            {SPORT_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        {error && <p className="text-xs font-semibold text-destructive">{error}</p>}
        <Button
          disabled={name.trim().length < 2 || busy}
          onClick={async () => {
            setBusy(true);
            setError(null);
            try {
              await onAdd({ name: name.trim(), sport });
              close();
            } catch (e) {
              setError(e instanceof Error ? e.message : "Could not add this court.");
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? "Adding\u2026" : "Add court"}
        </Button>
      </div>
    </Modal>
  );
}

function EditCourtModal({
  court,
  onClose,
  onSave,
}: {
  court: Court | null;
  onClose: () => void;
  onSave: (
    id: string,
    patch: { name: string; sport: string; status: Court["status"] },
  ) => Promise<void>;
}) {
  const [name, setName] = useState(court?.name ?? "");
  const [sport, setSport] = useState(court?.sport ?? SPORT_OPTIONS[0]!);
  const [status, setStatus] = useState<Court["status"]>(court?.status ?? "active");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!court) return null;

  return (
    <Modal open onClose={onClose} title="Edit court">
      <div className="flex flex-col gap-4">
        <TextInput label="Court name" value={name} onChange={(e) => setName(e.target.value)} />
        <div>
          <span className="mb-1.5 block text-sm font-semibold text-foreground">Sport</span>
          <select
            value={sport}
            onChange={(e) => setSport(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary"
          >
            {SPORT_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <span className="mb-1.5 block text-sm font-semibold text-foreground">Status</span>
          <div className="flex gap-2">
            {(["active", "inactive"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`flex-1 rounded-xl border py-2 text-sm font-semibold capitalize transition-colors ${
                  status === s
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          {status === "inactive" && (
            <p className="mt-1.5 text-xs text-muted-foreground">
              Inactive courts stop appearing to customers, but keep their history.
            </p>
          )}
        </div>
        {error && <p className="text-xs font-semibold text-destructive">{error}</p>}
        <Button
          disabled={name.trim().length < 2 || busy}
          onClick={async () => {
            setBusy(true);
            setError(null);
            try {
              await onSave(court.id, { name: name.trim(), sport, status });
              onClose();
            } catch (e) {
              setError(e instanceof Error ? e.message : "Could not save changes.");
              setBusy(false);
            }
          }}
        >
          {busy ? "Saving\u2026" : "Save changes"}
        </Button>
      </div>
    </Modal>
  );
}

function DeleteCourtModal({
  court,
  onClose,
  onDelete,
}: {
  court: Court | null;
  onClose: () => void;
  onDelete: (id: string) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!court) return null;
  return (
    <Modal open onClose={onClose} title={`Delete ${court.name}?`} width="sm">
      <p className="text-sm text-muted-foreground">
        This removes the court, its pricing and generated slots. This can't be undone.
      </p>
      {error && <p className="mt-3 text-xs font-semibold text-destructive">{error}</p>}
      <div className="mt-5 flex gap-2">
        <Button variant="outline" className="flex-1" disabled={busy} onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="destructive"
          className="flex-1"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setError(null);
            try {
              await onDelete(court.id);
            } catch (e) {
              setError(e instanceof Error ? e.message : "Could not delete this court.");
              setBusy(false);
            }
          }}
        >
          {busy ? "Deleting\u2026" : "Delete"}
        </Button>
      </div>
    </Modal>
  );
}

function AddExceptionModal({
  open,
  onClose,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (input: {
    date: string;
    type: "closed" | "modified_hours";
    opensAt?: string;
    closesAt?: string;
    reason: string;
  }) => Promise<void>;
}) {
  const [date, setDate] = useState("");
  const [type, setType] = useState<"closed" | "modified_hours">("closed");
  const [opensAt, setOpensAt] = useState("10:00");
  const [closesAt, setClosesAt] = useState("18:00");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    setDate("");
    setType("closed");
    setReason("");
    setError(null);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title="Add a date exception"
      description="Applies across every court on this date."
    >
      <div className="flex flex-col gap-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-foreground">Date</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary"
          />
        </label>

        <div>
          <span className="mb-1.5 block text-sm font-semibold text-foreground">Type</span>
          <div className="flex gap-2">
            <button
              onClick={() => setType("closed")}
              className={`flex-1 rounded-xl border py-2 text-sm font-semibold transition-colors ${
                type === "closed"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground"
              }`}
            >
              Closed all day
            </button>
            <button
              onClick={() => setType("modified_hours")}
              className={`flex-1 rounded-xl border py-2 text-sm font-semibold transition-colors ${
                type === "modified_hours"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground"
              }`}
            >
              Modified hours
            </button>
          </div>
        </div>

        {type === "modified_hours" && (
          <div className="grid grid-cols-2 gap-4">
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
              <span className="mb-1.5 block text-sm font-semibold text-foreground">Closes at</span>
              <input
                type="time"
                value={closesAt}
                onChange={(e) => setClosesAt(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary"
              />
            </label>
          </div>
        )}

        <TextInput
          label="Reason"
          placeholder="e.g. Diwali, private event"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />

        {error && <p className="text-xs font-semibold text-destructive">{error}</p>}

        <Button
          disabled={!date || !reason.trim() || busy}
          onClick={async () => {
            setBusy(true);
            setError(null);
            try {
              await onAdd({
                date,
                type,
                reason: reason.trim(),
                ...(type === "modified_hours" ? { opensAt, closesAt } : {}),
              });
              close();
            } catch (e) {
              setError(e instanceof Error ? e.message : "Could not add this exception.");
              setBusy(false);
            }
          }}
        >
          {busy ? "Adding\u2026" : "Add exception"}
        </Button>
      </div>
    </Modal>
  );
}