import { useCallback, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, Star } from "lucide-react";
import { useNotice } from "@/lib/useNotice";
import { OwnerOnlyGuard } from "@/components/partner/OwnerOnlyGuard";
import { Button } from "@/components/partner/Button";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabaseClient";

export const Route = createFileRoute("/dashboard/reviews")({
  head: () => ({ meta: [{ title: "Reviews | JustPlay Partner" }] }),
  component: () => (
    <OwnerOnlyGuard>
      <ReviewsPage />
    </OwnerOnlyGuard>
  ),
});

type Review = {
  id: string;
  author_name: string;
  rating: number;
  body: string | null;
  created_at: string;
  partner_reply: string | null;
};

function Stars({ n }: { n: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${n} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={"h-4 w-4 " + (i <= n ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40")} />
      ))}
    </span>
  );
}

function ReviewCard({ r, onSaved, ok, err }: { r: Review; onSaved: () => void; ok: (t: string) => void; err: (t: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(r.partner_reply ?? "");
  const [busy, setBusy] = useState(false);

  const save = async (value: string) => {
    setBusy(true);
    const { error } = await supabase.rpc("partner_reply_review", { p_review_id: r.id, p_reply: value });
    setBusy(false);
    if (error) {
      err(error.message === "REPLY_TOO_LONG" ? "Reply is too long (600 characters max)." : "Couldn't save your reply.");
      return;
    }
    ok(value.trim() ? "Reply posted" : "Reply removed");
    setEditing(false);
    onSaved();
  };

  return (
    <li className="surface-card rounded-2xl p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-2">
        <Stars n={r.rating} />
        <span className="text-sm font-semibold text-foreground">{r.author_name}</span>
        <span className="ml-auto text-xs text-muted-foreground">
          {new Date(r.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
        </span>
      </div>
      <p className="mt-2 whitespace-pre-wrap break-words text-sm text-foreground">
        {r.body || <em className="text-muted-foreground">No written review</em>}
      </p>

      {editing ? (
        <div className="mt-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={600}
            rows={3}
            placeholder="Write a public reply — thank them or address their concern politely."
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <div className="mt-2 flex items-center gap-2">
            <Button size="sm" disabled={busy || !text.trim()} onClick={() => void save(text)}>
              {busy ? "Saving…" : "Post reply"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => { setEditing(false); setText(r.partner_reply ?? ""); }}>
              Cancel
            </Button>
            <span className="ml-auto text-xs text-muted-foreground">{text.length}/600</span>
          </div>
        </div>
      ) : r.partner_reply ? (
        <div className="mt-3 rounded-xl bg-secondary p-3">
          <p className="text-xs font-semibold text-foreground">Your reply</p>
          <p className="mt-0.5 whitespace-pre-wrap text-sm text-muted-foreground">{r.partner_reply}</p>
          <div className="mt-2 flex gap-3 text-xs font-semibold">
            <button type="button" onClick={() => setEditing(true)} className="text-primary hover:underline">Edit</button>
            <button type="button" disabled={busy} onClick={() => void save("")} className="text-muted-foreground hover:text-destructive">Remove</button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setEditing(true)} className="mt-3 text-xs font-semibold text-primary hover:underline">
          Reply
        </button>
      )}
    </li>
  );
}

function ReviewsPage() {
  const { partner } = useAuth();
  const { notice, ok, err } = useNotice();
  const [rows, setRows] = useState<Review[] | null>(null);
  const [filter, setFilter] = useState<"all" | "unanswered" | "low">("all");

  const load = useCallback(async () => {
    if (!partner) return;
    const { data, error } = await supabase
      .from("reviews")
      .select("id,author_name,rating,body,created_at,partner_reply")
      .eq("venue_id", partner.venueId)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) {
      err("Couldn't load reviews.");
      setRows([]);
      return;
    }
    setRows((data ?? []) as Review[]);
  }, [partner, err]);
  useEffect(() => void load(), [load]);

  const all = rows ?? [];
  const avg = all.length ? all.reduce((s, r) => s + r.rating, 0) / all.length : null;
  const dist = [5, 4, 3, 2, 1].map((n) => ({ n, c: all.filter((r) => r.rating === n).length }));
  const visible = all.filter((r) =>
    filter === "unanswered" ? !r.partner_reply : filter === "low" ? r.rating <= 2 : true,
  );

  return (
    <div>
      {notice}
      <h1 className="font-display text-2xl font-semibold text-foreground sm:text-[28px]">Reviews</h1>
      <p className="mt-1 text-sm text-muted-foreground">What players say about {partner?.venueName}. Replies are public.</p>

      {rows === null ? (
        <div className="mt-10 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : all.length === 0 ? (
        <div className="surface-card mt-6 rounded-2xl p-10 text-center text-sm text-muted-foreground">
          No reviews yet. Players can review after a completed booking.
        </div>
      ) : (
        <>
          <div className="surface-card mt-6 grid gap-5 rounded-2xl p-5 sm:grid-cols-[auto_1fr] sm:items-center">
            <div className="text-center sm:pr-6">
              <p className="font-display text-5xl text-foreground">{avg?.toFixed(1)}</p>
              <Stars n={Math.round(avg ?? 0)} />
              <p className="mt-1 text-xs text-muted-foreground">{all.length} review{all.length === 1 ? "" : "s"}</p>
            </div>
            <div className="space-y-1.5">
              {dist.map((d) => (
                <div key={d.n} className="flex items-center gap-2 text-xs">
                  <span className="w-6 text-muted-foreground">{d.n}★</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-amber-400" style={{ width: `${(d.c / all.length) * 100}%` }} />
                  </div>
                  <span className="w-6 text-right text-muted-foreground">{d.c}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-1.5">
            {([["all", "All"], ["unanswered", "Needs reply"], ["low", "Low rated"]] as const).map(([id, label]) => (
              <button key={id} type="button" onClick={() => setFilter(id)}
                className={"rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors " +
                  (filter === id ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground")}>
                {label}
              </button>
            ))}
          </div>
          <ul className="mt-4 space-y-3">
            {visible.map((r) => <ReviewCard key={r.id} r={r} ok={ok} err={err} onSaved={() => void load()} />)}
            {visible.length === 0 ? <li className="py-8 text-center text-sm text-muted-foreground">Nothing here.</li> : null}
          </ul>
        </>
      )}
    </div>
  );
}
