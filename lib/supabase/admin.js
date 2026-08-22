import { createClient } from "@supabase/supabase-js";

// Client "service role": bypassa RLS. USARE SOLO lato server (mai nel browser),
// e filtrando SEMPRE per user_id per non mischiare i dati.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
