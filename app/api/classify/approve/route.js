import { NextResponse } from "next/server";
import { getUser } from "../../../../lib/auth";

// Approva le classificazioni di Gemini: le transazioni passano da 'ai' a 'manual'
// (confermate dall'utente → protette dal reapply e usate come memoria per esercente).
// ids assente/vuoto = approva tutte le 'ai'.
export async function POST(request) {
  const { supabase, user } = await getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let ids = null;
  try {
    const body = await request.json();
    if (Array.isArray(body?.ids)) ids = body.ids;
  } catch {}

  let q = supabase
    .from("transactions")
    .update({ category_source: "manual" })
    .eq("user_id", user.id)
    .eq("category_source", "ai");
  if (ids && ids.length) q = q.in("id", ids);

  const { error, count } = await q.select("id", { count: "exact" });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, approved: count || 0 });
}
