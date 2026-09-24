// JustPlay Partner — Backend Phase D: cashfree-run-payout
//
// Three ways to call this:
//   1. A signed-in venue owner, with { venue_id } in the body — a manual
//      "Run payout now" action.
//   2. A signed-in admin (Admin Backend Phase D — Payout Oversight),
//      with { venue_id } or { retry_payout_id } in the body. Same
//      function, not a duplicate — see the brief's own "manual
//      trigger/retry actions call the same Cashfree Edge Function built
//      in the partner backend, not a duplicate".
//   3. A cron/service context, with header `x-cron-secret: <CRON_SECRET>`
//      and no body — processes every venue with a verified payout account
//      and a positive pending amount.
//
// Either way the actual math (what bookings, what amount) comes from
// `partner_pending_payout_line_items`, the same auditable server-side
// calculation the Payouts Overview page reads — never recomputed
// differently here. The Cashfree transfer call happens BEFORE any DB
// write, so a failed/misconfigured Cashfree call never leaves a payout
// row with nothing behind it.
//
// RETRY is a genuinely different case from a normal run, not just the
// same function called again: a FAILED payout's bookings already have
// payout_line_items rows (inserted regardless of transfer success), so
// they're no longer "pending" — partner_pending_payout_line_items would
// never surface them again, and a normal run would just compute a
// different, new batch. Retrying means re-attempting the SAME transfer
// (same amount, same beneficiary, a fresh Cashfree transfer_id) and
// updating that SAME payout row in place — never inserting a second
// payout for line items that already belong to the first one.
//
// CONCURRENCY: an Edge Function invocation is stateless across separate
// RPC calls — there's no single DB transaction spanning "compute pending
// amount" -> "call Cashfree" -> "record the payout", so two overlapping
// calls for the same venue (a double-click on "Run payout now", or a
// manual run overlapping the weekly cron) could otherwise both compute the
// same pending bookings and both pay the venue twice. `begin_payout_run` /
// `end_payout_run` (Phase D migration) are a plain lock row keyed on
// venue_id: whichever call's INSERT/UPDATE actually lands first holds the
// lock, the other bails out immediately, before ever touching Cashfree.

import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, errorResponse, json } from "../_shared/http.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CASHFREE_CLIENT_ID = Deno.env.get("CASHFREE_CLIENT_ID");
const CASHFREE_CLIENT_SECRET = Deno.env.get("CASHFREE_CLIENT_SECRET");
const CASHFREE_ENV = Deno.env.get("CASHFREE_ENV") ?? "sandbox";
const CASHFREE_API_VERSION = "2024-01-01";
const CRON_SECRET = Deno.env.get("CRON_SECRET");

const CASHFREE_BASE_URL =
  CASHFREE_ENV === "production" ? "https://api.cashfree.com/payout" : "https://sandbox.cashfree.com/payout";

