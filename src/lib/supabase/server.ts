import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// No auth/session in this app, so a fresh anon-key client per request is fine —
// created via a function (not a module-level singleton) to avoid caching a
// server-side client across unrelated requests.
export function createServerClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  });
}
