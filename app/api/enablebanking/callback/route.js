import { NextResponse } from "next/server";
import { getUser } from "../../../../lib/auth";
import { createSession } from "../../../../lib/enablebanking";

// Redirect di ritorno dal consenso bancario: ?code=...&state=... (o ?error=...).
export async function GET(request) {
  const { supabase, user } = await getUser();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
  const done = (params) => NextResponse.redirect(`${appUrl}/impostazioni?${params}`);

  if (!user) return NextResponse.redirect(`${appUrl}/login`);

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  if (error) return done(`error=${encodeURIComponent(error)}`);
  if (!code || !state) return done("error=parametri_mancanti");

  const { data: pending } = await supabase
    .from("bank_connections")
    .select("*")
    .eq("user_id", user.id)
    .eq("reference", state)
    .eq("status", "pending")
    .maybeSingle();

  if (!pending) return done("error=connessione_non_trovata");

  try {
    const session = await createSession(code);
    const accounts = session.accounts || [];
    if (!accounts.length) return done("error=nessun_conto");

    const expires = new Date(Date.now() + 89 * 24 * 3600 * 1000);

    for (const acc of accounts) {
      const uid = acc.uid || acc.account_id;
      const iban = acc.account_id?.iban || acc.identification_hash || null;
      await supabase.from("bank_connections").upsert(
        {
          user_id: user.id,
          provider: "enablebanking",
          institution_id: pending.institution_id,
          institution_name: pending.institution_name,
          requisition_id: session.session_id,
          reference: state,
          gc_account_id: uid,
          iban_masked: acc.name || (typeof iban === "string" ? `••••${iban.slice(-4)}` : null),
          currency: acc.currency || "EUR",
          status: "linked",
          consent_expires_at: expires.toISOString(),
        },
        { onConflict: "gc_account_id" }
      );
    }

    // rimuovi la riga pending (senza gc_account_id)
    await supabase
      .from("bank_connections")
      .delete()
      .eq("id", pending.id)
      .is("gc_account_id", null);

    return done("connected=1");
  } catch (e) {
    return done(`error=${encodeURIComponent(e.message)}`);
  }
}
