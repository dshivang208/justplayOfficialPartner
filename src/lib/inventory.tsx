/**
 * JustPlay Partner — slot & inventory state (Backend Phase B).
 *
 * Courts, price bands and exceptions are fetched from the real `courts` /
 * `venue_pricing` / `venue_exceptions` tables, scoped to the signed-in
 * partner's venue. Every mutation calls one of the `partner_*` RPCs from
 * `20260829040000_partner_phase_b_slots.sql` (never a raw client
 * INSERT/UPDATE — those tables have no client write policies on purpose),
 * then refetches so this context and the database can never drift apart.
 *
 * Slot data itself (individual bookable rows for a visible date range)
 * intentionally does NOT live here — it's fetched directly by whichever
 * calendar view is on screen (see `dashboard.slots.index.tsx`), the same
 * way the consumer app fetches its own availability, rather than being
 * held as global state that would need range-aware invalidation.
 * `blockSlot`/`unblockSlot` live here anyway for API consistency with the
 * rest of this context, even though their effect (a slots row changing) is
 * visible somewhere this provider doesn't track — the caller re-fetches
 * its own visible range afterward.
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
import {
  fetchCourts,
  fetchExceptions,
  fetchPriceRules,
  type Court,
  type DateException,
  type PriceRule,
  type SlotDurationMinutes,
} from "@/data/inventory";
import { supabase } from "./supabaseClient";
import { useAuth } from "./auth";

type BulkSetupInput = {
  courtId: string;
  opensAt: string;
  closesAt: string;
  slotDurationMinutes: SlotDurationMinutes;
  priceRules: Omit<PriceRule, "id" | "courtId">[];
  generateDays: number;
};

type InventoryContextValue = {
  courts: Court[];
  priceRules: PriceRule[];
  exceptions: DateException[];
  loading: boolean;

  priceRulesForCourt: (courtId: string) => PriceRule[];

  addCourt: (input: { name: string; sport: string }) => Promise<Court>;
  updateCourt: (
    courtId: string,
    patch: { name: string; sport: string; status: Court["status"] },
  ) => Promise<void>;
  deleteCourt: (courtId: string) => Promise<void>;

  runBulkSetup: (input: BulkSetupInput) => Promise<void>;

  addException: (input: Omit<DateException, "id">) => Promise<void>;
  removeException: (id: string) => Promise<void>;

  blockSlot: (slotIds: string[], reason: string) => Promise<void>;
  unblockSlot: (slotIds: string[]) => Promise<void>;

  refresh: () => Promise<void>;
};

const InventoryContext = createContext<InventoryContextValue | null>(null);

export function InventoryProvider({ children }: { children: ReactNode }) {
  const { partner } = useAuth();
  const [courts, setCourts] = useState<Court[]>([]);
  const [priceRules, setPriceRules] = useState<PriceRule[]>([]);
  const [exceptions, setExceptions] = useState<DateException[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!partner) {
      setCourts([]);
      setPriceRules([]);
      setExceptions([]);
      return;
    }
    setLoading(true);
    const [c, p, e] = await Promise.all([
      fetchCourts(partner.venueId),
      fetchPriceRules(partner.venueId),
      fetchExceptions(partner.venueId),
    ]);
    setCourts(c);
    setPriceRules(p);
    setExceptions(e);
    setLoading(false);
  }, [partner]);

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partner?.venueId]);

  const priceRulesForCourt = useCallback(
    (courtId: string) => priceRules.filter((r) => r.courtId === courtId),
    [priceRules],
  );

  const addCourt = useCallback(
    async (input: { name: string; sport: string }) => {
      if (!partner) throw new Error("Not signed in");
      const { data, error } = await supabase.rpc("partner_add_court", {
        p_venue_id: partner.venueId,
        p_sport: input.sport,
        p_name: input.name,
      });
      if (error) throw new Error(error.message);
      await refresh();
      return {
        id: data.id,
        name: data.name,
        sport: data.sport,
        status: data.status,
        opensAt: data.opens_at,
        closesAt: data.closes_at,
        slotDurationMinutes: data.slot_duration_minutes,
        slotsGeneratedUntil: data.slots_generated_until,
      } as Court;
    },
    [partner, refresh],
  );

  const updateCourt = useCallback(
    async (courtId: string, patch: { name: string; sport: string; status: Court["status"] }) => {
      const { error } = await supabase.rpc("partner_update_court", {
        p_court_id: courtId,
        p_name: patch.name,
        p_sport: patch.sport,
        p_status: patch.status,
      });
      if (error) throw new Error(error.message);
      await refresh();
    },
    [refresh],
  );

  const deleteCourt = useCallback(
    async (courtId: string) => {
      const { error } = await supabase.rpc("partner_delete_court", { p_court_id: courtId });
      if (error) throw new Error(error.message);
      await refresh();
    },
    [refresh],
  );

  const runBulkSetup = useCallback(
    async (input: BulkSetupInput) => {
      const { error } = await supabase.rpc("partner_generate_slots", {
        p_court_id: input.courtId,
        p_opens_at: input.opensAt,
        p_closes_at: input.closesAt,
        p_duration_mins: input.slotDurationMinutes,
        p_price_bands: input.priceRules.map((r) => ({
          label: r.label,
          start_time: r.startTime,
          end_time: r.endTime,
          price: r.pricePerSlot,
        })),
        p_generate_days: input.generateDays,
      });
      if (error) throw new Error(error.message);
      await refresh();
    },
    [refresh],
  );

  const addException = useCallback(
    async (input: Omit<DateException, "id">) => {
      if (!partner) throw new Error("Not signed in");
      const { error } = await supabase.rpc("partner_add_venue_exception", {
        p_venue_id: partner.venueId,
        p_date: input.date,
        p_type: input.type,
        p_opens_at: input.opensAt ?? null,
        p_closes_at: input.closesAt ?? null,
        p_reason: input.reason,
      });
      if (error) throw new Error(error.message);
      await refresh();
    },
    [partner, refresh],
  );

  const removeException = useCallback(
    async (id: string) => {
      const { error } = await supabase.rpc("partner_remove_venue_exception", {
        p_exception_id: id,
      });
      if (error) throw new Error(error.message);
      await refresh();
    },
    [refresh],
  );

  const blockSlot = useCallback(async (slotIds: string[], reason: string) => {
    const { error } = await supabase.rpc("partner_block_slots", {
      p_slot_ids: slotIds,
      p_reason: reason,
    });
    if (error) throw new Error(error.message);
  }, []);

  const unblockSlot = useCallback(async (slotIds: string[]) => {
    const { error } = await supabase.rpc("partner_unblock_slots", { p_slot_ids: slotIds });
    if (error) throw new Error(error.message);
  }, []);

  const value = useMemo<InventoryContextValue>(
    () => ({
      courts,
      priceRules,
      exceptions,
      loading,
      priceRulesForCourt,
      addCourt,
      updateCourt,
      deleteCourt,
      runBulkSetup,
      addException,
      removeException,
      blockSlot,
      unblockSlot,
      refresh,
    }),
    [
      courts,
      priceRules,
      exceptions,
      loading,
      priceRulesForCourt,
      addCourt,
      updateCourt,
      deleteCourt,
      runBulkSetup,
      addException,
      removeException,
      blockSlot,
      unblockSlot,
      refresh,
    ],
  );

  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>;
}

export function useInventory() {
  const ctx = useContext(InventoryContext);
  if (!ctx) throw new Error("useInventory must be used inside <InventoryProvider>");
  return ctx;
}