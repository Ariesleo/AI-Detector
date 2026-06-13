import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Browser-safe publishable key (RLS protects the data). Auth UI hides
// gracefully when these are not configured — anonymous scanning still works.
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabase: SupabaseClient | null =
  url && key ? createClient(url, key) : null;

export const authEnabled = supabase !== null;
