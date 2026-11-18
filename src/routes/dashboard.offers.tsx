import { useCallback, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, Tag } from "lucide-react";
import { useNotice } from "@/lib/useNotice";
import { OwnerOnlyGuard } from "@/components/partner/OwnerOnlyGuard";
import { Button } from "@/components/partner/Button";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabaseClient";

export const Route = createFileRoute("/dashboard/offers")({
  head: () => ({ meta: [{ title: "Offers | JustPlay Partner" }] }),
  component: () => (
    <OwnerOnlyGuard>
      <OffersPage />
    </OwnerOnlyGuard>
  ),
});

type Offer = {
  id: string;
  code: string;
  discount_type: "flat" | "percentage";
  value: number;
  usage_limit: number;
  times_used: number;
  expiry_date: string;
};

const ERRORS: Record<string, string> = {
  INVALID_CODE: "Code must be 4–16 letters or numbers.",
  INVALID_VALUE: "Enter a valid discount (percentage can be at most 90%).",
  INVALID_LIMIT: "Usage limit must be between 1 and 10,000.",
  INVALID_EXPIRY: "Expiry date can't be in the past.",
  CODE_TAKEN: "That code is already taken — try another.",
  NOT_ALLOWED: "You can't do that.",
};

const today = () => new Date().toISOString().slice(0, 10);
const isActive = (o: Offer) => o.expiry_date >= today() && o.times_used < o.usage_limit;

function OffersPage() {
  const { partner } = useAuth();
  const { notice, ok, err } = useNotice();
  const [offers, setOffers] = useState<Offer[] | null>(null);
  const [code, setCode] = useState("");
  const [type, setType] = useState<"percentage" | "flat">("percentage");
  const [value, setValue] = useState("10");
  const [limit, setLimit] = useState("50");
  const [expiry, setExpiry] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!partner) return;
    const { data, error } = await supabase
      .from("coupons")
      .select("id,code,discount_type,value,usage_limit,times_used,expiry_date")
      .eq("created_by_partner", partner.id)
      .order("expiry_date", { ascending: false });
    if (error) {
      err("Couldn't load offers.");
      setOffers([]);
      return;
    }
    setOffers((data ?? []) as Offer[]);
  }, [partner, err]);
  useEffect(() => void load(), [load]);

  const create = async () => {
    if (!partner) return;
    setBusy(true);
    const { error } = await supabase.rpc("partner_create_offer", {
      p_code: code,
      p_discount_type: type,
      p_value: Number(value),
      p_usage_limit: Number(limit),
      p_expiry_date: expiry,
      p_venue_id: partner.venueId,
    });
    setBusy(false);
    if (error) {
      err(ERRORS[error.message] ?? "Couldn't create the offer.");
      return;
    }
    ok(`Offer ${code.toUpperCase()} is live`);
    setCode("");
    await load();
  };

  const end = async (o: Offer) => {
    if (!window.confirm(`End offer ${o.code}? Players won't be able to use it any more.`)) return;
    const { error } = await supabase.rpc("partner_end_offer", { p_id: o.id });
    if (error) err("Couldn't end the offer.");
    else {
      ok("Offer ended");
      await load();
    }
  };

  const field = "mt-1 h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary";
  const formOk = /^[A-Za-z0-9]{4,16}$/.test(code) && Number(value) > 0 && Number(limit) > 0 && expiry >= today() && expiry !== "";

  return (
    <div>
      {notice}
      <h1 className="font-display text-2xl font-semibold text-foreground sm:text-[28px]">Offers</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Create discount codes players can use at checkout for {partner?.venueName}. The discount comes out of your payout.
      </p>

      <div className="surface-card mt-6 rounded-2xl p-5">
        <h2 className="text-lg font-semibold">New offer</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <label className="text-xs font-semibold text-muted-foreground lg:col-span-1">
            Code
            <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={16} placeholder="WEEKEND20" className={field + " uppercase"} />
          </label>
          <label className="text-xs font-semibold text-muted-foreground">
            Type
            <select value={type} onChange={(e) => setType(e.target.value as "flat" | "percentage")} className={field}>
              <option value="percentage">Percentage (%)</option>
              <option value="flat">Flat amount (₹)</option>
            </select>
          </label>
          <label className="text-xs font-semibold text-muted-foreground">
            {type === "percentage" ? "Discount %" : "Discount ₹"}
            <input type="number" min={1} max={type === "percentage" ? 90 : undefined} value={value} onChange={(e) => setValue(e.target.value)} className={field} />
          </label>
          <label className="text-xs font-semibold text-muted-foreground">
            Max uses
            <input type="number" min={1} max={10000} value={limit} onChange={(e) => setLimit(e.target.value)} className={field} />
          </label>
          <label className="text-xs font-semibold text-muted-foreground">
            Valid until
            <input type="date" min={today()} value={expiry} onChange={(e) => setExpiry(e.target.value)} className={field} />
          </label>
        </div>
        <Button className="mt-4" disabled={busy || !formOk} onClick={() => void create()}>
          {busy ? "Creating…" : "Create offer"}
        </Button>
      </div>

      <h2 className="mt-8 text-lg font-semibold">Your offers</h2>
      {offers === null ? (
        <div className="mt-6 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : offers.length === 0 ? (
        <div className="surface-card mt-3 flex flex-col items-center gap-2 rounded-2xl p-10 text-center text-sm text-muted-foreground">
          <Tag className="h-5 w-5" /> No offers yet.
        </div>
      ) : (
        <ul className="mt-3 space-y-3">
          {offers.map((o) => (
            <li key={o.id} className="surface-card flex flex-wrap items-center gap-3 rounded-2xl p-4">
              <span className="rounded-lg bg-primary/10 px-3 py-1.5 font-mono text-sm font-bold text-primary">{o.code}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">
                  {o.discount_type === "percentage" ? `${o.value}% off` : `₹${o.value} off`}
                </p>
                <p className="text-xs text-muted-foreground">
                  Used {o.times_used}/{o.usage_limit} · valid until {new Date(o.expiry_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
              {isActive(o) ? (
                <>
                  <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">Active</span>
                  <Button size="sm" variant="outline" onClick={() => void end(o)}>End</Button>
                </>
              ) : (
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
                  {o.times_used >= o.usage_limit ? "Used up" : "Ended"}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