type LineItem = { booking_id: string; customer_name: string; gross_amount: number; net_amount: number };
type Deduction = { id: string; amount: number };

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function callCashfreeTransfer(transferId: string, amount: number, beneficiaryId: string) {
  const res = await fetch(`${CASHFREE_BASE_URL}/transfers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-version": CASHFREE_API_VERSION,
      "x-client-id": CASHFREE_CLIENT_ID!,
      "x-client-secret": CASHFREE_CLIENT_SECRET!,
    },
    body: JSON.stringify({
      transfer_id: transferId,
      transfer_amount: amount,
      beneficiary_details: { beneficiary_id: beneficiaryId },
    }),
  });
  const body = await res.json().catch(() => null);
  return { ok: res.ok, body };
}

async function processVenue(adminClient: SupabaseClient, venueId: string) {
  const { data: acquired, error: lockError } = await adminClient.rpc("begin_payout_run", {
    p_venue_id: venueId,
  });
  if (lockError) return { venueId, error: lockError.message };
  if (!acquired) return { venueId, skipped: "A payout run is already in progress for this venue" };

  try {
    return await runPayoutForVenue(adminClient, venueId);
  } finally {
    // Always release, even if runPayoutForVenue throws or returns an error
    // result — a held lock from a swallowed exception would wedge this
    // venue's payouts until the 10-minute staleness override kicks in.
    const { error: unlockError } = await adminClient.rpc("end_payout_run", { p_venue_id: venueId });
    if (unlockError) console.error(`end_payout_run failed for venue ${venueId}:`, unlockError.message);
  }
}

async function runPayoutForVenue(adminClient: SupabaseClient, venueId: string) {
  const { data: account } = await adminClient
    .from("payout_accounts")
    .select("method, verification_status, cashfree_beneficiary_id")
    .eq("venue_id", venueId)
    .maybeSingle();

  if (!account || account.verification_status !== "verified" || !account.cashfree_beneficiary_id) {
    return { venueId, skipped: "No verified payout account" };
  }

  const { data: lineItems, error: lineItemsError } = await adminClient.rpc("partner_pending_payout_line_items", {
    p_venue_id: venueId,
  });
  if (lineItemsError) return { venueId, error: lineItemsError.message };

  const { data: deductions, error: deductionsError } = await adminClient
    .from("payout_deductions")
    .select("id, amount")
    .eq("venue_id", venueId)
    .is("applied_to_payout_id", null);
  if (deductionsError) return { venueId, error: deductionsError.message };

  const items = (lineItems ?? []) as LineItem[];
  const pendingDeductions = (deductions ?? []) as Deduction[];

  // Net amount already owed to the venue for each booking (commission
  // already taken out — see venue_payout_net_amount). "gross" naming is
  // reserved for the pre-commission figure the line items also carry.
  const earningsTotal = items.reduce((sum, li) => sum + li.net_amount, 0);
  const deductionTotal = pendingDeductions.reduce((sum, d) => sum + d.amount, 0);
  const netTotal = earningsTotal - deductionTotal;

  if (items.length === 0 && pendingDeductions.length === 0) {
    return { venueId, skipped: "Nothing pending" };
  }
  if (netTotal <= 0) {
    // Deductions meet or exceed this cycle's earnings — nothing transfers,
    // and nothing is marked applied (no payout row exists to stamp them
    // onto). They roll forward and get reconsidered next cycle, when
    // hopefully enough new earnings have accrued to cover them.
    return { venueId, skipped: "Deductions offset all pending earnings this cycle", netTotal };
  }

  if (!CASHFREE_CLIENT_ID || !CASHFREE_CLIENT_SECRET) {
    return { venueId, error: "Cashfree is not configured (missing CASHFREE_CLIENT_ID/CASHFREE_CLIENT_SECRET)" };
  }

  const transferId = `payout_${venueId.replace(/-/g, "").slice(0, 16)}_${Date.now()}`;
  const cf = await callCashfreeTransfer(transferId, netTotal, account.cashfree_beneficiary_id);

  if (!cf.ok) {
    console.error(`Cashfree transfer failed for venue ${venueId}:`, cf.body);
    return { venueId, error: cf.body?.message ?? "Cashfree transfer request failed" };
  }

  // Cashfree accepted the request — record it as processing; the webhook
  // (cashfree-webhook) flips it to completed/failed once Cashfree actually
  // settles the transfer.
  const { data: payout, error: recordError } = await adminClient.rpc("record_payout_batch", {
    p_venue_id: venueId,
    p_amount: netTotal,
    p_method: account.method,
    p_cashfree_transfer_id: transferId,
    p_status: "processing",
    p_booking_ids: items.map((li) => li.booking_id),
    p_net_amounts: items.map((li) => li.net_amount),
    p_deduction_ids: pendingDeductions.map((d) => d.id),
  });

  if (recordError) {
    // The money has already moved at this point — this is a "reconcile
    // manually" situation, not a silent failure, so it's logged loudly.
    console.error(`Transfer ${transferId} succeeded at Cashfree but recording it failed:`, recordError.message);
    return { venueId, error: `Transfer sent but recording failed: ${recordError.message}`, transferId };
  }

  return { venueId, payoutId: payout.id, amount: netTotal, transferId, deductionsApplied: pendingDeductions.length };
}

/** Re-attempts the SAME transfer for an already-recorded FAILED payout —
 *  same line items, same net amount, a fresh Cashfree transfer_id — and
 *  updates that SAME payout row rather than creating a new one (its
 *  payout_line_items already exist and must not be duplicated). */
async function retryFailedPayout(adminClient: SupabaseClient, payoutId: string) {
  const { data: payout, error: payoutError } = await adminClient
    .from("payouts")
    .select("id, venue_id, amount, status")
    .eq("id", payoutId)
    .maybeSingle();
  if (payoutError) return { payoutId, error: payoutError.message };
  if (!payout) return { payoutId, error: "Payout not found" };
  if (payout.status !== "failed") return { payoutId, error: "Only a failed payout can be retried" };

  const { data: account } = await adminClient
    .from("payout_accounts")
    .select("verification_status, cashfree_beneficiary_id")
    .eq("venue_id", payout.venue_id)
    .maybeSingle();
  if (!account || account.verification_status !== "verified" || !account.cashfree_beneficiary_id) {
    return { payoutId, error: "This venue's payout account is no longer verified — can't retry automatically" };
  }
  if (!CASHFREE_CLIENT_ID || !CASHFREE_CLIENT_SECRET) {
    return { payoutId, error: "Cashfree is not configured" };
  }

  const transferId = `retry_${payoutId.replace(/-/g, "").slice(0, 16)}_${Date.now()}`;
  const cf = await callCashfreeTransfer(transferId, payout.amount, account.cashfree_beneficiary_id);

  if (!cf.ok) {
    console.error(`Cashfree retry failed for payout ${payoutId}:`, cf.body);
    return { payoutId, error: cf.body?.message ?? "Cashfree transfer request failed" };
  }

  const { data: updated, error: updateError } = await adminClient
    .from("payouts")
    .update({ status: "processing", cashfree_transfer_id: transferId })
    .eq("id", payoutId)
    .select()
    .maybeSingle();

  if (updateError) {
    console.error(`Retry ${transferId} succeeded at Cashfree but recording it failed:`, updateError.message);
    return { payoutId, error: `Transfer sent but recording failed: ${updateError.message}`, transferId };
  }

  return { payoutId: updated.id, amount: payout.amount, transferId, retried: true };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return errorResponse("Method not allowed", 405);

  const cronSecret = req.headers.get("x-cron-secret");
  const authHeader = req.headers.get("Authorization");

  if (cronSecret && CRON_SECRET && timingSafeEqual(cronSecret, CRON_SECRET)) {
    // Batch mode — every venue with a verified payout account.
    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const { data: venues, error } = await adminClient
      .from("payout_accounts")
      .select("venue_id")
      .eq("verification_status", "verified");

    if (error) return errorResponse(error.message, 500);

    const results = [];
    for (const v of venues ?? []) {
      results.push(await processVenue(adminClient, v.venue_id));
    }
    return json({ mode: "batch", results });
  }

  if (!authHeader) return errorResponse("Missing Authorization header", 401);

  let body: { venue_id?: string; retry_payout_id?: string };
  try {
    body = await req.json();
  } catch {
    return errorResponse("Invalid JSON body", 400);
  }

  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  // Either the venue's own owner, or a real admin (Admin Backend Phase D
  // — Payout Oversight) — verified server-side against admin_users,
  // never trusted just because the caller says so.
  async function callerCanActOnVenue(venueId: string): Promise<boolean> {
    const { data: roleCheck } = await userClient.rpc("partner_role_for_venue", { p_venue_id: venueId });
    if (roleCheck === "owner") return true;

    const { data: authUser } = await userClient.auth.getUser();
    const callerId = authUser?.user?.id;
    if (!callerId) return false;
    const { data: adminRow } = await adminClient.from("admin_users").select("id").eq("id", callerId).maybeSingle();
    return Boolean(adminRow);
  }

  if (body.retry_payout_id) {
    const { data: payout, error: lookupError } = await adminClient
      .from("payouts")
      .select("id, venue_id")
      .eq("id", body.retry_payout_id)
      .maybeSingle();
    if (lookupError) return errorResponse(lookupError.message, 500);
    if (!payout) return errorResponse("Payout not found", 404);
    if (!(await callerCanActOnVenue(payout.venue_id))) return errorResponse("Not allowed", 403);

    const result = await retryFailedPayout(adminClient, body.retry_payout_id);
    return json({ mode: "retry", result });
  }

  if (!body.venue_id) return errorResponse("venue_id or retry_payout_id is required", 400);
  if (!(await callerCanActOnVenue(body.venue_id))) return errorResponse("Not allowed", 403);

  const result = await processVenue(adminClient, body.venue_id);
  return json({ mode: "manual", result });
});

// ----------------------------------------------------------------------------
// Wiring the real weekly cron (once you're ready — not required to test
// everything else in this phase):
//
//   select cron.schedule(
//     'weekly-partner-payouts',
//     '0 3 * * 1',  -- every Monday 3am UTC
//     $$
//     select net.http_post(
//       url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/cashfree-run-payout',
//       headers := jsonb_build_object('x-cron-secret', 'YOUR_CRON_SECRET'),
//       body := '{}'::jsonb
//     );
//     $$
//   );
//
// Requires the pg_cron and pg_net extensions enabled on the project, and
// CRON_SECRET set as a function secret matching what you schedule above.
// ----------------------------------------------------------------------------