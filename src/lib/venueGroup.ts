/**
 * JustPlay Partner — venue community group (optional, admin-gated).
 *
 * One announcement group per venue. Whether the owner may use it at all is
 * decided by JustPlay admin (`venue_group_access.enabled`, read-only here);
 * everything the owner does with it goes through the `partner_*_venue_group*`
 * RPCs — these tables have no client write policies on purpose.
 *
 * Messages are "from the venue": consumers get a read-only feed, so there's
 * no per-sender state to track.
 */
import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { useAuth } from "./auth";

export type VenueGroup = {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: string;
};

export type VenueGroupMessage = {
  id: string;
  body: string;
  createdAt: string;
};

type GroupRow = {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
};

type MessageRow = { id: string; body: string; created_at: string };

const toGroup = (r: GroupRow): VenueGroup => ({
  id: r.id,
  name: r.name,
  description: r.description ?? "",
  isActive: r.is_active,
  createdAt: r.created_at,
});

const toMessage = (r: MessageRow): VenueGroupMessage => ({
  id: r.id,
  body: r.body,
  createdAt: r.created_at,
});

const ERROR_COPY: Record<string, string> = {
  FEATURE_NOT_ENABLED:
    "Community groups aren't enabled for your venue. Contact JustPlay to request access.",
  NOT_ALLOWED: "Only the venue owner can do that.",
  GROUP_EXISTS: "Your venue already has a group.",
  GROUP_NOT_FOUND: "That group no longer exists.",
  GROUP_PAUSED: "The group is paused. Resume it to post updates.",
  NAME_REQUIRED: "Give the group a name (at least 2 characters).",
  MESSAGE_REQUIRED: "Write something to send.",
  MESSAGE_TOO_LONG: "Updates can be up to 1000 characters.",
  AUTH_REQUIRED: "Please sign in again.",
};

function friendly(message: string): Error {
  const code = Object.keys(ERROR_COPY).find((k) => message.includes(k));
  return new Error(code ? ERROR_COPY[code]! : message || "Something went wrong. Try again.");
}

export function useVenueGroup() {
  const { partner } = useAuth();
  const venueId = partner?.venueId ?? null;

  const [loading, setLoading] = useState(true);
  const [accessEnabled, setAccessEnabled] = useState(false);
  const [group, setGroup] = useState<VenueGroup | null>(null);
  const [memberCount, setMemberCount] = useState(0);
  const [messages, setMessages] = useState<VenueGroupMessage[]>([]);

  const fetchMessages = useCallback(async (groupId: string) => {
    const { data, error } = await supabase
      .from("venue_group_messages")
      .select("id, body, created_at")
      .eq("group_id", groupId)
      .order("created_at", { ascending: true })
      .limit(300);
    if (error) {
      console.error("fetch venue group messages failed:", error.message);
      return;
    }
    setMessages(((data ?? []) as MessageRow[]).map(toMessage));
  }, []);

  const fetchMemberCount = useCallback(async (groupId: string) => {
    const { count, error } = await supabase
      .from("venue_group_members")
      .select("id", { count: "exact", head: true })
      .eq("group_id", groupId);
    if (error) {
      console.error("fetch venue group member count failed:", error.message);
      return;
    }
    setMemberCount(count ?? 0);
  }, []);

  const refresh = useCallback(async () => {
    if (!venueId) return;

    const [accessRes, groupRes] = await Promise.all([
      supabase.from("venue_group_access").select("enabled").eq("venue_id", venueId).maybeSingle(),
      supabase
        .from("venue_groups")
        .select("id, name, description, is_active, created_at")
        .eq("venue_id", venueId)
        .maybeSingle(),
    ]);

    if (accessRes.error) console.error("fetch group access failed:", accessRes.error.message);
    if (groupRes.error) console.error("fetch venue group failed:", groupRes.error.message);

    setAccessEnabled(Boolean((accessRes.data as { enabled: boolean } | null)?.enabled));

    const g = groupRes.data ? toGroup(groupRes.data as GroupRow) : null;
    setGroup(g);

    if (g) {
      await Promise.all([fetchMessages(g.id), fetchMemberCount(g.id)]);
    } else {
      setMessages([]);
      setMemberCount(0);
    }
    setLoading(false);
  }, [venueId, fetchMessages, fetchMemberCount]);

  useEffect(() => {
    setLoading(true);
    void refresh();
  }, [refresh]);

  // Live: a message posted from another tab/device shows up here too, and
  // the member count (no realtime on that table) is re-checked periodically.
  const groupId = group?.id ?? null;
  useEffect(() => {
    if (!groupId) return;
    const channel = supabase
      .channel(`venue-group-console-${groupId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "venue_group_messages",
          filter: `group_id=eq.${groupId}`,
        },
        () => {
          void fetchMessages(groupId);
        },
      )
      .subscribe();
    const timer = window.setInterval(() => void fetchMemberCount(groupId), 60_000);
    return () => {
      window.clearInterval(timer);
      void supabase.removeChannel(channel);
    };
  }, [groupId, fetchMessages, fetchMemberCount]);

  const createGroup = useCallback(
    async (input: { name: string; description: string }) => {
      if (!venueId) throw new Error("No venue selected.");
      const { error } = await supabase.rpc("partner_create_venue_group", {
        p_venue_id: venueId,
        p_name: input.name,
        p_description: input.description,
      });
      if (error) throw friendly(error.message);
      await refresh();
    },
    [venueId, refresh],
  );

  const updateGroup = useCallback(
    async (input: { name: string; description: string }) => {
      if (!group) return;
      const { error } = await supabase.rpc("partner_update_venue_group", {
        p_group_id: group.id,
        p_name: input.name,
        p_description: input.description,
      });
      if (error) throw friendly(error.message);
      await refresh();
    },
    [group, refresh],
  );

  const setActive = useCallback(
    async (active: boolean) => {
      if (!group) return;
      const { error } = await supabase.rpc("partner_set_venue_group_active", {
        p_group_id: group.id,
        p_active: active,
      });
      if (error) throw friendly(error.message);
      await refresh();
    },
    [group, refresh],
  );

  const deleteGroup = useCallback(async () => {
    if (!group) return;
    const { error } = await supabase.rpc("partner_delete_venue_group", { p_group_id: group.id });
    if (error) throw friendly(error.message);
    await refresh();
  }, [group, refresh]);

  const sendMessage = useCallback(
    async (body: string) => {
      if (!group) return;
      const { data, error } = await supabase.rpc("partner_send_venue_group_message", {
        p_group_id: group.id,
        p_body: body,
      });
      if (error) throw friendly(error.message);
      const row = data as MessageRow | null;
      if (row) {
        setMessages((prev) =>
          prev.some((m) => m.id === row.id) ? prev : [...prev, toMessage(row)],
        );
      }
    },
    [group],
  );

  const deleteMessage = useCallback(async (messageId: string) => {
    const { error } = await supabase.rpc("partner_delete_venue_group_message", {
      p_message_id: messageId,
    });
    if (error) throw friendly(error.message);
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
  }, []);

  return {
    loading,
    accessEnabled,
    group,
    memberCount,
    messages,
    createGroup,
    updateGroup,
    setActive,
    deleteGroup,
    sendMessage,
    deleteMessage,
    refresh,
  };
}