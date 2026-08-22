import { createClient } from "./supabase/server";

// Recupera l'utente autenticato in una Route Handler / Server Component.
export async function getUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}
