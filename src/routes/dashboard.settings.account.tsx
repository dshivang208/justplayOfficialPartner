import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, LogOut, User, PauseCircle, PlayCircle, Receipt, Smartphone } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabaseClient";
import { useVenueProfile } from "@/lib/venueProfile";
import { Button } from "@/components/partner/Button";
import { Modal } from "@/components/partner/Modal";
import { TextInput } from "@/components/partner/FormFields";

export const Route = createFileRoute("/dashboard/settings/account")({
  head: () => ({ meta: [{ title: "Account | JustPlay Partner" }] }),
  component: AccountPage,
});

function AccountPage() {
  const { partner, logout, refreshPartnerContext } = useAuth();
  const { profile, updateBusinessDetails, toggleOperationalStatus } = useVenueProfile();
  const navigate = useNavigate();

  const [legalName, setLegalName] = useState(profile.legalBusinessName);
  const [gst, setGst] = useState(profile.gstNumber ?? "");
  const [businessSaved, setBusinessSaved] = useState(true);
  const [businessSaving, setBusinessSaving] = useState(false);
  const [businessError, setBusinessError] = useState<string | null>(null);

  const [ownerName, setOwnerName] = useState(partner?.ownerName ?? "");
  const [ownerSaving, setOwnerSaving] = useState(false);
  const [ownerMsg, setOwnerMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [statusBusy, setStatusBusy] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [deactivateOpen, setDeactivateOpen] = useState(false);

  if (!partner) return null;

  const ownerClean = ownerName.trim().replace(/\s+/g, " ");
  const ownerDirty = ownerClean !== partner.ownerName;
  const handleSaveOwner = async () => {
    if (ownerClean.length < 2 || ownerClean.length > 80) {
      setOwnerMsg({ ok: false, text: "Enter your full name (2\u201380 characters)." });
      return;
    }
    setOwnerSaving(true);
    setOwnerMsg(null);
    try {
      const { data, error } = await supabase
        .from("partners")
        .update({ owner_name: ownerClean })
        .eq("id", partner.id)
        .select("owner_name")
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!data) throw new Error("Could not update your name. Try again.");
      await refreshPartnerContext();
      setOwnerName(ownerClean);
      setOwnerMsg({ ok: true, text: "Name updated. The JustPlay team will see the new name too." });
    } catch (e) {
      setOwnerMsg({ ok: false, text: e instanceof Error ? e.message : "Could not update your name." });
    } finally {
      setOwnerSaving(false);
    }
  };

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
          <User className="h-4 w-4 text-muted-foreground" /> Owner name
        </h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Shown in your dashboard and to the JustPlay team.
        </p>
        <div className="mt-4 flex flex-col gap-4">
          <TextInput
            label="Your full name"
            value={ownerName}
            maxLength={80}
            onChange={(e) => {
              setOwnerName(e.target.value);
              setOwnerMsg(null);
            }}
          />
          <Button
            size="sm"
            variant="outline"
            className="self-start"
            disabled={!ownerDirty || ownerSaving}
            onClick={handleSaveOwner}
          >
            {ownerSaving ? "Saving\u2026" : ownerDirty ? "Save name" : "Saved"}
          </Button>
          {ownerMsg && (
            <p className={"text-xs font-medium " + (ownerMsg.ok ? "text-primary" : "text-destructive")}>
              {ownerMsg.text}
            </p>
          )}
        </div>
      </div>

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