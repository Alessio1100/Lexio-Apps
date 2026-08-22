import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getUser } from "../../../../lib/auth";
import { startAuth } from "../../../../lib/enablebanking";

// POST { aspspName, country, institutionName } → avvia l'autorizzazione e ritorna l'URL di consenso.
export async function POST(request) {
  const { supabase, user } = await getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { aspspName, country, institutionName } = await request.json();
  if (!aspspName)
    return NextResponse.json({ error: "aspspName mancante" }, { status: 400 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
  const state = randomUUID();
  const redirectUrl = `${appUrl}/api/enablebanking/callback`;

  // consenso valido ~89 giorni (sotto il limite PSD2 di 90)
  const validUntil = new Date(Date.now() + 89 * 24 * 3600 * 1000).toISOString();

  try {
    const auth = await startAuth({
      aspspName,
      country: (country || "IT").toUpperCase(),
      redirectUrl,
      state,
      validUntil,
    });

    await supabase.from("bank_connections").insert({
      user_id: user.id,
      provider: "enablebanking",
      institution_id: aspspName,
      institution_name: institutionName || aspspName,
      requisition_id: auth.authorization_id || null,
      reference: state,
      status: "pending",
    });

    return NextResponse.json({ url: auth.url });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 502 });
  }
}
