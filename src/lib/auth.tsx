/**
 * JustPlay Partner — auth state (Backend Phase A).
 *
 * Real Supabase Auth session + real `public.partners` / `public.partner_venues`
 * rows. OTP delivery itself is still mocked (no SMS provider wired up
 * anywhere in this project yet, consumer app included) — this file reuses
 * the consumer app's `mock-otp-verify` Edge Function unchanged to mint a
 * real session for a phone number, then does partner-specific work on top:
 * looking up (or, via `partner-signup`, creating) this person's
 * `partners` + venue + `partner_venues` link.
 *
 * SWAP POINT FOR REAL SMS: identical to the consumer app — only
 * `mock-otp-verify`'s OTP-validation step changes; this file, the RLS
 * policies, and every downstream screen stay as-is.
 *
 * The exported shape (types, `useAuth()` fields) stays close to the Phase
 * 1-5 mock so the rest of the app keeps working, with one addition:
 * `venueId`, which downstream phases (B/C/D/E) need to scope their real
 * queries to this partner's actual venue.
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
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabaseClient";

export type VenueStatus = "pending" | "active" | "rejected";
export type PartnerRole = "owner" | "staff";

export type Partner = {
  id: string;
  businessName: string;
  ownerName: string;
  phone: string;
  venueId: string;
  venueName: string;
  area: string;
  sports: string[];
  status: VenueStatus;
  role: PartnerRole;
};

export type SignupInput = {
  businessName: string;
  ownerName: string;
  phone: string;
  city: string;
};

type PartnerAuthContextValue = {
  partner: Partner | null;
  isAuthenticated: boolean;
  hydrated: boolean;
  requestOtp: (phone: string) => Promise<void>;
  /** Verifies the OTP and mints a real session. Returns whether this
   *  phone already has a partner account — the Login tab treats `false`
   *  as an error state; the Signup tab treats `true` as "already signed
   *  up, just route them in" and skips calling `signup`. */
  verifyOtp: (phone: string, code: string) => Promise<{ hasPartnerAccount: boolean }>;
  /** Creates the partner + draft venue + owner link for the now-verified
   *  session. Only called from the Signup tab, and only when `verifyOtp`
   *  reported no existing partner account. */
  signup: (input: Omit<SignupInput, "phone">) => Promise<void>;
  /** Re-reads `partners`/`partner_venues` for the current session — used
   *  by the Pending Approval screen's "check again" button, since
   *  approval happens outside this app (see the migration's
   *  `admin_approve_partner`) and there's nothing to subscribe to yet. */
  refreshPartnerContext: () => Promise<void>;
  logout: () => void;
};

const PartnerAuthContext = createContext<PartnerAuthContextValue | null>(null);

type PartnerVenueJoinRow = {
  role: PartnerRole;
  venues: { id: string; name: string; area: string | null; sports_offered: string[] } | null;
};

const APPROVAL_TO_STATUS: Record<string, VenueStatus> = {
  pending: "pending",
  approved: "active",
  rejected: "rejected",
};

async function fetchPartnerContext(userId: string): Promise<Partner | null> {
  const { data: partnerRow, error: partnerError } = await supabase
    .from("partners")
    .select("phone, owner_name, business_name, approval_status")
    .eq("id", userId)
    .maybeSingle();

  if (partnerError) {
    console.error("fetchPartnerContext: partners lookup failed:", partnerError.message);
    return null;
  }
  if (!partnerRow) return null;

  const { data: links, error: linksError } = await supabase
    .from("partner_venues")
    .select("role, venues(id, name, area, sports_offered)")
    .eq("partner_id", userId)
    .returns<PartnerVenueJoinRow[]>();

  if (linksError) {
    console.error("fetchPartnerContext: partner_venues lookup failed:", linksError.message);
    return null;
  }

  const ownerLink = links?.find((l) => l.role === "owner") ?? links?.[0];
  if (!ownerLink?.venues) return null;

  return {
    id: userId,
    businessName: partnerRow.business_name,
    ownerName: partnerRow.owner_name,
    // Stored as full E.164 ("+919876543210", matching public.users.phone's
    // convention) — stripped back to bare digits here since every UI spot
    // in this app displays it as "+91 {partner.phone}".
    phone: partnerRow.phone.replace(/^\+?91/, ""),
    venueId: ownerLink.venues.id,
    venueName: ownerLink.venues.name,
    area: ownerLink.venues.area ?? "",
    sports: ownerLink.venues.sports_offered ?? [],
    status: APPROVAL_TO_STATUS[partnerRow.approval_status] ?? "pending",
    role: ownerLink.role,
  };
}

