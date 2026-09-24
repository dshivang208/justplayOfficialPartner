/**
 * Single shared Supabase client for the browser.
 *
 * This is the SAME Supabase project as the consumer JustPlay app — see
 * README.md — just a distinct `storageKey` so a browser that's logged into
 * both apps (same machine, different ports/origins in dev) keeps two
 * independent local sessions rather than one clobbering the other.
 */
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env["VITE_SUPABASE_URL"] as string | undefined;
const supabaseAnonKey = import.meta.env["VITE_SUPABASE_ANON_KEY"] as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  // Fail loudly in the console rather than have every auth call silently
  // reject with a cryptic network error.
  console.error(
    "Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Copy .env.example to " +
      ".env.local and fill in your Supabase project's URL + anon key.",
  );
}

export const supabase = createClient(supabaseUrl ?? "", supabaseAnonKey ?? "", {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    storageKey: "justplay-partner.supabase.auth",
  },
});

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
