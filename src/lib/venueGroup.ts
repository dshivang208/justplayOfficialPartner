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
  /** False = announcements only (members can read but not post). Defaults to
   *  false until the two-way chat migration is applied. */
  membersCanPost: boolean;
  createdAt: string;
};

export type VenueGroupMessage = {
  id: string;
  body: string;
  createdAt: string;
  /** "venue" = posted from this console; "member" = a player. */
  kind: "venue" | "member";
  senderName: string;
  type: "text" | "image" | "video" | "file";
  mediaSrc: string | null;
  fileName: string | null;
  fileSize: number | null;
};

type GroupRow = {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  members_can_post?: boolean;
  created_at: string;
};

type MessageRow = {
  id: string;
  body: string;
  created_at: string;
  sender_user_id?: string | null;
  sender_kind?: "venue" | "member";
  /** Absent until 20261023040000_venue_group_media.sql is applied. */
  message_type?: "text" | "image" | "video" | "file";
  media_path?: string | null;
  file_name?: string | null;
  file_size?: number | null;
};

const BUCKET = "venue-group-chat";
const SIGNED_URL_TTL_S = 60 * 60;
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_MEDIA_BYTES = 25 * 1024 * 1024;

const FILE_TYPES = [
  "application/pdf",
  "text/plain",
  "text/csv",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];

export function classifyAttachment(file: File): "image" | "video" | "file" {
  if (["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
    if (file.size > MAX_IMAGE_BYTES) throw new Error("Photos can be up to 10 MB.");
    return "image";
  }
  if (["video/mp4", "video/webm", "video/quicktime"].includes(file.type)) {
    if (file.size > MAX_MEDIA_BYTES) throw new Error("Videos can be up to 25 MB.");
    return "video";
  }
  if (FILE_TYPES.includes(file.type)) {
    if (file.size > MAX_MEDIA_BYTES) throw new Error("Files can be up to 25 MB.");
    return "file";
  }
  throw new Error("Attach a photo, an MP4/WebM/MOV video, or a PDF/Office/text file.");
}

export function formatFileSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function extOf(file: File) {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]{2,5}$/.test(fromName)) return fromName;
  return file.type.split("/")[1] ?? "bin";
}

const toGroup = (r: GroupRow): VenueGroup => ({
  id: r.id,
  name: r.name,
  description: r.description ?? "",
  isActive: r.is_active,
  membersCanPost: r.members_can_post ?? false,
  createdAt: r.created_at,
});

const toMessage = (
  r: MessageRow,
  names: Record<string, string> = {},
  signed: Record<string, string> = {},
): VenueGroupMessage => ({
  id: r.id,
  type: r.message_type ?? "text",
  mediaSrc: r.media_path ? (signed[r.media_path] ?? null) : null,
  fileName: r.file_name ?? null,
  fileSize: r.file_size ?? null,
  body: r.body,
  createdAt: r.created_at,
  kind: r.sender_kind ?? "venue",
  senderName:
    (r.sender_kind ?? "venue") === "venue"
      ? "You"
      : ((r.sender_user_id ? names[r.sender_user_id] : undefined) ?? "Member"),
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
  INVALID_MEDIA_PATH: "That attachment couldn't be sent. Try again.",
  MESSAGE_TOO_LONG: "Messages can be up to 1000 characters.",
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
    let rows: MessageRow[];
    const media = await supabase
      .from("venue_group_messages")
      .select(
        "id, body, created_at, sender_user_id, sender_kind, message_type, media_path, file_name, file_size",
      )
      .eq("group_id", groupId)
      .order("created_at", { ascending: true })
      .limit(300)
      .returns<MessageRow[]>();
    if (!media.error) {
      rows = media.data ?? [];
    } else {
      const full = await supabase
        .from("venue_group_messages")
        .select("id, body, created_at, sender_user_id, sender_kind")
        .eq("group_id", groupId)
        .order("created_at", { ascending: true })
        .limit(300)
        .returns<MessageRow[]>();
      if (!full.error) {
        rows = full.data ?? [];
      } else {
        // Two-way chat migration not applied yet — original columns only.
        const legacy = await supabase
          .from("venue_group_messages")
          .select("id, body, created_at")
          .eq("group_id", groupId)
          .order("created_at", { ascending: true })
          .limit(300);
        if (legacy.error) {
          console.error("fetch venue group messages failed:", legacy.error.message);
          return;
        }
        rows = (legacy.data ?? []) as MessageRow[];
      }
    }

    const signed: Record<string, string> = {};
    const paths = rows.map((r) => r.media_path).filter((x): x is string => Boolean(x));
    if (paths.length > 0) {
      const { data } = await supabase.storage.from(BUCKET).createSignedUrls(paths, SIGNED_URL_TTL_S);
      for (const row of data ?? []) if (row.path && row.signedUrl) signed[row.path] = row.signedUrl;
    }

    const ids = Array.from(
      new Set(rows.map((r) => r.sender_user_id).filter((id): id is string => Boolean(id))),
    );
    const names: Record<string, string> = {};
    if (ids.length > 0) {
      const { data } = await supabase.from("public_profiles").select("id, name").in("id", ids);
      for (const p of data ?? []) names[p.id] = p.name || "Player";
    }
    setMessages(rows.map((r) => toMessage(r, names, signed)));
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

    const [accessRes, groupResFull] = await Promise.all([
      supabase.from("venue_group_access").select("enabled").eq("venue_id", venueId).maybeSingle(),
      supabase
        .from("venue_groups")
        .select("id, name, description, is_active, members_can_post, created_at")
        .eq("venue_id", venueId)
        .maybeSingle(),
    ]);
    // Two-way chat migration not applied yet → that column doesn't exist; retry without it.
    const groupRes = groupResFull.error
      ? await supabase
          .from("venue_groups")
          .select("id, name, description, is_active, created_at")
          .eq("venue_id", venueId)
          .maybeSingle()
      : groupResFull;

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

  const setMembersCanPost = useCallback(
    async (allowed: boolean) => {
      if (!group) return;
      const { error } = await supabase.rpc("partner_set_venue_group_members_can_post", {
        p_group_id: group.id,
        p_allowed: allowed,
      });
      if (error) {
        if (error.code === "PGRST202" || /could not find the function/i.test(error.message)) {
          throw new Error(
            "Two-way chat isn't enabled yet. Apply the latest database update first.",
          );
        }
        throw friendly(error.message);
      }
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

  const sendAttachment = useCallback(
    async (file: File, caption: string) => {
      if (!group) return;
      const type = classifyAttachment(file);
      const path = `${group.id}/${crypto.randomUUID()}.${extOf(file)}`;
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) {
        throw new Error(
          /bucket not found/i.test(upErr.message)
            ? "Attachments aren't enabled yet — run the venue_group_media migration."
            : "Couldn't upload that file. Try again.",
        );
      }
      const { error } = await supabase.rpc("partner_send_venue_group_media", {
        p_group_id: group.id,
        p_type: type,
        p_path: path,
        p_file_name: file.name,
        p_file_size: file.size,
        p_mime_type: file.type,
        p_body: caption,
      });
      if (error) {
        await supabase.storage.from(BUCKET).remove([path]);
        throw friendly(error.message);
      }
      await fetchMessages(group.id);
    },
    [group, fetchMessages],
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
    setMembersCanPost,
    deleteGroup,
    sendMessage,
    sendAttachment,
    deleteMessage,
    refresh,
  };
}
