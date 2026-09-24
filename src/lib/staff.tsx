/**
 * JustPlay Partner — staff access (Backend Phase E).
 *
 * Combines two real sources into one list, same shape the UI already
 * expects: `partner_venues` (owner + already-accepted staff, joined to
 * `partners` for name/phone) and `staff_invites` with status='invited'
 * (not yet accepted — no `partners` row may even exist for them yet, so
 * their name/phone live on the invite itself). A StaffMember's `id`
 * encodes which of the two it came from ("member:<partner_id>" vs
 * "invite:<invite_id>") purely so `removeStaff` knows which RPC to call —
 * this never leaks into the UI, which just treats `id` as an opaque key.
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

export type StaffStatus = "active" | "invited";

export type StaffMember = {
  id: string;
  name: string;
  phone: string;
  role: "owner" | "staff";
  status: StaffStatus;
  invitedAt: string;
};

type StaffContextValue = {
  loading: boolean;
  staff: StaffMember[];
  inviteStaff: (input: { name: string; phone: string }) => Promise<void>;
  removeStaff: (id: string) => void;
};

const StaffContext = createContext<StaffContextValue | null>(null);

function stripCountryCode(phone: string): string {
  return phone.replace(/^\+?91/, "");
}

type MemberRow = {
  partner_id: string;
  role: "owner" | "staff";
  created_at: string;
  partners: { owner_name: string; phone: string } | null;
};

type InviteRow = {
  id: string;
  invited_name: string | null;
  invited_phone: string;
  created_at: string;
};

export function StaffProvider({ children }: { children: ReactNode }) {
  const { partner } = useAuth();
  const [loading, setLoading] = useState(false);
  const [staff, setStaff] = useState<StaffMember[]>([]);

  const refresh = useCallback(async () => {
    if (!partner) {
      setStaff([]);
      return;
    }
    setLoading(true);

    const [membersRes, invitesRes] = await Promise.all([
      supabase
        .from("partner_venues")
        .select("partner_id, role, created_at, partners(owner_name, phone)")
        .eq("venue_id", partner.venueId)
        .returns<MemberRow[]>(),
      supabase
        .from("staff_invites")
        .select("id, invited_name, invited_phone, created_at")
        .eq("venue_id", partner.venueId)
        .eq("status", "invited")
        .returns<InviteRow[]>(),
    ]);

    if (membersRes.error) console.error("fetch staff members failed:", membersRes.error.message);
    if (invitesRes.error) console.error("fetch staff invites failed:", invitesRes.error.message);

    const members: StaffMember[] = (membersRes.data ?? []).map((m) => ({
      id: `member:${m.partner_id}`,
      name: m.partners?.owner_name ?? "Team member",
      phone: stripCountryCode(m.partners?.phone ?? ""),
      role: m.role,
      status: "active",
      invitedAt: m.created_at,
    }));

    const invites: StaffMember[] = (invitesRes.data ?? []).map((inv) => ({
      id: `invite:${inv.id}`,
      name: inv.invited_name ?? "Invited",
      phone: stripCountryCode(inv.invited_phone),
      role: "staff",
      status: "invited",
      invitedAt: inv.created_at,
    }));

    // Owner first, then active staff, then still-pending invites.
    const sorted = [...members, ...invites].sort((a, b) => {
      if (a.role !== b.role) return a.role === "owner" ? -1 : 1;
      if (a.status !== b.status) return a.status === "active" ? -1 : 1;
      return a.invitedAt < b.invitedAt ? -1 : 1;
    });

    setStaff(sorted);
    setLoading(false);
  }, [partner]);

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partner?.venueId]);

  const inviteStaff = useCallback(
    async (input: { name: string; phone: string }) => {
      if (!partner) throw new Error("Not signed in.");
      const { error } = await supabase.rpc("partner_invite_staff", {
        p_venue_id: partner.venueId,
        p_name: input.name,
        p_phone: input.phone,
      });
      if (error) {
        const friendly: Record<string, string> = {
          ALREADY_HAS_ACCESS: "This phone number already has access to your venue.",
          INVITE_ALREADY_PENDING: "There's already a pending invite for this phone number.",
          PHONE_MUST_BE_10_DIGITS: "Enter a valid 10-digit phone number.",
        };
        throw new Error(friendly[error.message] ?? error.message ?? "Could not send the invite.");
      }
      await refresh();
    },
    [partner, refresh],
  );

  const removeStaff = useCallback(
    (id: string) => {
      if (!partner) return;
      const previous = staff;
      setStaff((prev) => prev.filter((s) => s.id !== id));

      const [kind, key] = id.split(":", 2) as [string, string];
      const rpc =
        kind === "invite"
          ? supabase.rpc("partner_revoke_staff_invite", { p_invite_id: key })
          : supabase.rpc("partner_remove_staff_member", {
              p_venue_id: partner.venueId,
              p_staff_partner_id: key,
            });

      void rpc.then(({ error }) => {
        if (error) {
          console.error("removeStaff failed:", error.message);
          setStaff(previous);
        }
      });
    },
    [partner, staff],
  );

  const value = useMemo<StaffContextValue>(
    () => ({ loading, staff, inviteStaff, removeStaff }),
    [loading, staff, inviteStaff, removeStaff],
  );

  return <StaffContext.Provider value={value}>{children}</StaffContext.Provider>;
}

export function useStaff() {
  const ctx = useContext(StaffContext);
  if (!ctx) throw new Error("useStaff must be used inside <StaffProvider>");
  return ctx;
}