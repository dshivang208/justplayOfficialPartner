import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Download,
  FileText,
  Loader2,
  Lock,
  Megaphone,
  Paperclip,
  Pause,
  Pencil,
  Play,
  Send,
  Trash2,
  Users,
  X,
} from "lucide-react";
import {
  classifyAttachment,
  formatFileSize,
  useVenueGroup,
  type VenueGroupMessage,
} from "@/lib/venueGroup";
import { useAuth } from "@/lib/auth";
import { OwnerOnlyGuard } from "@/components/partner/OwnerOnlyGuard";
import { Button } from "@/components/partner/Button";
import { Modal } from "@/components/partner/Modal";
import { TextInput } from "@/components/partner/FormFields";

export const Route = createFileRoute("/dashboard/community")({
  head: () => ({ meta: [{ title: "Community | JustPlay Partner" }] }),
  component: () => (
    <OwnerOnlyGuard>
      <CommunityPage />
    </OwnerOnlyGuard>
  ),
});

const MAX_MESSAGE = 1000;

function CommunityPage() {
  const { partner } = useAuth();
  const vg = useVenueGroup();

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-foreground sm:text-[28px]">
        Community
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Open a group for {partner?.venueName ?? "your venue"} so players can follow it, chat with
        you and each other, and get your updates — offers, closures, tournaments. Entirely optional.
      </p>

      <div className="mt-6">
        {vg.loading ? (
          <div className="flex min-h-[30vh] items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !vg.accessEnabled ? (
          <LockedCard groupName={vg.group?.name ?? null} />
        ) : !vg.group ? (
          <CreateGroupCard onCreate={vg.createGroup} defaultName={partner?.venueName ?? ""} />
        ) : (
          <GroupConsole vg={vg} />
        )}
      </div>
    </div>
  );
}

function LockedCard({ groupName }: { groupName: string | null }) {
  return (
    <div className="surface-card flex flex-col items-center rounded-2xl px-6 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
        <Lock className="h-5 w-5" />
      </span>
      <h2 className="mt-4 font-display text-lg font-semibold text-foreground">
        Community groups aren&apos;t enabled for your venue
      </h2>
      <p className="mt-1.5 max-w-md text-sm text-muted-foreground">
        {groupName
          ? `Your group "${groupName}" is currently hidden from players because JustPlay has switched this facility off for your venue. Nothing has been deleted — it comes back if access is restored.`
          : "This facility is switched on per venue by the JustPlay team. Contact JustPlay support to request access for your venue."}
      </p>
    </div>
  );
}

function CreateGroupCard({
  onCreate,
  defaultName,
}: {
  onCreate: (input: { name: string; description: string }) => Promise<void>;
  defaultName: string;
}) {
  const [name, setName] = useState(defaultName);
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await onCreate({ name: name.trim(), description: description.trim() });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create the group.");
      setBusy(false);
    }
  };

  return (
    <div className="surface-card max-w-xl rounded-2xl p-6">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Megaphone className="h-5 w-5" />
      </span>
      <h2 className="mt-4 font-display text-lg font-semibold text-foreground">
        Create your venue group
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        It appears only on your venue&apos;s page in the JustPlay app. Players join with one tap and
        can chat with you and each other. You can switch it to announcements-only, pause it, or
        delete it any time.
      </p>

      <div className="mt-5 flex flex-col gap-4">
        <TextInput
          label="Group name"
          value={name}
          maxLength={60}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Greenfield Arena Updates"
        />
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-foreground">
            What will you share?{" "}
            <span className="font-normal text-muted-foreground">(optional)</span>
          </span>
          <textarea
            value={description}
            maxLength={300}
            rows={3}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Offers, tournament dates, closures, new courts…"
            className="w-full resize-none rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
          />
        </label>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <div>
          <Button onClick={submit} disabled={busy || name.trim().length < 2}>
            {busy ? "Creating…" : "Create group"}
          </Button>
        </div>
      </div>
    </div>
  );
}

/** JustPlay mark — the permanent DP of every venue group. */
function JustPlayMark({ className = "h-10 w-10 text-xl" }: { className?: string }) {
  return (
    <span
      aria-label="JustPlay"
      className={`gradient-primary flex shrink-0 items-center justify-center rounded-full font-display text-primary-foreground ${className}`}
    >
      J
    </span>
  );
}

