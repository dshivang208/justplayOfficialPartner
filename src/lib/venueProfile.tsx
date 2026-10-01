/**
 * JustPlay Partner — venue profile & business details (Backend Phase E).
 *
 * Reads/writes the real `venues` row for this partner's venue. Minor
 * fields (description/photos/amenities) are optimistic: local state
 * updates immediately, the write happens in the background, and a
 * failure reverts to the exact pre-update snapshot + logs, rather than
 * surfacing a blocking error for what's meant to feel instant. The
 * review-gated fields (name/address) and business details are explicit
 * user actions with a Save/Submit button already in the UI, so those
 * return Promises the route files await and can show a real error for.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "./supabaseClient";
import { useAuth } from "./auth";

export const AMENITY_OPTIONS = [
  "Parking",
  "Floodlights",
  "Changing Rooms",
  "Washrooms",
  "Drinking Water",
  "Cafeteria",
  "Equipment Rental",
  "First Aid",
];

/** Neighbourhoods the Consumer app's area filter offers (Consumer:
 *  src/data/landing.ts `areas`). Keep the two lists in sync — Consumer
 *  filters venues with an exact match on this text. */
export const AREA_OPTIONS = [
  "Swaroop Nagar",
  "Kakadeo",
  "Civil Lines",
  "Kalyanpur",
  "Govind Nagar",
  "Panki",
  "Barra",
];

export const TAGLINE_MAX = 120;

export type LocationInput = {
  area: string;
  tagline: string;
  latitude: number | null;
  longitude: number | null;
};

const LOCATION_ERRORS: Record<string, string> = {
  NOT_ALLOWED: "Only the venue owner can change these details.",
  AREA_TOO_LONG: "Area name is too long (60 characters max).",
  TAGLINE_TOO_LONG: `Tagline is too long (${TAGLINE_MAX} characters max).`,
  LOCATION_INCOMPLETE: "The map pin needs both a latitude and a longitude.",
  LOCATION_OUT_OF_RANGE: "That map pin isn't a valid location.",
  VENUE_NOT_FOUND: "We couldn't find your venue. Try signing in again.",
};

export type VenueProfile = {
  name: string;
  description: string;
  address: string;
  photos: string[];
  amenities: string[];
  area: string;
  tagline: string;
  latitude: number | null;
  longitude: number | null;
  operationalStatus: "live" | "paused";
  legalBusinessName: string;
  gstNumber: string | null;
  pendingName: string | null;
  pendingAddress: string | null;
};

type VenueProfileContextValue = {
  loading: boolean;
  profile: VenueProfile;
  reviewPending: boolean;
  updateDescription: (description: string) => void;
  updateAmenities: (amenities: string[]) => void;
  addPhoto: (dataUrl: string) => void;
  removePhoto: (index: number) => void;
  reorderPhoto: (index: number, direction: -1 | 1) => void;
  saveLocation: (input: LocationInput) => Promise<void>;
  submitMajorChange: (input: { name?: string; address?: string }) => Promise<void>;
  discardPendingChange: () => Promise<void>;
  updateBusinessDetails: (input: {
    legalBusinessName: string;
    gstNumber: string | null;
  }) => Promise<void>;
  toggleOperationalStatus: () => Promise<void>;
};

const VenueProfileContext = createContext<VenueProfileContextValue | null>(null);

const EMPTY_PROFILE: VenueProfile = {
  name: "",
  description: "",
  address: "",
  photos: [],
  amenities: [],
  area: "",
  tagline: "",
  latitude: null,
  longitude: null,
  operationalStatus: "live",
  legalBusinessName: "",
  gstNumber: null,
  pendingName: null,
  pendingAddress: null,
};

type VenueRow = {
  name: string;
  about: string | null;
  address: string;
  photos: string[];
  amenities: string[];
  area: string | null;
  tagline: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
  is_active: boolean;
};

