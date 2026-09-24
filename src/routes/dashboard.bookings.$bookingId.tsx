import { useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  AlertOctagon,
  ArrowLeft,
  Ban,
  CheckCircle2,
  Flag,
  IndianRupee,
  Loader2,
  MapPin,
  Phone,
  ReceiptText,
  User,
  UserX,
} from "lucide-react";
import { useBookings } from "@/lib/bookings";
import { formatINR } from "@/data/dashboard";
import {
  formatBookingId,
  hoursUntilSlot,
  paymentMethodLabel,
  CANCELLATION_WINDOW_HOURS,
} from "@/data/bookings";
import { formatTimeLabel } from "@/data/inventory";
import { BookingStatusBadge, PaymentStatusBadge } from "@/components/partner/BookingBadges";
import { Button } from "@/components/partner/Button";
import { Modal } from "@/components/partner/Modal";
import { TextInput } from "@/components/partner/FormFields";

export const Route = createFileRoute("/dashboard/bookings/$bookingId")({
  head: () => ({ meta: [{ title: "Booking details | JustPlay Partner" }] }),
  component: BookingDetailPage,
});

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof User;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-raised">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </span>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="text-sm font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}

function BookingDetailPage() {
  const { bookingId } = Route.useParams();
  const {
    getBooking,
    loading,
    markCompleted,
    markNoShow,
    cancelBooking,
    saveNotes,
    flagBooking,
    unflagBooking,
  } = useBookings();

  const booking = getBooking(bookingId);

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [postCancelMessage, setPostCancelMessage] = useState<string | null>(null);

  const [flagOpen, setFlagOpen] = useState(false);
  const [flagReason, setFlagReason] = useState("");
  const [flagBusy, setFlagBusy] = useState(false);
  const [flagError, setFlagError] = useState<string | null>(null);

  const [actionBusy, setActionBusy] = useState<"complete" | "no_show" | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [notes, setNotes] = useState(booking?.notes ?? "");
  const [notesSaved, setNotesSaved] = useState(true);
  const [notesSaving, setNotesSaving] = useState(false);

  if (!booking) {
    if (loading) {
      return (
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      );
    }
    throw notFound();
  }

  const dateLabel = new Date(`${booking.date}T00:00:00`).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const hoursNotice = Math.max(0, Math.round(hoursUntilSlot(booking) * 10) / 10);

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        to="/dashboard/bookings"
        className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> All bookings
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-display text-2xl font-semibold text-foreground">
              {formatBookingId(booking.id)}
            </h1>
            <BookingStatusBadge status={booking.status} />
            {booking.flagged && (
              <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-semibold text-destructive">
                <Flag className="h-3 w-3" /> Flagged
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Booked{" "}
            {new Date(booking.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
            {booking.source === "walk_in" ? " \u00b7 Walk-in (front desk)" : " \u00b7 JustPlay app"}
          </p>
        </div>
      </div>

      {postCancelMessage && (
        <div className="mt-4 flex items-start gap-3 rounded-2xl border-l-4 border-accent bg-accent/10 px-4 py-3.5">
          <AlertOctagon className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
          <p className="text-sm text-foreground">{postCancelMessage}</p>
        </div>
      )}

      <div className="surface-card mt-5 rounded-2xl p-5">
        <h2 className="font-display text-base font-semibold text-foreground">Customer</h2>
        <div className="mt-2 flex flex-col divide-y divide-border">
          <InfoRow icon={User} label="Name" value={booking.customerName} />
          <InfoRow
            icon={Phone}
            label="Phone"
            value={booking.customerPhone ? `+91 ${booking.customerPhone}` : "Not provided"}
          />
        </div>
      </div>

      <div className="surface-card mt-4 rounded-2xl p-5">
        <h2 className="font-display text-base font-semibold text-foreground">Booking details</h2>
        <div className="mt-2 flex flex-col divide-y divide-border">
          <InfoRow
            icon={MapPin}
            label="Venue / court"
            value={`${booking.courtName} \u2014 ${booking.sport}`}
          />
          <InfoRow
            icon={ReceiptText}
            label="Date & time"
            value={`${dateLabel}, ${formatTimeLabel(booking.startTime)} \u2013 ${formatTimeLabel(booking.endTime)}`}
          />
          <InfoRow icon={IndianRupee} label="Amount" value={formatINR(booking.amount)} />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground">Payment:</span>
          <PaymentStatusBadge status={booking.paymentStatus} />
          <span className="text-xs text-muted-foreground">
            via {paymentMethodLabel(booking.paymentMethod)}
          </span>
        </div>
      </div>

      {booking.status === "cancelled" && (
        <div className="surface-card mt-4 rounded-2xl p-5">
          <h2 className="font-display text-base font-semibold text-foreground">Cancellation</h2>
          <p className="mt-2 text-sm text-foreground">
            {booking.cancellationReason || "No reason given."}
          </p>
          <div
            className={`mt-3 flex items-start gap-2.5 rounded-xl px-3.5 py-3 text-sm ${
              booking.paymentStatus === "refunded"
                ? "bg-primary/5 text-foreground"
                : "bg-surface-raised text-muted-foreground"
            }`}
          >
            <AlertOctagon className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              {booking.paymentStatus === "refunded"
                ? "Refund issued to the customer."
                : booking.source === "walk_in"
                  ? "Walk-in bookings are settled directly with the customer \u2014 nothing to refund through JustPlay."
                  : booking.paymentStatus === "paid"
                    ? `Cancelled inside the free-cancellation window (policy: ${CANCELLATION_WINDOW_HOURS}+ hours before the slot) \u2014 no refund owed.`
                    : "This booking was never paid \u2014 nothing to refund."}
            </span>
          </div>
        </div>
      )}

      {booking.status === "confirmed" && (
        <div className="surface-card mt-4 rounded-2xl p-5">
          <h2 className="font-display text-base font-semibold text-foreground">Actions</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {hoursNotice > 0 ? `Slot is in ${hoursNotice} hours.` : "Slot time has passed."}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              size="sm"
              disabled={actionBusy != null}
              onClick={async () => {
                setActionBusy("complete");
                setActionError(null);
                try {
                  await markCompleted(booking.id);
                } catch (e) {
                  setActionError(
                    e instanceof Error ? e.message : "Could not mark this booking completed.",
                  );
                } finally {
                  setActionBusy(null);
                }
              }}
            >
              <CheckCircle2 className="h-4 w-4" />
              {actionBusy === "complete" ? "Saving\u2026" : "Mark as completed"}
            </Button>
            <Button
              size="sm"
              variant="accent"
              disabled={actionBusy != null}
              onClick={async () => {
                setActionBusy("no_show");
                setActionError(null);
                try {
                  await markNoShow(booking.id);
                } catch (e) {
                  setActionError(
                    e instanceof Error ? e.message : "Could not mark this booking no-show.",
                  );
                } finally {
                  setActionBusy(null);
                }
              }}
            >
              <UserX className="h-4 w-4" />
              {actionBusy === "no_show" ? "Saving\u2026" : "Mark as no-show"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={actionBusy != null}
              onClick={() => setCancelOpen(true)}
            >
              <Ban className="h-4 w-4" /> Cancel booking
            </Button>
          </div>
          {actionError && (
            <p className="mt-2 text-xs font-semibold text-destructive">{actionError}</p>
          )}
        </div>
      )}

      <div className="surface-card mt-4 rounded-2xl p-5">
        <h2 className="font-display text-base font-semibold text-foreground">Internal notes</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">Only visible to your venue staff.</p>
        <textarea
          value={notes}
          onChange={(e) => {
            setNotes(e.target.value);
            setNotesSaved(false);
          }}
          rows={3}
          placeholder="e.g. Regular customer, prefers evening slots"
          className="mt-3 w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary"
        />
        <Button
          size="sm"
          variant="outline"
          className="mt-2"
          disabled={notesSaved || notesSaving}
          onClick={async () => {
            setNotesSaving(true);
            try {
              await saveNotes(booking.id, notes);
              setNotesSaved(true);
            } catch {
              // Leave notesSaved false so the button stays enabled to retry.
            } finally {
              setNotesSaving(false);
            }
          }}
        >
          {notesSaving ? "Saving\u2026" : notesSaved ? "Saved" : "Save notes"}
        </Button>
      </div>

      <div className="surface-card mt-4 rounded-2xl p-5">
        <h2 className="font-display text-base font-semibold text-foreground">Flag for review</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Logs a dispute or trust concern against this booking &mdash; separate from marking it
          no-show.
        </p>
        {booking.flagged ? (
          <div className="mt-3 flex items-start gap-3 rounded-xl border-l-4 border-destructive bg-destructive/5 px-3.5 py-3">
            <Flag className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">{booking.flagReason}</p>
              {booking.flaggedAt && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Flagged {new Date(booking.flaggedAt).toLocaleDateString("en-IN")}
                </p>
              )}
            </div>
            <button
              disabled={flagBusy}
              onClick={async () => {
                setFlagBusy(true);
                try {
                  await unflagBooking(booking.id);
                } catch (e) {
                  setFlagError(e instanceof Error ? e.message : "Could not remove this flag.");
                } finally {
                  setFlagBusy(false);
                }
              }}
              className="shrink-0 text-xs font-semibold text-destructive underline underline-offset-2"
            >
              {flagBusy ? "Removing\u2026" : "Remove flag"}
            </button>
          </div>
        ) : (
          <Button size="sm" variant="outline" className="mt-3" onClick={() => setFlagOpen(true)}>
            <Flag className="h-4 w-4" /> Flag this booking
          </Button>
        )}
        {flagError && <p className="mt-2 text-xs font-semibold text-destructive">{flagError}</p>}
      </div>

      <Modal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title="Cancel this booking"
        width="sm"
      >
        <p className="text-sm text-muted-foreground">
          This frees up the slot on your calendar immediately, and issues a refund automatically if
          the cancellation policy allows it.
        </p>
        <div className="mt-4">
          <TextInput
            label="Reason"
            placeholder="e.g. Venue unavailable, customer requested"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            autoFocus
          />
        </div>
        {cancelError && (
          <p className="mt-3 text-xs font-semibold text-destructive">{cancelError}</p>
        )}
        <div className="mt-5 flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            disabled={cancelling}
            onClick={() => setCancelOpen(false)}
          >
            Keep booking
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            disabled={!cancelReason.trim() || cancelling}
            onClick={async () => {
              setCancelling(true);
              setCancelError(null);
              try {
                const result = await cancelBooking(booking.id, cancelReason.trim());
                setCancelOpen(false);
                setCancelReason("");
                setPostCancelMessage(
                  result.refundError
                    ? result.refundError
                    : result.refunded
                      ? "Booking cancelled and refund issued."
                      : "Booking cancelled.",
                );
              } catch (e) {
                setCancelError(e instanceof Error ? e.message : "Could not cancel this booking.");
              } finally {
                setCancelling(false);
              }
            }}
          >
            {cancelling ? "Cancelling\u2026" : "Cancel booking"}
          </Button>
        </div>
      </Modal>

      <Modal
        open={flagOpen}
        onClose={() => setFlagOpen(false)}
        title="Flag this booking"
        width="sm"
      >
        <p className="text-sm text-muted-foreground">
          For disputes or trust concerns &mdash; e.g. payment mismatch, abusive behaviour, suspected
          fraud.
        </p>
        <div className="mt-4">
          <TextInput
            label="Reason"
            placeholder="e.g. Customer disputed the charge"
            value={flagReason}
            onChange={(e) => setFlagReason(e.target.value)}
            autoFocus
          />
        </div>
        {flagError && <p className="mt-3 text-xs font-semibold text-destructive">{flagError}</p>}
        <div className="mt-5 flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            disabled={flagBusy}
            onClick={() => setFlagOpen(false)}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            disabled={!flagReason.trim() || flagBusy}
            onClick={async () => {
              setFlagBusy(true);
              setFlagError(null);
              try {
                await flagBooking(booking.id, flagReason.trim());
                setFlagOpen(false);
                setFlagReason("");
              } catch (e) {
                setFlagError(e instanceof Error ? e.message : "Could not flag this booking.");
              } finally {
                setFlagBusy(false);
              }
            }}
          >
            {flagBusy ? "Flagging\u2026" : "Flag booking"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
