import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertOctagon,
  Camera,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ListChecks,
  LocateFixed,
  MapPin,
  X,
} from "lucide-react";
import { useVenueProfile, AMENITY_OPTIONS, AREA_OPTIONS, TAGLINE_MAX } from "@/lib/venueProfile";
import {
  KANPUR_CENTER,
  distanceKm,
  formatPin,
  mapsLink,
  parsePinInput,
  round6,
} from "@/lib/geo";
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
    saveLocation,
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

  // The profile loads asynchronously (and again after each save), but useState
  // above only reads it once at mount — so on a hard refresh of this page the
  // boxes started blank and "Submit" was enabled for an empty venue name. Keep
  // each draft in step with the saved value; this only fires when the SAVED
  // value changes, so it never overwrites text the owner is mid-typing.
  useEffect(() => {
    setNameDraft(profile.pendingName ?? profile.name);
  }, [profile.name, profile.pendingName]);
  useEffect(() => {
    setAddressDraft(profile.pendingAddress ?? profile.address);
  }, [profile.address, profile.pendingAddress]);
  useEffect(() => {
    setDescriptionDraft(profile.description);
    setDescriptionSaved(true);
  }, [profile.description]);

  // --- Listing details: tagline, area, map pin ---------------------------------
  const OTHER_AREA = "__other";
  const [taglineDraft, setTaglineDraft] = useState("");
  const [areaChoice, setAreaChoice] = useState("");
  const [areaOther, setAreaOther] = useState("");
  const [pinText, setPinText] = useState("");
  const [locating, setLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState<{ kind: "ok" | "error"; text: string } | null>(
    null,
  );
  const [savingLocation, setSavingLocation] = useState(false);

  useEffect(() => {
    setTaglineDraft(profile.tagline);
    if (AREA_OPTIONS.includes(profile.area)) {
      setAreaChoice(profile.area);
      setAreaOther("");
    } else if (profile.area) {
      setAreaChoice(OTHER_AREA);
      setAreaOther(profile.area);
    } else {
      setAreaChoice("");
      setAreaOther("");
    }
    setPinText(
      profile.latitude != null && profile.longitude != null
        ? formatPin({ lat: profile.latitude, lng: profile.longitude })
        : "",
    );
  }, [profile.tagline, profile.area, profile.latitude, profile.longitude]);

  const areaValue = areaChoice === OTHER_AREA ? areaOther.trim() : areaChoice;
  const pinResult = pinText.trim() === "" ? null : parsePinInput(pinText);
  const pinError =
    pinResult && !pinResult.ok
      ? {
          short_link:
            "That's a short link, and we can't read the location from it. Open it in your browser and paste the full address from the address bar instead — or paste the coordinates.",
          unrecognised:
            "We couldn't find a location in that. Paste a Google Maps link, or coordinates like 26.4780, 80.3319.",
          out_of_range: "Those numbers aren't a valid location on Earth.",
          empty: "",
        }[pinResult.reason]
      : null;
  const pin = pinResult && pinResult.ok ? { lat: pinResult.lat, lng: pinResult.lng } : null;
  const pinFarFromKanpur = pin ? distanceKm(KANPUR_CENTER, pin) > 60 : false;

  const savedPinMatches =
    (pin === null && profile.latitude == null && profile.longitude == null) ||
    (pin !== null &&
      profile.latitude != null &&
      profile.longitude != null &&
      round6(profile.latitude) === pin.lat &&
      round6(profile.longitude) === pin.lng);
  const locationDirty =
    taglineDraft.trim() !== profile.tagline || areaValue !== profile.area || !savedPinMatches;
  const canSaveLocation = locationDirty && !pinError && !savingLocation;

  const handleUseMyLocation = () => {
    if (!("geolocation" in navigator)) {
      setLocationStatus({ kind: "error", text: "This browser can't share your location." });
      return;
    }
    setLocating(true);
    setLocationStatus(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPinText(formatPin({ lat: pos.coords.latitude, lng: pos.coords.longitude }));
        setLocating(false);
      },
      () => {
        setLocating(false);
        setLocationStatus({
          kind: "error",
          text: "Couldn't get your location. Allow location access for this site, or paste a Google Maps link instead.",
        });
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  };

  const handleSaveLocation = async () => {
    setSavingLocation(true);
    setLocationStatus(null);
    try {
      await saveLocation({
        area: areaValue,
        tagline: taglineDraft.trim(),
        latitude: pin ? pin.lat : null,
        longitude: pin ? pin.lng : null,
      });
      setLocationStatus({ kind: "ok", text: "Saved — players see this on your venue page now." });
    } catch (e) {
      setLocationStatus({
        kind: "error",
        text: e instanceof Error ? e.message : "Could not save these details.",
      });
    } finally {
      setSavingLocation(false);
    }
  };

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
            Your address is shown to players as text. Set the map pin in the next section so they
            can find you on the map.
          </p>
        </div>
      </div>

      <div className="surface-card rounded-2xl p-5">
        <h2 className="font-display text-base font-semibold text-foreground">
          Listing details &amp; map pin
        </h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Saves when you press Save. Shown on your venue page and used for search, filters and
          distance.
        </p>

        <div className="mt-4 flex flex-col gap-4">
          <div>
            <TextInput
              label="Tagline"
              value={taglineDraft}
              maxLength={TAGLINE_MAX}
              placeholder="e.g. Six air-cooled wooden courts, tournament grade"
              onChange={(e) => setTaglineDraft(e.target.value)}
            />
            <p className="mt-1 text-right text-[11px] text-muted-foreground">
              {taglineDraft.length}/{TAGLINE_MAX}
            </p>
          </div>

          <div>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-foreground">Area</span>
              <select
                value={areaChoice}
                onChange={(e) => setAreaChoice(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary"
              >
                <option value="">Select your neighbourhood</option>
                {AREA_OPTIONS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
                <option value={OTHER_AREA}>Other&hellip;</option>
              </select>
            </label>
            {areaChoice === OTHER_AREA && (
              <div className="mt-2">
                <TextInput
                  label="Your area"
                  value={areaOther}
                  maxLength={60}
                  onChange={(e) => setAreaOther(e.target.value)}
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Your venue will be listed, but it won&apos;t appear when players filter by one of
                  the neighbourhoods above.
                </p>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <TextInput
                  label="Map pin"
                  icon={MapPin}
                  value={pinText}
                  placeholder="Paste a Google Maps link or 26.4780, 80.3319"
                  onChange={(e) => setPinText(e.target.value)}
                />
              </div>
              <Button variant="outline" size="sm" onClick={handleUseMyLocation} disabled={locating}>
                <LocateFixed className="h-4 w-4" /> {locating ? "Locating\u2026" : "Use my location"}
              </Button>
            </div>

            {pinError && <p className="mt-1.5 text-xs text-destructive">{pinError}</p>}

            {pin && (
              <p className="mt-1.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                <span>
                  Pin: <strong className="text-foreground">{formatPin(pin)}</strong>
                </span>
                <a
                  href={mapsLink(pin)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-primary underline underline-offset-2"
                >
                  Check on Google Maps <ExternalLink className="h-3 w-3" />
                </a>
              </p>
            )}

            {pinFarFromKanpur && (
              <p className="mt-1.5 rounded-lg bg-accent/10 px-3 py-2 text-xs text-foreground">
                This pin is far from Kanpur. Check it on Google Maps &mdash; latitude comes first
                (Kanpur is about 26.45, 80.33).
              </p>
            )}

            {!pinText.trim() && (
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                Without a pin, players won&apos;t see your venue on a map. Tip: stand at your venue
                and tap &ldquo;Use my location&rdquo;, or in Google Maps right-click your venue and
                click the numbers at the top to copy them.
              </p>
            )}
          </div>

          {locationStatus && (
            <p
              className={`text-sm ${
                locationStatus.kind === "ok" ? "text-primary" : "text-destructive"
              }`}
            >
              {locationStatus.text}
            </p>
          )}

          <div>
            <Button size="sm" disabled={!canSaveLocation} onClick={handleSaveLocation}>
              {savingLocation ? "Saving\u2026" : locationDirty ? "Save details" : "Saved"}
            </Button>
          </div>
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