/** legal_business_name / gst_number / pending_name / pending_address are no
 *  longer selectable on the raw `venues` table for anon/authenticated (see
 *  migration 20260915000000_venues_private_columns.sql — they were
 *  readable by anyone on the public internet via Consumer's old `select
 *  *`). They're fetched separately below via partner_get_venue_private_
 *  details, a SECURITY DEFINER RPC that checks the caller actually owns or
 *  staffs this venue. */
type VenuePrivateRow = {
  legal_business_name: string | null;
  gst_number: string | null;
  pending_name: string | null;
  pending_address: string | null;
};

function mapVenueRow(row: VenueRow, priv: VenuePrivateRow | null): VenueProfile {
  return {
    name: row.name,
    description: row.about ?? "",
    address: row.address,
    photos: row.photos ?? [],
    amenities: row.amenities ?? [],
    area: row.area ?? "",
    tagline: row.tagline ?? "",
    // `numeric` columns can arrive as strings depending on the API layer.
    latitude: row.latitude == null ? null : Number(row.latitude),
    longitude: row.longitude == null ? null : Number(row.longitude),
    operationalStatus: row.is_active ? "live" : "paused",
    legalBusinessName: priv?.legal_business_name ?? "",
    gstNumber: priv?.gst_number ?? null,
    pendingName: priv?.pending_name ?? null,
    pendingAddress: priv?.pending_address ?? null,
  };
}

