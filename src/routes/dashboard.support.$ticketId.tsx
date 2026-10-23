import { useCallback, useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, Loader2, Send } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/partner/Button";
import { TicketStatusBadge } from "@/components/partner/TicketStatusBadge";
import { supabase } from "@/lib/supabaseClient";
import {
  CATEGORY_LABELS,
  fetchTicket,
  resolveTicket,
  sendTicketMessage,
  type PartnerTicketCategory,
  type SupportMessage,
  type SupportTicket,
} from "@/lib/support";

export const Route = createFileRoute("/dashboard/support/$ticketId")({
  head: () => ({ meta: [{ title: "Support ticket | JustPlay Partner" }] }),
  component: TicketPage,
});

function dayLabel(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function TicketPage() {
  const { ticketId } = Route.useParams();
  const { partner } = useAuth();
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "missing">("loading");
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const res = await fetchTicket(ticketId);
    if (!res) {
      setState("missing");
      return;
    }
    setTicket(res.ticket);
    setMessages(res.messages);
    setState("ready");
  }, [ticketId]);

  useEffect(() => {
    void load();
    const channel = supabase
      .channel(`partner-ticket-${ticketId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "support_ticket_messages", filter: `ticket_id=eq.${ticketId}` },
        () => void load(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [ticketId, load]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages.length]);

  const back = (
    <Link to="/dashboard/support" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
      <ArrowLeft className="h-4 w-4" /> All tickets
    </Link>
  );

  if (state === "loading") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (state === "missing" || !ticket) {
    return (
      <div>
        {back}
        <h1 className="mt-4 font-display text-2xl font-semibold text-foreground">Ticket not found</h1>
      </div>
    );
  }

  const closed = ticket.status === "closed";
  const resolved = ticket.status === "resolved";

  const send = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    setError(null);
    try {
      await sendTicketMessage(ticket.id, text);
      setDraft("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't send that message.");
    } finally {
      setSending(false);
    }
  };

  const markSolved = async () => {
    setError(null);
    try {
      await resolveTicket(ticket.id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't update the ticket.");
    }
  };

  return (
    <div className="max-w-3xl">
      {back}
      <div className="mt-3 flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-xl font-semibold text-foreground sm:text-2xl">{ticket.subject}</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            #{ticket.ticketNo} · {CATEGORY_LABELS[ticket.category as PartnerTicketCategory] ?? "Other"} · opened{" "}
            {dayLabel(ticket.createdAt)}
          </p>
        </div>
        <TicketStatusBadge status={ticket.status} />
      </div>

      <div className="surface-card mt-5 flex h-[32rem] flex-col overflow-hidden rounded-2xl">
        <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto p-4">
          {messages.map((m, i) => {
            const fromTeam = m.senderKind === "admin";
            const mine = !fromTeam && m.senderUserId === partner?.id;
            const showDay = i === 0 || dayLabel(messages[i - 1]!.createdAt) !== dayLabel(m.createdAt);
            return (
              <div key={m.id} className="space-y-3">
                {showDay ? (
                  <div className="flex justify-center">
                    <span className="rounded-full bg-secondary px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {dayLabel(m.createdAt)}
                    </span>
                  </div>
                ) : null}
                <div className={`flex flex-col ${fromTeam ? "items-start" : "items-end"}`}>
                  <span className="mb-0.5 text-[11px] font-semibold text-muted-foreground">
                    {fromTeam ? "JustPlay Support" : mine ? "You" : "Your teammate"}
                  </span>
                  <div
                    className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm ${
                      fromTeam
                        ? "rounded-tl-sm border border-primary/30 bg-primary/5 text-foreground"
                        : "rounded-tr-sm bg-primary text-primary-foreground"
                    }`}
                  >
                    {m.body}
                  </div>
                  <span className="mt-0.5 text-[10px] text-muted-foreground">
                    {new Date(m.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {closed ? (
          <p className="border-t border-border px-4 py-3 text-center text-xs text-muted-foreground">
            This ticket is closed.{" "}
            <Link to="/dashboard/support" className="font-semibold text-primary hover:underline">
              Open a new one
            </Link>{" "}
            if you still need help.
          </p>
        ) : (
          <div className="border-t border-border p-3">
            {resolved ? (
              <p className="mb-2 text-xs text-muted-foreground">Marked as resolved. Reply below to reopen it.</p>
            ) : null}
            {error ? <p className="mb-2 text-xs text-destructive">{error}</p> : null}
            <div className="flex items-end gap-2">
              <textarea
                value={draft}
                rows={2}
                maxLength={2000}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send();
                  }
                }}
                placeholder="Write a reply…"
                className="min-h-[44px] flex-1 resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
              />
              <Button size="icon" onClick={() => void send()} disabled={!draft.trim() || sending} aria-label="Send reply">
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        )}
      </div>

      {!closed && !resolved ? (
        <div className="mt-3 flex justify-end">
          <Button variant="outline" size="sm" onClick={() => void markSolved()}>
            <CheckCircle2 className="h-4 w-4" /> Mark as solved
          </Button>
        </div>
      ) : null}
    </div>
  );
}
