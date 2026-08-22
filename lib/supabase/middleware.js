import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

// Aggiorna la sessione e protegge le pagine: se non autenticato → /login.
export async function updateSession(request) {
  let response = NextResponse.next({ request });

  const path = request.nextUrl.pathname;
  const isAuthPage = path.startsWith("/login") || path.startsWith("/auth");
  // pagine pubbliche (legali): accessibili senza login, mostrate anche nel consenso bancario
  const isPublic =
    isAuthPage || path.startsWith("/privacy") || path.startsWith("/termini");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Se le variabili d'ambiente non sono configurate, non far crashare il sito:
  // lascia passare la richiesta (le pagine mostreranno lo stato di errore lato client).
  if (!supabaseUrl || !supabaseKey) {
    return response;
  }

  try {
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user && !isPublic) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    if (user && isAuthPage) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }

    return response;
  } catch {
    // Errore imprevisto (rete/Supabase): non restituire 500.
    // Manda le pagine protette al login, lascia passare quelle pubbliche.
    if (!isPublic) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    return response;
  }
}
