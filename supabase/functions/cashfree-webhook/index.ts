// JustPlay Partner — Backend Phase D: cashfree-webhook
//
// Configure this URL in the Cashfree Payouts Dashboard → Developers →
// Webhooks, selecting webhook version V2. Flips a payout's status from
// 'processing' to 'completed'/'failed' once Cashfree actually knows the
// outcome — cashfree-run-payout only ever writes 'processing' at transfer
// time, this is the only place a payout ever becomes terminal.
//
// STATUS MAPPING — this is easy to get wrong from the event `type` alone.
// Cashfree's own docs are explicit: "A transfer is considered successful
// only when both the status is SUCCESS and the status_code is COMPLETED."
// The TRANSFER_SUCCESS event type is NOT terminal by itself — its sample
// payload carries status_code "SENT_TO_BENEFICIARY", an intermediate
// state. TRANSFER_ACKNOWLEDGED is the one whose sample shows status_code
// "COMPLETED". So this checks data.status + data.status_code together,
// not the event type, and treats anything that isn't an explicit
// completed-or-failed combination as "not terminal yet — just log it and
// wait for the next event."
//
// SIGNATURE — HMAC-SHA256 of (x-webhook-timestamp + raw body), base64
// encoded, keyed with the client secret. Must use the raw body text, never
// the re-serialized parsed JSON, or the signature will never match.

import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, errorResponse, json } from "../_shared/http.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CASHFREE_CLIENT_SECRET = Deno.env.get("CASHFREE_CLIENT_SECRET")!;

async function hmacBase64(secret: string, message: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

type TransferEventData = {
  transfer_id?: string;
  cf_transfer_id?: string;
  status?: string; // SUCCESS | FAILED | REJECTED | REVERSED | ...
  status_code?: string; // COMPLETED | SENT_TO_BENEFICIARY | ... (terminal only when status=SUCCESS + status_code=COMPLETED)
};

const FAILURE_STATUSES = new Set(["FAILED", "REJECTED", "REVERSED"]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return errorResponse("Method not allowed", 405);

  // Cashfree signs the RAW request body — read as text first, verify, THEN
  // parse, so re-serializing can never invalidate the signature.
  const rawBody = await req.text();
  const signature = req.headers.get("x-webhook-signature");
  const timestamp = req.headers.get("x-webhook-timestamp");
  if (!signature || !timestamp) return errorResponse("Missing signature or timestamp", 400);

  const expected = await hmacBase64(CASHFREE_CLIENT_SECRET, timestamp + rawBody);
  if (!timingSafeEqual(expected, signature)) {
    console.error("Cashfree webhook signature mismatch");
    return errorResponse("Invalid signature", 400);
  }

  let event: { type?: string; data?: TransferEventData; event_time?: string };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return errorResponse("Invalid JSON body", 400);
  }

  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const eventType = event.type ?? "unknown";
  const data = event.data ?? {};
  const transferId = data.transfer_id;

  // Log every event we receive regardless of type or outcome — this is
  // the reconciliation trail if a transfer's status is ever disputed.
  // Non-transfer events (LOW_BALANCE_ALERT, CREDIT_CONFIRMATION,
  // BENEFICIARY_INCIDENT, BULK_TRANSFER_REJECTED — we only ever create
  // single transfers, not batches) have no transfer_id; the lookup
  // inside record_payout_webhook_event just leaves payout_id null for those.
  if (transferId) {
    const { error: logError } = await adminClient.rpc("record_payout_webhook_event", {
      p_cashfree_transfer_id: transferId,
      p_cashfree_event: eventType,
      p_payload: event,
    });
    if (logError) console.error("record_payout_webhook_event failed:", logError.message);
  }

  if (!transferId) {
    // Nothing further to do for account-level events (low balance, credit
    // confirmation, incidents) — acknowledge so Cashfree stops retrying.
    return json({ received: true });
  }

  let newStatus: "completed" | "failed" | null = null;
  if (data.status === "SUCCESS" && data.status_code === "COMPLETED") {
    newStatus = "completed";
  } else if (data.status && FAILURE_STATUSES.has(data.status)) {
    newStatus = "failed";
  }
  // Anything else (e.g. TRANSFER_SUCCESS with status_code
  // SENT_TO_BENEFICIARY) is a real but non-terminal update — logged above,
  // no status flip, wait for the terminal event.

  if (newStatus) {
    const { error } = await adminClient.rpc("mark_payout_status", {
      p_cashfree_transfer_id: transferId,
      p_status: newStatus,
    });
    if (error) {
      // A payout row not being found (e.g. a stray test webhook for a
      // transfer_id this project never created) isn't worth retrying
      // forever — log it and still acknowledge below.
      console.error(`mark_payout_status(${transferId} -> ${newStatus}) failed:`, error.message);
    }
  }

  // Cashfree only cares about the 2xx — always acknowledge once verified,
  // exactly like the Razorpay webhook does.
  return json({ received: true });
});