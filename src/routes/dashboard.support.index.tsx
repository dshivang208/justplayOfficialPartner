import { useCallback, useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Headset, LifeBuoy, Loader2, MessageSquare, Plus } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/partner/Button";
import { TicketStatusBadge } from "@/components/partner/TicketStatusBadge";
import { supabase } from "@/lib/supabaseClient";
import {
  CATEGORY_LABELS,
  createTicket,
  fetchVenueTickets,
  type PartnerTicketCategory,
  type SupportTicket,
} from "@/lib/support";

export const Route = createFileRoute("/dashboard/support/")({
  head: () => ({ meta: [{ title: "Support | JustPlay Partner" }] }),
  component: SupportPage,
});

function timeAgo(iso: string) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function SupportPage() {
  const { partner } = useAuth();
  const navigate = useNavigate();
  const venueId = partner?.venueId ?? null;
  const [tickets, setTickets] = useState<SupportTicket[] | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [category, setCategory] = useState<PartnerTicketCategory>("other");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!venueId) return;
    setTickets(await fetchVenueTickets(venueId));
  }, [venueId]);

  useEffect(() => {
    void load();
    if (!venueId) return;
    const channel = supabase
      .channel(`partner-support-${venueId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "support_tickets", filter: `venue_id=eq.${venueId}` },
        () => void load(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [venueId, load]);

  const submit = async () => {
    if (!venueId) return;
    if (subject.trim().length < 3) return setError("Add a short subject.");
    if (message.trim().length < 10) return setError("Please describe the issue in a bit more detail.");
    setSending(true);
    setError(null);
    try {
      const t = await createTicket({
        venueId,
        subject: subject.trim(),
        category,
        message: message.trim(),
      });
      void navigate({ to: "/dashboard/support/$ticketId", params: { ticketId: t.id } });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't create the ticket.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground sm:text-[28px]">Support</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Stuck with payouts, bookings or the app? Message the JustPlay team — replies appear here.
          </p>
        </div>
        <Button onClick={() => setFormOpen((o) => !o)}>
          <Plus className="h-4 w-4" /> New ticket
        </Button>
      </div>

      {formOpen ? (
        <section className="surface-card mt-6 max-w-2xl rounded-2xl p-5 sm:p-6">
          <h2 className="font-display text-lg font-semibold text-foreground">What do you need help with?</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label htmlFor="s-cat" className="text-xs font-semibold text-muted-foreground">
                Topic
              </label>
              <select
                id="s-cat"
                value={category}
                onChange={(e) => setCategory(e.target.value as PartnerTicketCategory)}
                className="mt-1.5 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm font-semibold outline-none focus:border-primary"
              >
                {(Object.keys(CATEGORY_LABELS) as PartnerTicketCategory[]).map((k) => (
                  <option key={k} value={k}>
                    {CATEGORY_LABELS[k]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="s-subject" className="text-xs font-semibold text-muted-foreground">
                Subject
              </label>
              <input
                id="s-subject"
                value={subject}
                maxLength={120}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Weekly payout not received"
                className="mt-1.5 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm font-semibold outline-none focus:border-primary"
              />
            </div>
            <div>
              <label htmlFor="s-msg" className="text-xs font-semibold text-muted-foreground">
                Tell us what happened
              </label>
              <textarea
                id="s-msg"
                value={message}
                rows={5}
                maxLength={2000}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Include booking IDs, dates or amounts if they help."
                className="mt-1.5 w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
              />
              <p className="mt-1 text-right text-[11px] text-muted-foreground">{message.length}/2000</p>
            </div>
            {error ? <p className="text-xs font-semibold text-destructive">{error}</p> : null}
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setFormOpen(false)} disabled={sending}>
                Cancel
              </Button>
              <Button onClick={() => void submit()} disabled={sending}>
                {sending ? "Sending…" : "Submit ticket"}
              </Button>
            </div>
          </div>
        </section>
      ) : null}

      <h2 className="mt-8 font-display text-lg font-semibold text-foreground">Your venue's tickets</h2>
      <div className="mt-3 max-w-3xl">
        {tickets === null ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="surface-card flex flex-col items-center gap-2 rounded-2xl p-10 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
              <LifeBuoy className="h-5 w-5" />
            </span>
            <p className="text-sm font-semibold text-foreground">No tickets yet</p>
            <p className="text-xs text-muted-foreground">
              Anything you raise here is also visible to your venue's other staff.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {tickets.map((t) => (
              <li key={t.id}>
                <Link
                  to="/dashboard/support/$ticketId"
                  params={{ ticketId: t.id }}
                  className="surface-card flex items-center gap-3 rounded-2xl p-4 transition-colors hover:border-primary/60"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    {t.lastSenderKind === "admin" && t.status !== "resolved" && t.status !== "closed" ? (
                      <Headset className="h-5 w-5" />
                    ) : (
                      <MessageSquare className="h-5 w-5" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{t.subject}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      #{t.ticketNo} · {CATEGORY_LABELS[t.category as PartnerTicketCategory] ?? "Other"} ·{" "}
                      {timeAgo(t.lastMessageAt)}
                    </p>
                  </div>
                  <TicketStatusBadge status={t.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
