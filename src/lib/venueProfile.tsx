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

export type VenueProfile = {
  name: string;
  description: string;
  address: string;
  photos: string[];
  amenities: string[];
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
  is_active: boolean;
  legal_business_name: string | null;
  gst_number: string | null;
  pending_name: string | null;
  pending_address: string | null;
};

function mapVenueRow(row: VenueRow): VenueProfile {
  return {
    name: row.name,
    description: row.about ?? "",
    address: row.address,
    photos: row.photos ?? [],
    amenities: row.amenities ?? [],
    operationalStatus: row.is_active ? "live" : "paused",
    legalBusinessName: row.legal_business_name ?? "",
    gstNumber: row.gst_number,
    pendingName: row.pending_name,
    pendingAddress: row.pending_address,
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
    const { data, error } = await supabase
      .from("venues")
      .select(
        "name, about, address, photos, amenities, is_active, legal_business_name, gst_number, pending_name, pending_address",
      )
      .eq("id", partner.venueId)
      .maybeSingle<VenueRow>();

    if (error) console.error("fetch venue profile failed:", error.message);
    setProfile(data ? mapVenueRow(data) : EMPTY_PROFILE);
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

  const submitMajorChange = useCallback(
    async (input: { name?: string; address?: string }) => {
      if (!partner) throw new Error("Not signed in.");
      const { data, error } = await supabase.rpc("partner_submit_venue_major_change", {
        p_venue_id: partner.venueId,
        p_name: input.name ?? null,
        p_address: input.address ?? null,
      });
      if (error) throw new Error(error.message || "Could not submit that change.");
      if (data) setProfile(mapVenueRow(data as VenueRow));
    },
    [partner],
  );

  const discardPendingChange = useCallback(async () => {
    if (!partner) throw new Error("Not signed in.");
    const { data, error } = await supabase.rpc("partner_discard_venue_pending_change", {
      p_venue_id: partner.venueId,
    });
    if (error) throw new Error(error.message || "Could not discard the pending change.");
    if (data) setProfile(mapVenueRow(data as VenueRow));
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
      if (data) setProfile(mapVenueRow(data as VenueRow));
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
    if (data) setProfile(mapVenueRow(data as VenueRow));
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