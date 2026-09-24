// JustPlay Partner — Backend Phase D: cashfree-save-beneficiary
//
// Saves bank/UPI details via `partner_save_payout_account` (works with no
// Cashfree configuration at all — that RPC has no external dependency),
// THEN attempts to register the same details as a Cashfree Payouts V2
// beneficiary. If Cashfree isn't configured yet (no CASHFREE_CLIENT_ID/
// CASHFREE_CLIENT_SECRET secrets set), the save still succeeds and this
// function returns clearly saying verification was skipped — it never
// blocks the basic save on a missing integration.
//
// Cashfree Payouts V2 auth is just three headers on every request — no
// separate token-exchange call the way v1 needed.
//
// IMPORTANT beneficiary-id handling: Cashfree V2 has Create/Get/Remove for
// beneficiaries but no "update". A fresh, never-reused beneficiary_id is
// generated on every save (timestamp-suffixed — see also the schema
// comment on partner_save_payout_account for why the DB keeps the OLD id
// around rather than nulling it immediately). If an old beneficiary is on
// file, it's removed first — otherwise re-saving the exact same bank
// account/IFSC under a new id 409s with beneficiary_already_exists, since
// Cashfree also de-dupes on the (account_number, ifsc) pair itself, not
// just on beneficiary_id.

import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, errorResponse, json } from "../_shared/http.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CASHFREE_CLIENT_ID = Deno.env.get("CASHFREE_CLIENT_ID");
const CASHFREE_CLIENT_SECRET = Deno.env.get("CASHFREE_CLIENT_SECRET");
const CASHFREE_ENV = Deno.env.get("CASHFREE_ENV") ?? "sandbox"; // "sandbox" | "production"
const CASHFREE_API_VERSION = "2024-01-01";

const CASHFREE_BASE_URL =
  CASHFREE_ENV === "production" ? "https://api.cashfree.com/payout" : "https://sandbox.cashfree.com/payout";

function cashfreeHeaders() {
  return {
    "Content-Type": "application/json",
    "x-api-version": CASHFREE_API_VERSION,
    "x-client-id": CASHFREE_CLIENT_ID!,
    "x-client-secret": CASHFREE_CLIENT_SECRET!,
  };
}

/** Cashfree's beneficiary_name rule: alphabets and whitespace only, <=100 chars. */
function sanitizeBeneficiaryName(name: string): string {
  return name.replace(/[^a-zA-Z\s]/g, "").trim().slice(0, 100) || "Venue Partner";
}

function newBeneficiaryId(venueId: string): string {
  // Alphanumeric + underscore, <=50 chars per Cashfree's rule. Timestamp
  // suffix guarantees this exact id was never used before, so a fresh
  // Create call never collides on beneficiary_id itself.
  return `venue_${venueId.replace(/-/g, "").slice(0, 20)}_${Date.now()}`;
}

/** Best-effort remove of a previous beneficiary — safe to ignore failures
 *  (e.g. it was already removed, or never actually reached Cashfree). */
async function removeBeneficiaryIfPresent(beneficiaryId: string | null) {
  if (!beneficiaryId) return;
  try {
    const url = `${CASHFREE_BASE_URL}/beneficiary?beneficiary_id=${encodeURIComponent(beneficiaryId)}`;
    const res = await fetch(url, { method: "DELETE", headers: cashfreeHeaders() });
    if (!res.ok && res.status !== 404) {
      console.error("Cashfree remove-beneficiary non-fatal failure:", await res.text().catch(() => ""));
    }
  } catch (e) {
    console.error("Cashfree remove-beneficiary request failed:", e);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return errorResponse("Method not allowed", 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return errorResponse("Missing Authorization header", 401);

  let body: {
    venue_id?: string;
    method?: "bank" | "upi";
    account_holder_name?: string;
    account_number?: string;
    ifsc?: string;
    upi_id?: string;
    customer_phone?: string;
  };
  try {
    body = await req.json();
  } catch {
    return errorResponse("Invalid JSON body", 400);
  }

  const { venue_id, method } = body;
  if (!venue_id || !method) return errorResponse("venue_id and method are required", 400);

  // Runs as the calling partner — partner_save_payout_account itself
  // checks they actually own this venue, and validates the format of
  // whatever they submitted (IFSC shape, UPI shape, etc).
  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: account, error: saveError } = await userClient.rpc("partner_save_payout_account", {
    p_venue_id: venue_id,
    p_method: method,
    p_account_holder_name: body.account_holder_name ?? null,
    p_account_number: body.account_number ?? null,
    p_ifsc: body.ifsc ?? null,
    p_upi_id: body.upi_id ?? null,
  });

  if (saveError) return errorResponse(saveError.message, 400);

  if (!CASHFREE_CLIENT_ID || !CASHFREE_CLIENT_SECRET) {
    return json({
      saved: true,
      verified: false,
      verificationSkipped: true,
      message: "Bank details saved. Cashfree isn't configured yet, so verification is still pending.",
      account,
    });
  }

  // `account` still carries the PREVIOUS cashfree_beneficiary_id (the save
  // RPC deliberately doesn't clear it) — remove that registration first so
  // the fresh Create call below can never collide on the bank
  // account_number + ifsc pair.
  await removeBeneficiaryIfPresent(account?.cashfree_beneficiary_id ?? null);

  const beneficiaryId = newBeneficiaryId(venue_id);
  const instrumentDetails =
    method === "bank"
      ? { bank_account_number: body.account_number, bank_ifsc: body.ifsc?.toUpperCase() }
      : { vpa: body.upi_id };

  const cfRes = await fetch(`${CASHFREE_BASE_URL}/beneficiary`, {
    method: "POST",
    headers: cashfreeHeaders(),
    body: JSON.stringify({
      beneficiary_id: beneficiaryId,
      beneficiary_name: sanitizeBeneficiaryName(body.account_holder_name ?? "Venue Partner"),
      beneficiary_instrument_details: instrumentDetails,
      beneficiary_contact_details: body.customer_phone
        ? { beneficiary_phone: body.customer_phone, beneficiary_country_code: "+91" }
        : undefined,
    }),
  });

  const cfBody = await cfRes.json().catch(() => null);
  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  if (!cfRes.ok) {
    console.error("Cashfree add-beneficiary failed:", cfBody);
    const { error: markError } = await adminClient.rpc("mark_payout_account_verified", {
      p_venue_id: venue_id,
      p_cashfree_beneficiary_id: beneficiaryId,
      p_verified: false,
    });
    if (markError) console.error("mark_payout_account_verified failed:", markError.message);
    return json({
      saved: true,
      verified: false,
      message: cfBody?.message ?? "Cashfree could not verify these details. Double-check them and try again.",
      account,
    });
  }

  // Only "VERIFIED" means available for payouts — the other five possible
  // values (INVALID, INITIATED, CANCELLED, FAILED, DELETED) all mean "not
  // yet", so anything else is treated as not verified.
  const verified = cfBody?.beneficiary_status === "VERIFIED";

  const { data: updated, error: markError } = await adminClient.rpc("mark_payout_account_verified", {
    p_venue_id: venue_id,
    p_cashfree_beneficiary_id: beneficiaryId,
    p_verified: verified,
  });
  if (markError) console.error("mark_payout_account_verified failed:", markError.message);

  return json({ saved: true, verified, account: updated ?? account });
});