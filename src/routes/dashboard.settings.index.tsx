import { useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertOctagon,
  Camera,
  ChevronLeft,
  ChevronRight,
  ListChecks,
  MapPin,
  X,
} from "lucide-react";
import { useVenueProfile, AMENITY_OPTIONS } from "@/lib/venueProfile";
import { useInventory } from "@/lib/inventory";
import { formatTimeLabel } from "@/data/inventory";
import { Button } from "@/components/partner/Button";
import { TextInput } from "@/components/partner/FormFields";

export const Route = createFileRoute("/dashboard/settings/")({
  head: () => ({ meta: [{ title: "Venue Profile | JustPlay Partner" }] }),
  component: VenueProfilePage,
});

function VenueProfilePage() {
  const {
    profile,
    reviewPending,
    updateDescription,
    updateAmenities,
    addPhoto,
    removePhoto,
    reorderPhoto,
    submitMajorChange,
    discardPendingChange,
  } = useVenueProfile();
  const { courts } = useInventory();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [nameDraft, setNameDraft] = useState(profile.pendingName ?? profile.name);
  const [addressDraft, setAddressDraft] = useState(profile.pendingAddress ?? profile.address);
  const [descriptionDraft, setDescriptionDraft] = useState(profile.description);
  const [descriptionSaved, setDescriptionSaved] = useState(true);
  const [identityError, setIdentityError] = useState<string | null>(null);
  const [savingField, setSavingField] = useState<"name" | "address" | "discard" | null>(null);

  const handleSubmitField = async (field: "name" | "address", value: string) => {
    setSavingField(field);
    setIdentityError(null);
    try {
      await submitMajorChange({ [field]: value });
    } catch (e) {
      setIdentityError(e instanceof Error ? e.message : "Could not submit that change.");
    } finally {
      setSavingField(null);
    }
  };

  const handleDiscard = async () => {
    setSavingField("discard");
    setIdentityError(null);
    try {
      await discardPendingChange();
      setNameDraft(profile.name);
      setAddressDraft(profile.address);
    } catch (e) {
      setIdentityError(e instanceof Error ? e.message : "Could not discard the pending change.");
    } finally {
      setSavingField(null);
    }
  };

  const handlePhotoPick = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") addPhoto(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const toggleAmenity = (a: string) => {
    updateAmenities(
      profile.amenities.includes(a)
        ? profile.amenities.filter((x) => x !== a)
        : [...profile.amenities, a],
    );
  };

  return (
    <div className="flex flex-col gap-5">
      {reviewPending && (
        <div className="flex items-start gap-3 rounded-2xl border-l-4 border-accent bg-accent/10 px-4 py-3.5">
          <AlertOctagon className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">Changes pending review</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {profile.pendingName && (
                <>
                  New name: <strong className="text-foreground">{profile.pendingName}</strong>
                  <br />
                </>
              )}
              {profile.pendingAddress && (
                <>
                  New address: <strong className="text-foreground">{profile.pendingAddress}</strong>
                  <br />
                </>
              )}
              Your venue stays live under its current details until this is approved &mdash; usually
              1&ndash;2 business days.
            </p>
            <button
              onClick={handleDiscard}
              disabled={savingField === "discard"}
              className="mt-2 text-xs font-semibold text-accent underline underline-offset-2 disabled:opacity-50"
            >
              {savingField === "discard" ? "Discarding\u2026" : "Discard pending change"}
            </button>
          </div>
        </div>
      )}

      {identityError && (
        <div className="flex items-start gap-3 rounded-2xl border-l-4 border-destructive bg-destructive/5 px-4 py-3.5">
          <AlertOctagon className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <p className="text-sm text-destructive">{identityError}</p>
        </div>
      )}

      <div className="surface-card rounded-2xl p-5">
        <h2 className="font-display text-base font-semibold text-foreground">Venue identity</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Changes to name or address go through a quick review before going live.
        </p>
        <div className="mt-4 flex flex-col gap-4">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <TextInput
                label="Venue name"
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={
                nameDraft.trim() === (profile.pendingName ?? profile.name) || savingField === "name"
              }
              onClick={() => handleSubmitField("name", nameDraft.trim())}
            >
              {savingField === "name" ? "Submitting\u2026" : "Submit"}
            </Button>
          </div>
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <TextInput
                label="Address"
                icon={MapPin}
                value={addressDraft}
                onChange={(e) => setAddressDraft(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={
                addressDraft.trim() === (profile.pendingAddress ?? profile.address) ||
                savingField === "address"
              }
              onClick={() => handleSubmitField("address", addressDraft.trim())}
            >
              {savingField === "address" ? "Submitting\u2026" : "Submit"}
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Map preview isn't available in this preview &mdash; the live app pins your address on
            the venue page.
          </p>
        </div>
      </div>

      <div className="surface-card rounded-2xl p-5">
        <h2 className="font-display text-base font-semibold text-foreground">Description</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Saves instantly &mdash; shown on your venue page.
        </p>
        <textarea
          value={descriptionDraft}
          onChange={(e) => {
            setDescriptionDraft(e.target.value);
            setDescriptionSaved(false);
          }}
          rows={4}
          placeholder="Tell players what makes your venue worth booking"
          className="mt-3 w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary"
        />
        <Button
          size="sm"
          variant="outline"
          className="mt-2"
          disabled={descriptionSaved}
          onClick={() => {
            updateDescription(descriptionDraft);
            setDescriptionSaved(true);
          }}
        >
          {descriptionSaved ? "Saved" : "Save description"}
        </Button>
      </div>

      <div className="surface-card rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-base font-semibold text-foreground">Photos</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Saves instantly. First photo is your cover image.
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handlePhotoPick(file);
              e.target.value = "";
            }}
          />
          <Button size="sm" onClick={() => fileInputRef.current?.click()}>
            <Camera className="h-4 w-4" /> Add photo
          </Button>
        </div>

        {profile.photos.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            No photos yet &mdash; add a few to help players recognize your venue.
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {profile.photos.map((src, i) => (
              <div
                key={i}
                className="group relative overflow-hidden rounded-xl border border-border"
              >
                <img src={src} alt={`Venue photo ${i + 1}`} className="h-28 w-full object-cover" />
                {i === 0 && (
                  <span className="absolute left-2 top-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                    Cover
                  </span>
                )}
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-ink/60 px-1.5 py-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <div className="flex gap-0.5">
                    <button
                      disabled={i === 0}
                      onClick={() => reorderPhoto(i, -1)}
                      className="flex h-6 w-6 items-center justify-center rounded text-white disabled:opacity-30"
                      aria-label="Move earlier"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    <button
                      disabled={i === profile.photos.length - 1}
                      onClick={() => reorderPhoto(i, 1)}
                      className="flex h-6 w-6 items-center justify-center rounded text-white disabled:opacity-30"
                      aria-label="Move later"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <button
                    onClick={() => removePhoto(i)}
                    className="flex h-6 w-6 items-center justify-center rounded text-white"
                    aria-label="Remove photo"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="surface-card rounded-2xl p-5">
        <h2 className="font-display text-base font-semibold text-foreground">Amenities</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">Saves instantly.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {AMENITY_OPTIONS.map((a) => {
            const active = profile.amenities.includes(a);
            return (
              <button
                key={a}
                onClick={() => toggleAmenity(a)}
                className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                  active
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground"
                }`}
              >
                {a}
              </button>
            );
          })}
        </div>
      </div>

      <div className="surface-card rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-semibold text-foreground">Sports & courts</h2>
          <Link
            to="/dashboard/slots/courts"
            className="flex items-center gap-1 text-xs font-semibold text-primary"
          >
            <ListChecks className="h-3.5 w-3.5" /> Manage in Slots & Inventory
          </Link>
        </div>
        {courts.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No courts added yet.</p>
        ) : (
          <div className="mt-3 flex flex-col divide-y divide-border">
            {courts.map((c) => (
              <div key={c.id} className="flex items-center justify-between py-2.5 text-sm">
                <span className="font-semibold text-foreground">{c.name}</span>
                <span className="text-muted-foreground">
                  {c.opensAt && c.closesAt
                    ? `${formatTimeLabel(c.opensAt)} \u2013 ${formatTimeLabel(c.closesAt)}`
                    : "Not set up yet"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}