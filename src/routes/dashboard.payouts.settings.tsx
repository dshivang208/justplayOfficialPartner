import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AlertCircle, CheckCircle2, Clock, Landmark, Loader2, Smartphone } from "lucide-react";
import { usePayouts } from "@/lib/payouts";
import { maskAccountNumber, verificationLabel, type PayoutMethodType } from "@/data/payouts";
import { Button } from "@/components/partner/Button";
import { TextInput } from "@/components/partner/FormFields";
import { PillTabs } from "@/components/partner/PillTabs";

export const Route = createFileRoute("/dashboard/payouts/settings")({
  head: () => ({ meta: [{ title: "Bank Details | JustPlay Partner" }] }),
  component: PayoutSettingsPage,
});

function PayoutSettingsPage() {
  const { payoutSettings, savePayoutSettings } = usePayouts();

  const [method, setMethod] = useState<PayoutMethodType>(payoutSettings.method);
  const [accountHolderName, setAccountHolderName] = useState(
    payoutSettings.bank?.accountHolderName ?? "",
  );
  const [accountNumber, setAccountNumber] = useState(payoutSettings.bank?.accountNumber ?? "");
  const [ifsc, setIfsc] = useState(payoutSettings.bank?.ifsc ?? "");
  const [upiId, setUpiId] = useState(payoutSettings.upi?.upiId ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const canSave =
    method === "bank"
      ? accountHolderName.trim().length > 1 &&
        accountNumber.trim().length >= 6 &&
        ifsc.trim().length >= 6
      : /^[\w.-]{2,}@[\w]{2,}$/.test(upiId.trim());

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    setSaveMessage(null);
    try {
      const result =
        method === "bank"
          ? await savePayoutSettings({
              method: "bank",
              bank: {
                accountHolderName: accountHolderName.trim(),
                accountNumber: accountNumber.trim(),
                ifsc: ifsc.trim().toUpperCase(),
              },
            })
          : await savePayoutSettings({ method: "upi", upi: { upiId: upiId.trim() } });

      setSaved(true);
      if (result.message) setSaveMessage(result.message);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Could not save payout details. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const verificationStyles: Record<typeof payoutSettings.verificationStatus, string> = {
    verified: "bg-primary/10 text-primary",
    pending: "bg-accent/15 text-accent",
    failed: "bg-destructive/10 text-destructive",
  };

  const verificationCopy: Record<typeof payoutSettings.verificationStatus, string> = {
    verified: `Verified${payoutSettings.updatedAt ? " on " + new Date(payoutSettings.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : ""}. Payouts go to this account.`,
    pending:
      "We're verifying these details \u2014 this usually takes 1\u20132 business days. Payouts are held until verification completes.",
    failed:
      "Cashfree couldn't verify these details. Double-check the account/IFSC or UPI ID and save again.",
  };

  return (
    <div className="max-w-xl">
      <div className="surface-card rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-semibold text-foreground">
            Verification status
          </h2>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${verificationStyles[payoutSettings.verificationStatus]}`}
          >
            {payoutSettings.verificationStatus === "verified" ? (
              <CheckCircle2 className="h-3.5 w-3.5" />
            ) : payoutSettings.verificationStatus === "failed" ? (
              <AlertCircle className="h-3.5 w-3.5" />
            ) : (
              <Clock className="h-3.5 w-3.5" />
            )}
            {verificationLabel(payoutSettings.verificationStatus)}
          </span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {verificationCopy[payoutSettings.verificationStatus]}
        </p>
      </div>

      <div className="surface-card mt-4 rounded-2xl p-5">
        <h2 className="font-display text-base font-semibold text-foreground">Payout method</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Where should we send your weekly payouts?
        </p>

        <div className="mt-3">
          <PillTabs
            options={[
              { key: "bank", label: "Bank account" },
              { key: "upi", label: "UPI" },
            ]}
            value={method}
            onChange={(m) => {
              setMethod(m);
              setSaved(false);
              setSaveMessage(null);
              setSaveError(null);
            }}
          />
        </div>

        <div className="mt-4 flex flex-col gap-4">
          {method === "bank" ? (
            <>
              <TextInput
                label="Account holder name"
                placeholder="As per bank records"
                value={accountHolderName}
                onChange={(e) => {
                  setAccountHolderName(e.target.value);
                  setSaved(false);
                }}
                icon={Landmark}
              />
              <TextInput
                label="Account number"
                placeholder="e.g. 50100234456789"
                value={accountNumber}
                onChange={(e) => {
                  setAccountNumber(e.target.value.replace(/\D/g, ""));
                  setSaved(false);
                }}
              />
              {payoutSettings.bank && accountNumber === payoutSettings.bank.accountNumber && (
                <p className="-mt-2 text-xs text-muted-foreground">
                  Currently on file: {maskAccountNumber(payoutSettings.bank.accountNumber)}
                </p>
              )}
              <TextInput
                label="IFSC code"
                placeholder="e.g. HDFC0001234"
                value={ifsc}
                onChange={(e) => {
                  setIfsc(e.target.value.toUpperCase());
                  setSaved(false);
                }}
              />
            </>
          ) : (
            <TextInput
              label="UPI ID"
              placeholder="yourname@bank"
              value={upiId}
              onChange={(e) => {
                setUpiId(e.target.value);
                setSaved(false);
              }}
              icon={Smartphone}
            />
          )}

          <Button
            disabled={!canSave || saving || saved}
            onClick={handleSave}
            className="self-start"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : saved ? (
              "Saved"
            ) : (
              "Save payout details"
            )}
          </Button>

          {saveError && <p className="text-xs font-medium text-destructive">{saveError}</p>}
          {!saveError && saveMessage && (
            <p className="text-xs font-medium text-muted-foreground">{saveMessage}</p>
          )}
          {!saved && !saveError && (payoutSettings.bank || payoutSettings.upi) && (
            <p className="text-xs text-muted-foreground">
              Saving new details will reset your verification status.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}