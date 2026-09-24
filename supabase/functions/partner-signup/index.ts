// JustPlay Partner — Backend Phase A: partner-signup
//
// Creates a `partners` row, a draft `venues` row (is_active = false —
// nothing shown to consumers until the venue is actually set up and
// published, a later phase), and the `partner_venues` link (role =
// 'owner'), all in one request so a partner never ends up with one but
// not the others.
//
// The caller must already have a Supabase Auth session (phone OTP
// verified client-side first, same as the consumer app's login). This
// function reads the phone number off THAT verified session — never off
// the request body — so nobody can sign up as a partner claiming a phone
// number that isn't actually theirs.
//
// One wrinkle: Supabase session identity here is actually email-shaped
// under the hood (see mock-otp-verify) — `auth.users.phone` is never set
// by that flow, only a synthetic per-phone email
// ("<digits>@phone.justplay.internal"). So the verified phone number is
// read back out of THAT email, not `user.phone`.

import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, errorResponse, json } from "../_shared/http.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return errorResponse("Method not allowed", 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return errorResponse("Missing Authorization header", 401);

  let body: { businessName?: string; ownerName?: string; city?: string };
  try {
    body = await req.json();
  } catch {
    return errorResponse("Invalid JSON body", 400);
  }

  const businessName = body.businessName?.trim();
  const ownerName = body.ownerName?.trim();
  const city = body.city?.trim() || "Kanpur";

  if (!businessName || businessName.length < 2) return errorResponse("businessName is required", 400);
  if (!ownerName || ownerName.length < 2) return errorResponse("ownerName is required", 400);

  // Scoped to the caller's JWT — this is how we get their VERIFIED phone
  // number, not something the request body could spoof.
  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser();

  if (userError || !user) return errorResponse("Invalid or expired session", 401);

  // Recover the verified phone from the synthetic email
  // ("919876543210@phone.justplay.internal" -> "+919876543210") rather
  // than `user.phone`, which this auth flow never populates.
  const emailPrefix = user.email?.split("@")[0] ?? "";
  if (!/^\d{12}$/.test(emailPrefix)) {
    return errorResponse("Could not determine your verified phone number from this session.", 400);
  }
  const phone = `+${emailPrefix}`;

  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  // Idempotent: if this person already has a partner account, just return
  // it rather than erroring — a retried/duplicate request shouldn't create
  // a second venue.
  const { data: existing } = await adminClient
    .from("partners")
    .select("id, approval_status")
    .eq("id", user.id)
    .maybeSingle();

  if (existing) {
    return json({ partnerId: existing.id, approvalStatus: existing.approval_status, alreadyExisted: true });
  }

  const { data: venue, error: venueError } = await adminClient
    .from("venues")
    .insert({
      name: businessName,
      address: "",
      city,
      area: city,
      sports_offered: [],
      amenities: [],
      operating_hours: {},
      photos: [],
      is_active: false,
    })
    .select("id")
    .single();

  if (venueError || !venue) {
    console.error("partner-signup: venue insert failed:", venueError?.message);
    return errorResponse("Could not create your venue. Please try again.", 500);
  }

  const { error: partnerError } = await adminClient.from("partners").insert({
    id: user.id,
    phone,
    owner_name: ownerName,
    business_name: businessName,
    approval_status: "pending",
  });

  if (partnerError) {
    // Roll back the venue we just created so a failed signup doesn't leave
    // an orphaned draft venue behind.
    await adminClient.from("venues").delete().eq("id", venue.id);
    console.error("partner-signup: partner insert failed:", partnerError.message);
    return errorResponse("Could not create your partner account. Please try again.", 500);
  }

  const { error: linkError } = await adminClient.from("partner_venues").insert({
    partner_id: user.id,
    venue_id: venue.id,
    role: "owner",
  });

  if (linkError) {
    await adminClient.from("partners").delete().eq("id", user.id);
    await adminClient.from("venues").delete().eq("id", venue.id);
    console.error("partner-signup: partner_venues link failed:", linkError.message);
    return errorResponse("Could not finish setting up your account. Please try again.", 500);
  }

  return json({ partnerId: user.id, venueId: venue.id, approvalStatus: "pending", alreadyExisted: false });
});