function MessageAttachment({ m, mine }: { m: VenueGroupMessage; mine: boolean }) {
  if (m.type === "text") return null;
  if (!m.mediaSrc) return <p className="text-xs italic opacity-70">Attachment unavailable</p>;
  if (m.type === "image") {
    return (
      <a href={m.mediaSrc} target="_blank" rel="noreferrer">
        <img
          src={m.mediaSrc}
          alt={m.fileName ?? "Photo"}
          loading="lazy"
          className="mb-1 max-h-64 w-full rounded-xl object-cover"
        />
      </a>
    );
  }
  if (m.type === "video") {
    return (
      <video
        src={m.mediaSrc}
        controls
        preload="metadata"
        className="mb-1 max-h-64 w-full rounded-xl bg-black"
      />
    );
  }
  return (
    <a
      href={m.mediaSrc}
      target="_blank"
      rel="noreferrer"
      download={m.fileName ?? undefined}
      className={`mb-1 flex items-center gap-3 rounded-xl border p-2.5 ${
        mine ? "border-primary-foreground/30" : "border-border bg-background"
      }`}
    >
      <FileText className="h-8 w-8 shrink-0" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">{m.fileName ?? "File"}</span>
        <span className="block text-[11px] opacity-70">{formatFileSize(m.fileSize)}</span>
      </span>
      <Download className="h-4 w-4 shrink-0" />
    </a>
  );
}