export function PartnerAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [partner, setPartner] = useState<Partner | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Real session bootstrap: restore on refresh, then stay in sync with any
  // auth state change (login/logout/token refresh, including other tabs).
  useEffect(() => {
    let active = true;

    void (async () => {
      const {
        data: { session: initialSession },
      } = await supabase.auth.getSession();
      if (!active) return;
      if (initialSession) {
        setSession(initialSession);
        const ctx = await fetchPartnerContext(initialSession.user.id);
        if (!active) return;
        setPartner(ctx);
      }
      setHydrated(true);
    })();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (!newSession) {
        setPartner(null);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  /** SWAP POINT (send step): no-op today since there's no SMS provider yet. */
  const requestOtp = useCallback(async (_phone: string) => {
    await new Promise((r) => setTimeout(r, 700));
  }, []);

  /** SWAP POINT (verify step): mock-checks the code via the shared
   *  Edge Function, then mints a REAL session. */
  const verifyOtp = useCallback(async (phone: string, code: string) => {
    if (!/^\d{6}$/.test(code)) throw new Error("Enter the 6-digit code we sent you.");

    const digits = phone.replace(/\D/g, "").slice(-10);
    if (digits.length !== 10) throw new Error("Enter a valid 10-digit Indian mobile number.");

    const { data: fnData, error: fnError } = await supabase.functions.invoke<{ tokenHash: string }>(
      "mock-otp-verify",
      { body: { phone: digits, otp: code } },
    );
    if (fnError) throw new Error(fnError.message || "Verification failed. Try again.");
    if (!fnData) throw new Error("Verification failed. Try again.");

    const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: fnData.tokenHash,
      type: "magiclink",
    });
    if (verifyError || !verifyData.session) {
      throw new Error(verifyError?.message ?? "Could not start session. Try again.");
    }

    setSession(verifyData.session);
    const ctx = await fetchPartnerContext(verifyData.session.user.id);
    setPartner(ctx);

    return { hasPartnerAccount: ctx != null };
  }, []);

  const signup = useCallback(async (input: Omit<SignupInput, "phone">) => {
    const { data, error } = await supabase.functions.invoke<{ partnerId: string }>(
      "partner-signup",
      {
        body: { businessName: input.businessName, ownerName: input.ownerName, city: input.city },
      },
    );
    if (error)
      throw new Error(error.message || "Could not create your partner account. Try again.");
    if (!data) throw new Error("Could not create your partner account. Try again.");

    const ctx = await fetchPartnerContext(data.partnerId);
    setPartner(ctx);
  }, []);

  const refreshPartnerContext = useCallback(async () => {
    if (!session) return;
    const ctx = await fetchPartnerContext(session.user.id);
    setPartner(ctx);
  }, [session]);

  const logout = useCallback(() => {
    // Optimistic clear so protected-route redirects happen instantly, same
    // as the old synchronous mock — the real Supabase session (and its
    // localStorage entry) is revoked right behind it.
    setSession(null);
    setPartner(null);
    void supabase.auth.signOut().catch((e) => console.error("signOut failed:", e));
  }, []);

  const value = useMemo<PartnerAuthContextValue>(
    () => ({
      partner,
      isAuthenticated: Boolean(session),
      hydrated,
      requestOtp,
      verifyOtp,
      signup,
      refreshPartnerContext,
      logout,
    }),
    [partner, session, hydrated, requestOtp, verifyOtp, signup, refreshPartnerContext, logout],
  );

  return <PartnerAuthContext.Provider value={value}>{children}</PartnerAuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(PartnerAuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <PartnerAuthProvider>");
  return ctx;
}