export function VenueProfileProvider({ children }: { children: ReactNode }) {
  const { partner } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<VenueProfile>(EMPTY_PROFILE);

  const refresh = useCallback(async () => {
    if (!partner) {
      setProfile(EMPTY_PROFILE);
      return;
    }
    setLoading(true);
    const [{ data, error }, privResult] = await Promise.all([
      supabase
        .from("venues")
        .select(
          "name, about, address, photos, amenities, area, tagline, latitude, longitude, is_active",
        )
        .eq("id", partner.venueId)
        .maybeSingle<VenueRow>(),
      supabase.rpc("partner_get_venue_private_details", { p_venue_id: partner.venueId }).maybeSingle<VenuePrivateRow>(),
    ]);

    if (error) console.error("fetch venue profile failed:", error.message);
    if (privResult.error) console.error("fetch venue private details failed:", privResult.error.message);
    setProfile(data ? mapVenueRow(data, privResult.data ?? null) : EMPTY_PROFILE);
    setLoading(false);
  }, [partner]);

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partner?.venueId]);

  /** Optimistic: applies `patch` immediately (via the functional form of
   *  setState, so `previous` is always the true current state regardless
   *  of this callback's own closure staleness), persists in the
   *  background, and reverts to exactly that `previous` snapshot if the
   *  save fails — never to some other in-between/optimistic value. */
  const saveMinor = useCallback(
    (
      patch: Partial<VenueProfile>,
      rpcArgs: { p_about?: string; p_amenities?: string[]; p_photos?: string[] },
    ) => {
      if (!partner) return;
      let previous: VenueProfile | null = null;
      setProfile((p) => {
        previous = p;
        return { ...p, ...patch };
      });

      void supabase
        .rpc("partner_save_venue_minor", { p_venue_id: partner.venueId, ...rpcArgs })
        .then(({ error }) => {
          if (error) {
            console.error("partner_save_venue_minor failed:", error.message);
            if (previous) setProfile(previous);
          }
        });
    },
    [partner],
  );

  const updateDescription = useCallback(
    (description: string) => saveMinor({ description }, { p_about: description }),
    [saveMinor],
  );

  const updateAmenities = useCallback(
    (amenities: string[]) => saveMinor({ amenities }, { p_amenities: amenities }),
    [saveMinor],
  );

  const addPhoto = useCallback(
    (dataUrl: string) => {
      const photos = [...profile.photos, dataUrl];
      saveMinor({ photos }, { p_photos: photos });
    },
    [profile.photos, saveMinor],
  );

  const removePhoto = useCallback(
    (index: number) => {
      const photos = profile.photos.filter((_, i) => i !== index);
      saveMinor({ photos }, { p_photos: photos });
    },
    [profile.photos, saveMinor],
  );

  const reorderPhoto = useCallback(
    (index: number, direction: -1 | 1) => {
      const next = [...profile.photos];
      const target = index + direction;
      if (target < 0 || target >= next.length) return;
      [next[index], next[target]] = [next[target]!, next[index]!];
      saveMinor({ photos: next }, { p_photos: next });
    },
    [profile.photos, saveMinor],
  );

  const saveLocation = useCallback(
    async (input: LocationInput) => {
      if (!partner) throw new Error("Not signed in.");
      const { data, error } = await supabase.rpc("partner_save_venue_location", {
        p_venue_id: partner.venueId,
        p_area: input.area,
        p_tagline: input.tagline,
        p_latitude: input.latitude,
        p_longitude: input.longitude,
      });
      if (error) {
        throw new Error(LOCATION_ERRORS[error.message] ?? (error.message || "Could not save these details."));
      }
      if (data) setProfile(mapVenueRow(data as VenueRow, data as VenuePrivateRow));
    },
    [partner],
  );

  const submitMajorChange = useCallback(
    async (input: { name?: string; address?: string }) => {
      if (!partner) throw new Error("Not signed in.");
      const { data, error } = await supabase.rpc("partner_submit_venue_major_change", {
        p_venue_id: partner.venueId,
        p_name: input.name ?? null,
        p_address: input.address ?? null,
      });
      if (error) throw new Error(error.message || "Could not submit that change.");
      if (data) setProfile(mapVenueRow(data as VenueRow, data as VenuePrivateRow));
    },
    [partner],
  );

  const discardPendingChange = useCallback(async () => {
    if (!partner) throw new Error("Not signed in.");
    const { data, error } = await supabase.rpc("partner_discard_venue_pending_change", {
      p_venue_id: partner.venueId,
    });
    if (error) throw new Error(error.message || "Could not discard the pending change.");
    if (data) setProfile(mapVenueRow(data as VenueRow, data as VenuePrivateRow));
  }, [partner]);

  const updateBusinessDetails = useCallback(
    async (input: { legalBusinessName: string; gstNumber: string | null }) => {
      if (!partner) throw new Error("Not signed in.");
      const { data, error } = await supabase.rpc("partner_update_business_details", {
        p_venue_id: partner.venueId,
        p_legal_business_name: input.legalBusinessName,
        p_gst_number: input.gstNumber,
      });
      if (error) throw new Error(error.message || "Could not save business details.");
      if (data) setProfile(mapVenueRow(data as VenueRow, data as VenuePrivateRow));
    },
    [partner],
  );

  const toggleOperationalStatus = useCallback(async () => {
    if (!partner) throw new Error("Not signed in.");
    const nextActive = profile.operationalStatus !== "live";
    const { data, error } = await supabase.rpc("partner_set_venue_active", {
      p_venue_id: partner.venueId,
      p_is_active: nextActive,
    });
    if (error) throw new Error(error.message || "Could not update venue status.");
    if (data) setProfile(mapVenueRow(data as VenueRow, data as VenuePrivateRow));
  }, [partner, profile.operationalStatus]);

  const reviewPending = profile.pendingName != null || profile.pendingAddress != null;

  const value = useMemo<VenueProfileContextValue>(
    () => ({
      loading,
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
      updateBusinessDetails,
      toggleOperationalStatus,
    }),
    [
      loading,
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
      updateBusinessDetails,
      toggleOperationalStatus,
    ],
  );

  return <VenueProfileContext.Provider value={value}>{children}</VenueProfileContext.Provider>;
}

export function useVenueProfile() {
  const ctx = useContext(VenueProfileContext);
  if (!ctx) throw new Error("useVenueProfile must be used inside <VenueProfileProvider>");
  return ctx;
}