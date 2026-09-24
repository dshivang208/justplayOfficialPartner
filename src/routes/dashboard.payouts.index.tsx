import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  AlertOctagon,
  CalendarClock,
  IndianRupee,
  Loader2,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { usePayouts } from "@/lib/payouts";
import { formatINR } from "@/data/dashboard";
import { formatBookingId } from "@/data/bookings";
import { dailyEarningsTrend, nextPayoutDate } from "@/data/payouts";
import { EarningsChart } from "@/components/partner/EarningsChart";
import { PillTabs } from "@/components/partner/PillTabs";
import { Button } from "@/components/partner/Button";

export const Route = createFileRoute("/dashboard/payouts/")({
  head: () => ({ meta: [{ title: "Earnings Overview | JustPlay Partner" }] }),
  component: PayoutsOverviewPage,
});

function BreakdownRow({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <span
        className={`text-sm ${emphasis ? "font-semibold text-foreground" : "text-muted-foreground"}`}
      >
        {label}
      </span>
      <span
        className={`text-sm ${emphasis ? "font-bold text-foreground" : "font-semibold text-foreground"}`}
      >
        {value}
      </span>
    </div>
  );
}

function PayoutsOverviewPage() {
  const {
    payoutBatches,
    pendingLineItems,
    pendingDeductions,
    pendingNet,
    runPayoutNow,
    payoutSettings,
  } = usePayouts();
  const [range, setRange] = useState<30 | 90>(30);
  const [runningPayout, setRunningPayout] = useState(false);
  const [runMessage, setRunMessage] = useState<string | null>(null);

  // Every booking that's contributed to a net figure, ever — already-paid
  // line items (from payoutBatches) plus what's currently pending. This is
  // real data, bucketed by each booking's own date, not a random walk.
  const allLineItems = useMemo(
    () => [...payoutBatches.flatMap((b) => b.lineItems), ...pendingLineItems],
    [payoutBatches, pendingLineItems],
  );

  const trend = useMemo(() => dailyEarningsTrend(allLineItems, range), [allLineItems, range]);

  const monthTotals = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const inMonth = allLineItems.filter(
      (li) => new Date(`${li.date}T00:00:00`).getMonth() === currentMonth,
    );
    const gross = inMonth.reduce((sum, li) => sum + li.grossAmount, 0);
    const net = inMonth.reduce((sum, li) => sum + li.netAmount, 0);
    return { gross, net, commission: gross - net };
  }, [allLineItems]);

  const pendingGross = pendingLineItems.reduce((sum, li) => sum + li.grossAmount, 0);
  const pendingCommission = pendingLineItems.reduce(
    (sum, li) => sum + (li.grossAmount - li.netAmount),
    0,
  );
  const deductionsTotal = pendingDeductions.reduce((sum, d) => sum + d.netAmount, 0);

  const lastCompleted = [...payoutBatches]
    .filter((b) => b.status === "completed")
    .sort((a, b) => (a.date < b.date ? 1 : -1))[0];

  const nextDate = nextPayoutDate();

  const canRunPayout = payoutSettings.verificationStatus === "verified" && pendingNet > 0;

  const handleRunPayout = async () => {
    setRunningPayout(true);
    setRunMessage(null);
    try {
      const result = await runPayoutNow();
      if (result.skipped) setRunMessage(result.skipped);
      else if (result.error) setRunMessage(result.error);
      else setRunMessage(`Payout of ${formatINR(result.amount ?? 0)} sent.`);
    } catch (e) {
      setRunMessage(e instanceof Error ? e.message : "Could not run payout.");
    } finally {
      setRunningPayout(false);
    }
  };

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="surface-card rounded-2xl p-4 sm:p-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <p className="mt-3 font-display text-2xl font-bold leading-none text-foreground">
            {formatINR(monthTotals.net)}
          </p>
          <p className="mt-1.5 text-xs font-medium text-muted-foreground">
            Net earnings this month
          </p>
        </div>
        <div className="surface-card rounded-2xl p-4 sm:p-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15">
            <Wallet className="h-5 w-5 text-accent" />
          </div>
          <p className="mt-3 font-display text-2xl font-bold leading-none text-foreground">
            {formatINR(pendingNet)}
          </p>
          <p className="mt-1.5 text-xs font-medium text-muted-foreground">Pending payout</p>
        </div>
        <div className="surface-card rounded-2xl p-4 sm:p-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <IndianRupee className="h-5 w-5 text-primary" />
          </div>
          <p className="mt-3 font-display text-2xl font-bold leading-none text-foreground">
            {lastCompleted ? formatINR(lastCompleted.amount) : "\u2014"}
          </p>
          <p className="mt-1.5 text-xs font-medium text-muted-foreground">
            Last payout
            {lastCompleted
              ? ` \u00b7 ${new Date(`${lastCompleted.date}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`
              : ""}
          </p>
        </div>
        <div className="surface-card rounded-2xl p-4 sm:p-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15">
            <CalendarClock className="h-5 w-5 text-accent" />
          </div>
          <p className="mt-3 font-display text-2xl font-bold leading-none text-foreground">
            {nextDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
          </p>
          <p className="mt-1.5 text-xs font-medium text-muted-foreground">Next scheduled payout</p>
        </div>
      </div>

      <div className="surface-card mt-5 rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-semibold text-foreground">Earnings trend</h2>
          <PillTabs
            options={[
              { key: 30, label: "30 days" },
              { key: 90, label: "90 days" },
            ]}
            value={range}
            onChange={setRange}
          />
        </div>
        <div className="mt-4">
          <EarningsChart data={trend} />
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="surface-card rounded-2xl p-5">
          <h2 className="font-display text-base font-semibold text-foreground">
            This month's breakdown
          </h2>
          <div className="mt-2 flex flex-col divide-y divide-border">
            <BreakdownRow label="Gross bookings revenue" value={formatINR(monthTotals.gross)} />
            <BreakdownRow
              label="Platform commission"
              value={`\u2212${formatINR(monthTotals.commission)}`}
            />
            <BreakdownRow label="Net payout owed" value={formatINR(monthTotals.net)} emphasis />
          </div>
        </div>

        <div className="surface-card rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-foreground">
              Pending payout detail
            </h2>
            {canRunPayout && (
              <Button onClick={handleRunPayout} disabled={runningPayout} size="sm">
                {runningPayout ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  "Run payout now"
                )}
              </Button>
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Bookings not yet included in a payout batch, next scheduled{" "}
            {nextDate.toLocaleDateString("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "short",
            })}
            .
          </p>
          {runMessage && <p className="mt-2 text-xs font-medium text-foreground">{runMessage}</p>}

          {pendingLineItems.length === 0 && pendingDeductions.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">Nothing pending right now.</p>
          ) : (
            <div className="mt-3 flex flex-col divide-y divide-border">
              {pendingLineItems.map((li) => (
                <div key={li.bookingId} className="flex items-center justify-between py-2 text-sm">
                  <span className="text-muted-foreground">
                    {formatBookingId(li.bookingId)} &middot; {li.bookingLabel}
                  </span>
                  <span className="font-semibold text-foreground">{formatINR(li.netAmount)}</span>
                </div>
              ))}
              {pendingDeductions.map((d) => (
                <div key={d.id} className="py-2">
                  <div className="flex items-start gap-2 rounded-xl bg-destructive/5 px-3 py-2.5">
                    <AlertOctagon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-destructive">
                          Deduction: {formatINR(d.netAmount)} ({formatBookingId(d.bookingId)}{" "}
                          refunded)
                        </span>
                        <TrendingDown className="h-3.5 w-3.5 text-destructive" />
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">{d.reason}</p>
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between pt-3">
                <span className="text-sm font-bold text-foreground">Total pending</span>
                <span className="font-display text-lg font-bold text-foreground">
                  {formatINR(pendingNet)}
                </span>
              </div>
              <p className="pt-1 text-[11px] text-muted-foreground">
                {formatINR(pendingGross)} gross &middot; −{formatINR(pendingCommission)} commission
                {pendingDeductions.length > 0
                  ? ` \u00b7 \u2212${formatINR(deductionsTotal)} deductions`
                  : ""}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}