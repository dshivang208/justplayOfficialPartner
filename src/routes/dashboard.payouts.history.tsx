import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Landmark, Loader2, Smartphone } from "lucide-react";
import { usePayouts } from "@/lib/payouts";
import { formatINR } from "@/data/dashboard";
import { formatBookingId } from "@/data/bookings";
import { statusLabel, type PayoutBatch, type PayoutStatus } from "@/data/payouts";
import { Modal } from "@/components/partner/Modal";

export const Route = createFileRoute("/dashboard/payouts/history")({
  head: () => ({ meta: [{ title: "Payout History | JustPlay Partner" }] }),
  component: PayoutHistoryPage,
});

function StatusBadge({ status }: { status: PayoutStatus }) {
  const styles: Record<PayoutStatus, string> = {
    processing: "bg-accent/15 text-accent",
    completed: "bg-primary/10 text-primary",
    failed: "bg-destructive/10 text-destructive",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status]}`}
    >
      {statusLabel(status)}
    </span>
  );
}

function PayoutHistoryPage() {
  const { payoutBatches, loading } = usePayouts();
  const [openBatch, setOpenBatch] = useState<PayoutBatch | null>(null);

  const sorted = [...payoutBatches].sort((a, b) => (a.date < b.date ? 1 : -1));

  if (loading && sorted.length === 0) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (sorted.length === 0) {
    return (
      <div className="surface-card flex flex-col items-center justify-center rounded-2xl py-20 text-center">
        <p className="text-sm font-semibold text-foreground">No payouts yet</p>
        <p className="mt-1 max-w-xs text-sm text-muted-foreground">
          Once your venue starts taking bookings, payout batches will show up here.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="surface-card overflow-x-auto rounded-2xl">
        <table className="w-full min-w-[640px] text-left">
          <thead>
            <tr className="bg-surface-raised">
              {["Date", "Amount", "Method", "Status"].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-muted-foreground"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((b, i) => (
              <tr
                key={b.id}
                onClick={() => setOpenBatch(b)}
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && setOpenBatch(b)}
                className={`cursor-pointer hover:bg-secondary/40 ${i === 0 ? "" : "border-t border-border"}`}
              >
                <td className="px-4 py-3.5 text-sm text-foreground">
                  {new Date(`${b.date}T00:00:00`).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </td>
                <td className="px-4 py-3.5 text-sm font-semibold text-foreground">
                  {formatINR(b.amount)}
                </td>
                <td className="px-4 py-3.5 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    {b.method === "bank" ? (
                      <Landmark className="h-3.5 w-3.5" />
                    ) : (
                      <Smartphone className="h-3.5 w-3.5" />
                    )}
                    {b.method === "bank" ? "Bank transfer" : "UPI"}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <StatusBadge status={b.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        open={openBatch != null}
        onClose={() => setOpenBatch(null)}
        title={openBatch ? formatINR(openBatch.amount) + " payout" : ""}
        description={
          openBatch
            ? new Date(`${openBatch.date}T00:00:00`).toLocaleDateString("en-IN", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })
            : undefined
        }
        width="lg"
      >
        {openBatch && (
          <div className="flex flex-col divide-y divide-border">
            {openBatch.lineItems.map((li) => (
              <div key={li.bookingId} className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-muted-foreground">
                  {formatBookingId(li.bookingId)} &middot; {li.bookingLabel}
                </span>
                <span className="font-semibold text-foreground">{formatINR(li.netAmount)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between pt-3">
              <span className="text-sm font-bold text-foreground">Total transferred</span>
              <span className="font-display text-lg font-bold text-foreground">
                {formatINR(openBatch.amount)}
              </span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}