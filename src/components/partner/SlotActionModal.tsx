import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, Lock, User } from "lucide-react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { TextInput } from "./FormFields";
import { formatTimeLabel, type RealSlot } from "@/data/inventory";
import { formatBookingId, paymentMethodLabel, type PaymentMethod } from "@/data/bookings";
import { useInventory } from "@/lib/inventory";
import { useBookings } from "@/lib/bookings";

function formatDateLabel(dateISO: string) {
  return new Date(`${dateISO}T00:00:00`).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

const PAYMENT_OPTIONS: { method: PaymentMethod; label: string; impliesPaid: boolean }[] = [
  { method: "cash", label: "Cash", impliesPaid: false },
  { method: "upi", label: "UPI", impliesPaid: false },
  { method: "online", label: "Already paid online", impliesPaid: true },
];

export function SlotActionModal({
  slots,
  courtName,
  onClose,
  onChanged,
}: {
  /** One slot for a booked/blocked slot's own summary view (the calendar
   *  never lets those be multi-selected). One OR MORE contiguous
   *  available slots for a walk-in booking / block spanning a run of
   *  time — see the adjacency-aware selection logic in
   *  dashboard.slots.index.tsx that builds this array. */
  slots: RealSlot[];
  courtName: string;
  onClose: () => void;
  /** Called after a successful block/unblock/booking so the calendar can
   *  refetch its visible range — this modal has no view of what's
   *  currently on screen to refresh itself. */
  onChanged: () => void;
}) {
  const { blockSlot, unblockSlot } = useInventory();
  const { bookings, createWalkinBooking } = useBookings();

  const [mode, setMode] = useState<"summary" | "block" | "book">("summary");
  const [blockReason, setBlockReason] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [markPaidNow, setMarkPaidNow] = useState(true);
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (slots.length === 0) return null;

  const firstSlot = slots[0]!;
  const lastSlot = slots[slots.length - 1]!;
  const isMulti = slots.length > 1;
  const totalPrice = slots.reduce((sum, s) => sum + s.price, 0);

  const timeRange = `${formatTimeLabel(firstSlot.startTime)} \u2013 ${formatTimeLabel(lastSlot.endTime)}`;
  const dateLabel = formatDateLabel(firstSlot.date);
  const selectedOption = PAYMENT_OPTIONS.find((o) => o.method === paymentMethod)!;
  const effectiveAmount = amount === "" ? totalPrice : Number(amount);

  // Booked/blocked slots are never multi-selected by the calendar (see
  // handleSlotClick there), so matching a booked slot back to its
  // booking by (court, date, start time) is always exact — there's only
  // ever one slot to match against here.
  const matchedBooking = bookings.find(
    (b) =>
      b.courtId === firstSlot.courtId &&
      b.date === firstSlot.date &&
      b.startTime === firstSlot.startTime,
  );

  const close = () => {
    setMode("summary");
    setBlockReason("");
    setCustomerName("");
    setCustomerPhone("");
    setPaymentMethod("cash");
    setMarkPaidNow(true);
    setAmount("");
    setError(null);
    onClose();
  };

  const header = (
    <div className="mb-5 rounded-xl bg-surface-raised px-4 py-3">
      <p className="text-sm font-semibold text-foreground">
        {courtName} &middot; {firstSlot.sport}
        {isMulti ? ` \u00b7 ${slots.length} slots` : ""}
      </p>
      <p className="mt-0.5 text-sm text-muted-foreground">
        {dateLabel} &middot; {timeRange}
      </p>
    </div>
  );

  if (firstSlot.status === "booked") {
    return (
      <Modal open onClose={close} title="Booking summary">
        {header}
        {matchedBooking ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 rounded-xl border border-border p-3.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                {matchedBooking.customerName
                  .split(" ")
                  .map((p) => p[0])
                  .slice(0, 2)
                  .join("")}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {matchedBooking.customerName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatBookingId(matchedBooking.id)}
                  {matchedBooking.customerPhone
                    ? ` \u00b7 +91 ${matchedBooking.customerPhone}`
                    : ""}
                </p>
              </div>
              <span
                className={`ml-auto rounded-full px-2.5 py-1 text-xs font-semibold ${
                  matchedBooking.paymentStatus === "paid"
                    ? "bg-primary/10 text-primary"
                    : matchedBooking.paymentStatus === "refunded"
                      ? "bg-surface-raised text-muted-foreground"
                      : "bg-accent/15 text-accent"
                }`}
              >
                {matchedBooking.paymentStatus === "paid"
                  ? "Paid"
                  : matchedBooking.paymentStatus === "refunded"
                    ? "Refunded"
                    : "Payment pending"}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Payment method</span>
              <span className="font-semibold text-foreground">
                {paymentMethodLabel(matchedBooking.paymentMethod)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Booked via</span>
              <span className="font-semibold text-foreground">
                {matchedBooking.source === "walk_in" ? "Walk-in (front desk)" : "JustPlay app"}
              </span>
            </div>
            <Link
              to="/dashboard/bookings/$bookingId"
              params={{ bookingId: matchedBooking.id }}
              className="mt-2 flex items-center justify-center gap-1.5 rounded-xl border border-border py-2.5 text-sm font-semibold text-foreground hover:bg-secondary"
            >
              View full booking details <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : (
          <div className="flex items-start gap-3 rounded-xl border-l-4 border-primary bg-primary/5 px-3.5 py-3">
            <User className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p className="text-sm text-foreground">
              This slot is booked, but the matching booking hasn't loaded yet. Try the Bookings
              page.
            </p>
          </div>
        )}
      </Modal>
    );
  }

  if (firstSlot.status === "blocked") {
    return (
      <Modal open onClose={close} title="Slot blocked">
        {header}
        <div className="flex items-start gap-3 rounded-xl border-l-4 border-muted-foreground bg-surface-raised px-3.5 py-3">
          <Lock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <p className="text-sm font-semibold text-foreground">
            {firstSlot.blockedReason ?? "Blocked"}
          </p>
        </div>
        {error && <p className="mt-3 text-xs font-semibold text-destructive">{error}</p>}
        <Button
          variant="outline"
          className="mt-4 w-full"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setError(null);
            try {
              await unblockSlot([firstSlot.id]);
              onChanged();
              close();
            } catch (e) {
              setError(e instanceof Error ? e.message : "Could not unblock this slot.");
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? "Unblocking\u2026" : "Unblock this slot"}
        </Button>
      </Modal>
    );
  }

  // status === "available" (one or more contiguous slots)
  return (
    <Modal
      open
      onClose={close}
      title={isMulti ? `${slots.length} slots selected` : "Available slot"}
    >
      {header}

      {mode === "summary" && (
        <div className="flex flex-col gap-2.5">
          <button
            onClick={() => setMode("book")}
            className="flex items-center gap-3 rounded-xl border border-border p-3.5 text-left hover:border-primary"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <User className="h-5 w-5 text-primary" />
            </span>
            <span>
              <span className="block text-sm font-semibold text-foreground">
                Create walk-in booking
              </span>
              <span className="block text-xs text-muted-foreground">
                For a customer booking at the front desk
              </span>
            </span>
          </button>
          <button
            onClick={() => setMode("block")}
            className="flex items-center gap-3 rounded-xl border border-border p-3.5 text-left hover:border-accent"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15">
              <Lock className="h-5 w-5 text-accent" />
            </span>
            <span>
              <span className="block text-sm font-semibold text-foreground">
                Block {isMulti ? "these slots" : "this slot"}
              </span>
              <span className="block text-xs text-muted-foreground">
                e.g. maintenance, private event
              </span>
            </span>
          </button>
        </div>
      )}

      {mode === "block" && (
        <div className="flex flex-col gap-4">
          <TextInput
            label="Reason"
            placeholder="e.g. Turf maintenance"
            value={blockReason}
            onChange={(e) => setBlockReason(e.target.value)}
            autoFocus
          />
          {error && <p className="text-xs font-semibold text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              disabled={busy}
              onClick={() => setMode("summary")}
            >
              Back
            </Button>
            <Button
              variant="accent"
              className="flex-1"
              disabled={!blockReason.trim() || busy}
              onClick={async () => {
                setBusy(true);
                setError(null);
                try {
                  await blockSlot(
                    slots.map((s) => s.id),
                    blockReason.trim(),
                  );
                  onChanged();
                  close();
                } catch (e) {
                  setError(
                    e instanceof Error && e.message.includes("SLOT_NOT_AVAILABLE")
                      ? "One of these slots was just taken. Refresh and try again."
                      : e instanceof Error
                        ? e.message
                        : "Could not block this slot.",
                  );
                } finally {
                  setBusy(false);
                }
              }}
            >
              {busy ? (
                "Blocking\u2026"
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" /> Block{" "}
                  {isMulti ? `${slots.length} slots` : "slot"}
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {mode === "book" && (
        <div className="flex flex-col gap-4">
          <TextInput
            label="Customer name"
            placeholder="e.g. Rohan Kapoor"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            autoFocus
          />
          <TextInput
            label="Phone number"
            type="tel"
            inputMode="numeric"
            placeholder="98765 43210"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
          />

          <div>
            <span className="mb-1.5 block text-sm font-semibold text-foreground">
              Payment method
            </span>
            <div className="flex gap-2">
              {PAYMENT_OPTIONS.map((o) => (
                <button
                  key={o.method}
                  onClick={() => {
                    setPaymentMethod(o.method);
                    if (o.impliesPaid) setMarkPaidNow(true);
                  }}
                  className={`flex-1 rounded-xl border py-2 text-xs font-semibold transition-colors ${
                    paymentMethod === o.method
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {!selectedOption.impliesPaid && (
            <div>
              <span className="mb-1.5 block text-sm font-semibold text-foreground">
                Payment status
              </span>
              <div className="flex gap-2">
                {[
                  { value: true, label: "Collected now" },
                  { value: false, label: "Pay later" },
                ].map((opt) => (
                  <button
                    key={String(opt.value)}
                    onClick={() => setMarkPaidNow(opt.value)}
                    className={`flex-1 rounded-xl border py-2 text-sm font-semibold transition-colors ${
                      markPaidNow === opt.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-foreground">
              Amount{isMulti ? ` (${slots.length} slots)` : ""}
            </span>
            <div className="flex items-center gap-1 rounded-xl border border-border bg-surface px-3.5 py-2.5">
              <span className="text-sm text-muted-foreground">₹</span>
              <input
                type="number"
                min={0}
                placeholder={String(totalPrice)}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-transparent text-sm text-foreground outline-none"
              />
            </div>
          </label>

          {error && <p className="text-xs font-semibold text-destructive">{error}</p>}

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              disabled={busy}
              onClick={() => setMode("summary")}
            >
              Back
            </Button>
            <Button
              className="flex-1"
              disabled={!customerName.trim() || customerPhone.length !== 10 || busy}
              onClick={async () => {
                setBusy(true);
                setError(null);
                try {
                  await createWalkinBooking({
                    slotIds: slots.map((s) => s.id),
                    customerName: customerName.trim(),
                    customerPhone,
                    amount: effectiveAmount,
                    paymentMethod,
                    paymentStatus: selectedOption.impliesPaid || markPaidNow ? "paid" : "pending",
                  });
                  onChanged();
                  close();
                } catch (e) {
                  setError(
                    e instanceof Error && e.message.includes("SLOT_UNAVAILABLE")
                      ? "Someone just booked one of these slots. Refresh and try another."
                      : e instanceof Error
                        ? e.message
                        : "Could not create this booking.",
                  );
                } finally {
                  setBusy(false);
                }
              }}
            >
              {busy ? (
                "Booking\u2026"
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" /> Confirm booking
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}