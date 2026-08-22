import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Client Supabase lato server (Server Components, Route Handlers).
// Rispetta la sessione dell'utente via cookie → soggetto a RLS.
export function createClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // chiamato da un Server Component: ignorabile se c'è il middleware
          }
        },
      },
    }
  );
}
