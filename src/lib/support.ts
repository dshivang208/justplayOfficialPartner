/**
 * Partner support — raise a ticket with the JustPlay team and follow the
 * conversation. Tickets belong to the VENUE, so every owner and staff member
 * of a venue sees the same threads. Reads use RLS; writes go through the
 * SECURITY DEFINER RPCs in 20261024000000_partner_support.sql.
 */
import { supabase } from "./supabaseClient";

export type TicketStatus = "open" | "in_progress" | "waiting_user" | "resolved" | "closed";
export type PartnerTicketCategory =
  | "payout"
  | "booking"
  | "slots_inventory"
  | "venue_profile"
  | "account"
  | "app_issue"
  | "other";

export const CATEGORY_LABELS: Record<PartnerTicketCategory, string> = {
  payout: "Payouts & bank details",
  booking: "A booking or refund",
  slots_inventory: "Slots, courts & pricing",
  venue_profile: "Venue profile & photos",
  account: "My account & staff",
  app_issue: "App problem or bug",
  other: "Something else",
};

export const STATUS_LABELS: Record<TicketStatus, string> = {
  open: "Open",
  in_progress: "Being looked at",
  waiting_user: "Reply from JustPlay",
  resolved: "Resolved",
  closed: "Closed",
};

export type SupportTicket = {
  id: string;
  ticketNo: number;
  subject: string;
  category: string;
  status: TicketStatus;
  createdAt: string;
  lastMessageAt: string;
  lastSenderKind: "user" | "admin";
};

export type SupportMessage = {
  id: string;
  senderKind: "user" | "admin";
  senderUserId: string | null;
  body: string;
  createdAt: string;
};

type TicketRow = {
  id: string;
  ticket_no: number | string;
  subject: string;
  category: string;
  status: TicketStatus;
  created_at: string;
  last_message_at: string;
  last_sender_kind: "user" | "admin";
};

const COLS = "id, ticket_no, subject, category, status, created_at, last_message_at, last_sender_kind";

const toTicket = (r: TicketRow): SupportTicket => ({
  id: r.id,
  ticketNo: Number(r.ticket_no),
  subject: r.subject,
  category: r.category,
  status: r.status,
  createdAt: r.created_at,
  lastMessageAt: r.last_message_at,
  lastSenderKind: r.last_sender_kind,
});

const ERRORS: Record<string, string> = {
  AUTH_REQUIRED: "Please sign in again.",
  NOT_ALLOWED: "You don't have access to this venue.",
  SUBJECT_REQUIRED: "Add a short subject (at least 3 characters).",
  MESSAGE_TOO_SHORT: "Please describe the issue in at least 10 characters.",
  MESSAGE_TOO_LONG: "Messages can be up to 2000 characters.",
  MESSAGE_REQUIRED: "Write a message first.",
  TOO_MANY_OPEN: "Your venue already has 10 open tickets. Please wait for replies or mark some solved.",
  TOO_FAST: "You're going too fast. Please wait a little and try again.",
  TICKET_CLOSED: "This ticket is closed. Please open a new one.",
  TICKET_NOT_FOUND: "We couldn't find that ticket.",
};

function friendly(message: string): Error {
  if (/could not find the function|schema cache|does not exist/i.test(message)) {
    return new Error("Support isn't available yet. Please try again later.");
  }
  const code = Object.keys(ERRORS).find((k) => message.includes(k));
  return new Error(code ? ERRORS[code]! : "Something went wrong. Please try again.");
}

export async function fetchVenueTickets(venueId: string): Promise<SupportTicket[]> {
  const { data, error } = await supabase
    .from("support_tickets")
    .select(COLS)
    .eq("source", "partner")
    .eq("venue_id", venueId)
    .order("last_message_at", { ascending: false })
    .limit(100)
    .returns<TicketRow[]>();
  if (error) {
    console.error("fetchVenueTickets failed:", error.message);
    return [];
  }
  return (data ?? []).map(toTicket);
}

export async function fetchTicket(
  ticketId: string,
): Promise<{ ticket: SupportTicket; messages: SupportMessage[] } | null> {
  const [t, m] = await Promise.all([
    supabase.from("support_tickets").select(COLS).eq("id", ticketId).eq("source", "partner").maybeSingle<TicketRow>(),
    supabase
      .from("support_ticket_messages")
      .select("id, sender_kind, sender_user_id, body, created_at")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true }),
  ]);
  if (t.error || !t.data) return null;
  return {
    ticket: toTicket(t.data),
    messages: (m.data ?? []).map((r) => ({
      id: r.id as string,
      senderKind: r.sender_kind as "user" | "admin",
      senderUserId: (r.sender_user_id as string | null) ?? null,
      body: r.body as string,
      createdAt: r.created_at as string,
    })),
  };
}

export async function createTicket(input: {
  venueId: string;
  subject: string;
  category: PartnerTicketCategory;
  message: string;
}): Promise<SupportTicket> {
  const { data, error } = await supabase.rpc("create_partner_support_ticket", {
    p_venue_id: input.venueId,
    p_subject: input.subject,
    p_category: input.category,
    p_message: input.message,
  });
  if (error) throw friendly(error.message);
  return toTicket(data as TicketRow);
}

export async function sendTicketMessage(ticketId: string, body: string): Promise<void> {
  const { error } = await supabase.rpc("partner_add_support_message", {
    p_ticket_id: ticketId,
    p_body: body,
  });
  if (error) throw friendly(error.message);
}

export async function resolveTicket(ticketId: string): Promise<void> {
  const { error } = await supabase.rpc("partner_resolve_support_ticket", { p_ticket_id: ticketId });
  if (error) throw friendly(error.message);
}
