import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, LogOut, PauseCircle, PlayCircle, Receipt, Smartphone } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useVenueProfile } from "@/lib/venueProfile";
import { Button } from "@/components/partner/Button";
import { Modal } from "@/components/partner/Modal";
import { TextInput } from "@/components/partner/FormFields";

export const Route = createFileRoute("/dashboard/settings/account")({
  head: () => ({ meta: [{ title: "Account | JustPlay Partner" }] }),
  component: AccountPage,
});

function AccountPage() {
  const { partner, logout } = useAuth();
  const { profile, updateBusinessDetails, toggleOperationalStatus } = useVenueProfile();
  const navigate = useNavigate();

  const [legalName, setLegalName] = useState(profile.legalBusinessName);
  const [gst, setGst] = useState(profile.gstNumber ?? "");
  const [businessSaved, setBusinessSaved] = useState(true);
  const [businessSaving, setBusinessSaving] = useState(false);
  const [businessError, setBusinessError] = useState<string | null>(null);

  const [statusBusy, setStatusBusy] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [deactivateOpen, setDeactivateOpen] = useState(false);

  if (!partner) return null;

  const handleSaveBusinessDetails = async () => {
    setBusinessSaving(true);
    setBusinessError(null);
    try {
      await updateBusinessDetails({
        legalBusinessName: legalName.trim(),
        gstNumber: gst.trim() || null,
      });
      setBusinessSaved(true);
    } catch (e) {
      setBusinessError(e instanceof Error ? e.message : "Could not save business details.");
    } finally {
      setBusinessSaving(false);
    }
  };

  const handleToggleStatus = async () => {
    setStatusBusy(true);
    setStatusError(null);
    try {
      await toggleOperationalStatus();
    } catch (e) {
      setStatusError(e instanceof Error ? e.message : "Could not update venue status.");
    } finally {
      setStatusBusy(false);
    }
  };

  return (
    <div className="flex max-w-xl flex-col gap-5">
      <div className="surface-card rounded-2xl p-5">
        <h2 className="flex items-center gap-2 font-display text-base font-semibold text-foreground">
          <Receipt className="h-4 w-4 text-muted-foreground" /> Business details
        </h2>
        <p className="mt-0.5 text-xs text-muted-foreground">Used on invoices and tax filings.</p>
        <div className="mt-4 flex flex-col gap-4">
          <TextInput
            label="Legal business name"
            value={legalName}
            onChange={(e) => {
              setLegalName(e.target.value);
              setBusinessSaved(false);
            }}
          />
          <TextInput
            label="GST number (optional)"
            placeholder="e.g. 09ABCPV1234F1Z5"
            value={gst}
            onChange={(e) => {
              setGst(e.target.value.toUpperCase());
              setBusinessSaved(false);
            }}
          />
          <Button
            size="sm"
            variant="outline"
            className="self-start"
            disabled={businessSaved || businessSaving}
            onClick={handleSaveBusinessDetails}
          >
            {businessSaving ? "Saving\u2026" : businessSaved ? "Saved" : "Save business details"}
          </Button>
          {businessError && <p className="text-xs font-medium text-destructive">{businessError}</p>}
        </div>
      </div>

      <div className="surface-card rounded-2xl p-5">
        <h2 className="flex items-center gap-2 font-display text-base font-semibold text-foreground">
          <Smartphone className="h-4 w-4 text-muted-foreground" /> Login phone number
        </h2>
        <p className="mt-2 text-sm text-foreground">+91 {partner.phone}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Changing your login number isn't available yet &mdash; contact the partner team if you've
          switched numbers.
        </p>
      </div>

      <div className="surface-card rounded-2xl p-5">
        <h2 className="font-display text-base font-semibold text-foreground">Venue status</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {profile.operationalStatus === "live"
            ? "Your venue is live and accepting new bookings."
            : "Your venue is paused \u2014 it won't accept new bookings until you reactivate it."}
        </p>
        <Button
          size="sm"
          variant={profile.operationalStatus === "live" ? "outline" : "primary"}
          className="mt-3"
          disabled={statusBusy}
          onClick={() =>
            profile.operationalStatus === "live" ? setDeactivateOpen(true) : handleToggleStatus()
          }
        >
          {profile.operationalStatus === "live" ? (
            <>
              <PauseCircle className="h-4 w-4" /> Deactivate venue
            </>
          ) : (
            <>
              <PlayCircle className="h-4 w-4" />{" "}
              {statusBusy ? "Reactivating\u2026" : "Reactivate venue"}
            </>
          )}
        </Button>
        {statusError && <p className="mt-2 text-xs font-medium text-destructive">{statusError}</p>}
      </div>

      <div className="surface-card rounded-2xl p-5">
        <h2 className="font-display text-base font-semibold text-foreground">Session</h2>
        <Button
          size="sm"
          variant="outline"
          className="mt-3"
          onClick={() => {
            logout();
            void navigate({ to: "/" });
          }}
        >
          <LogOut className="h-4 w-4" /> Log out
        </Button>
      </div>

      <Modal
        open={deactivateOpen}
        onClose={() => setDeactivateOpen(false)}
        title="Deactivate this venue?"
        width="sm"
      >
        <div className="flex items-start gap-3 rounded-xl bg-accent/10 px-3.5 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
          <p className="text-sm text-foreground">
            Your venue stops accepting new bookings immediately. Existing confirmed bookings aren't
            affected. You can reactivate any time &mdash; this isn't account deletion.
          </p>
        </div>
        <div className="mt-5 flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => setDeactivateOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            disabled={statusBusy}
            onClick={async () => {
              await handleToggleStatus();
              setDeactivateOpen(false);
            }}
          >
            {statusBusy ? "Deactivating\u2026" : "Deactivate"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}