function GroupConsole({ vg }: { vg: ReturnType<typeof useVenueGroup> }) {
  const { group, memberCount, messages } = vg;
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [name, setName] = useState(group?.name ?? "");
  const [description, setDescription] = useState(group?.description ?? "");
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<File | null>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages.length]);

  if (!group) return null;

  const run = async (fn: () => Promise<void>, after?: () => void) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      after?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const send = async () => {
    const text = draft.trim();
    if (!text && !pending) return;
    setSending(true);
    setError(null);
    try {
      if (pending) await vg.sendAttachment(pending, text);
      else await vg.sendMessage(text);
      setDraft("");
      setPending(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't send that update.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
      {/* Group card */}
      <div className="surface-card h-fit rounded-2xl p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <JustPlayMark className="h-10 w-10 text-xl" />
            <h2 className="font-display text-lg font-semibold leading-snug text-foreground">
              {group.name}
            </h2>
          </div>
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
              group.isActive ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
            }`}
          >
            {group.isActive ? "Live" : "Paused"}
          </span>
        </div>
        {group.description ? (
          <p className="mt-2 text-sm text-muted-foreground">{group.description}</p>
        ) : null}

        <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-foreground">
          <Users className="h-4 w-4 text-primary" />
          {memberCount} {memberCount === 1 ? "member" : "members"}
        </div>

        {!group.isActive ? (
          <p className="mt-3 rounded-xl bg-secondary px-3 py-2 text-xs text-muted-foreground">
            Paused — hidden from players on your venue page. Members and past updates are kept.
          </p>
        ) : (
          <p className="mt-3 text-xs text-muted-foreground">
            Visible to players on your venue page in the JustPlay app.
          </p>
        )}

        <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl bg-secondary/60 px-3 py-2.5">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 accent-[var(--color-primary,#15803d)]"
            checked={group.membersCanPost}
            disabled={busy}
            onChange={(e) => run(() => vg.setMembersCanPost(e.target.checked))}
          />
          <span className="text-xs">
            <span className="block text-sm font-semibold text-foreground">
              Members can send messages
            </span>
            <span className="text-muted-foreground">
              {group.membersCanPost
                ? "Two-way chat. Turn off for announcements only."
                : "Announcements only — members can read but not post."}
            </span>
          </span>
        </label>

        <div className="mt-5 flex flex-col gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setName(group.name);
              setDescription(group.description);
              setError(null);
              setEditOpen(true);
            }}
          >
            <Pencil className="h-4 w-4" /> Edit details
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => run(() => vg.setActive(!group.isActive))}
          >
            {group.isActive ? (
              <>
                <Pause className="h-4 w-4" /> Pause group
              </>
            ) : (
              <>
                <Play className="h-4 w-4" /> Resume group
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive"
            onClick={() => {
              setError(null);
              setDeleteOpen(true);
            }}
          >
            <Trash2 className="h-4 w-4" /> Delete group
          </Button>
        </div>
      </div>

      {/* Updates feed + composer */}
      <div className="surface-card flex h-[34rem] flex-col overflow-hidden rounded-2xl">
        <div className="border-b border-border px-4 py-3">
          <h3 className="font-display text-sm font-semibold text-foreground">Group chat</h3>
          <p className="text-xs text-muted-foreground">
            {group.membersCanPost
              ? "Two-way chat — members and you can both post. Hover a message to delete it."
              : "Announcements only — members can read your updates but not reply."}
          </p>
        </div>

        <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <p className="pt-10 text-center text-sm text-muted-foreground">
              No messages yet. Post your first one below — a welcome note works well.
            </p>
          ) : (
            messages.map((m, i) => {
              const mine = m.kind === "venue";
              const showDay =
                i === 0 ||
                new Date(messages[i - 1]!.createdAt).toDateString() !==
                  new Date(m.createdAt).toDateString();
              return (
                <div key={m.id} className="space-y-3">
                  {showDay ? (
                    <div className="flex justify-center">
                      <span className="rounded-full bg-secondary px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {new Date(m.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  ) : null}
                  <div className={`group flex flex-col ${mine ? "items-end" : "items-start"}`}>
                    {!mine ? (
                      <span className="mb-0.5 text-[11px] font-semibold text-muted-foreground">
                        {m.senderName}
                      </span>
                    ) : null}
                    <div
                      className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm ${
                        mine
                          ? "rounded-tr-sm bg-primary text-primary-foreground"
                          : "rounded-tl-sm bg-secondary text-foreground"
                      }`}
                    >
                      <MessageAttachment m={m} mine={mine} />
                      {m.body}
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span>
                        {new Date(m.createdAt).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <button
                        type="button"
                        aria-label="Delete message"
                        className="opacity-0 transition-opacity hover:text-destructive focus:opacity-100 group-hover:opacity-100"
                        onClick={() => run(() => vg.deleteMessage(m.id))}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="border-t border-border p-3">
          {error ? <p className="mb-2 text-xs text-destructive">{error}</p> : null}
          {pending ? (
            <div className="mb-2 flex items-center gap-2 rounded-xl bg-secondary px-3 py-2 text-xs">
              <Paperclip className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate font-semibold">{pending.name}</span>
              <span className="text-muted-foreground">{formatFileSize(pending.size)}</span>
              <button type="button" aria-label="Remove attachment" onClick={() => setPending(null)}>
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : null}
          {group.isActive ? (
            <div className="flex items-end gap-2">
              <input
                ref={fileRef}
                type="file"
                className="hidden"
                accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime,application/pdf,text/plain,text/csv,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (!f) return;
                  try {
                    classifyAttachment(f);
                    setError(null);
                    setPending(f);
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "Can't attach that file.");
                  }
                }}
              />
              <Button
                size="icon"
                variant="outline"
                type="button"
                onClick={() => fileRef.current?.click()}
                aria-label="Attach photo, video or file"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <textarea
                value={draft}
                rows={2}
                maxLength={MAX_MESSAGE}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send();
                  }
                }}
                placeholder={pending ? "Add a caption…" : "Message your members…"}
                className="min-h-[44px] flex-1 resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
              />
              <Button
                size="icon"
                onClick={send}
                disabled={(!draft.trim() && !pending) || sending}
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <p className="text-center text-xs text-muted-foreground">
              Resume the group to post messages.
            </p>
          )}
          {group.isActive ? (
            <p className="mt-1 text-right text-[10px] text-muted-foreground">
              {draft.length}/{MAX_MESSAGE} · Enter to send, Shift+Enter for a new line
            </p>
          ) : null}
        </div>
      </div>

      {/* Edit */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit group details">
        <div className="flex flex-col gap-4">
          <TextInput
            label="Group name"
            value={name}
            maxLength={60}
            onChange={(e) => setName(e.target.value)}
          />
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-foreground">Description</span>
            <textarea
              value={description}
              maxLength={300}
              rows={3}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full resize-none rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary"
            />
          </label>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={busy || name.trim().length < 2}
              onClick={() =>
                run(
                  () => vg.updateGroup({ name: name.trim(), description: description.trim() }),
                  () => setEditOpen(false),
                )
              }
            >
              {busy ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete */}
      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete this group?"
        description="This permanently removes the group, all its members and every update. To just hide it for a while, use Pause instead."
        width="sm"
      >
        {error ? <p className="mb-3 text-sm text-destructive">{error}</p> : null}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setDeleteOpen(false)}>
            Keep group
          </Button>
          <Button
            variant="destructive"
            size="sm"
            disabled={busy}
            onClick={() =>
              run(
                () => vg.deleteGroup(),
                () => setDeleteOpen(false),
              )
            }
          >
            {busy ? "Deleting…" : "Delete forever"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
