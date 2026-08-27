import { NextResponse } from "next/server";
import { getUser } from "../../../../lib/auth";

// PATCH:
// - { category_id, reset } → assegna categoria (manuale) o resetta a "none"
// - { is_fixed } → marca/smarca "spesa fissa" propagando a tutte le transazioni
//   della STESSA controparte E dello STESSO importo (una ricorrenza specifica: es.
//   la rata del telefono su Amazon, non tutti gli acquisti Amazon)
export async function PATCH(request, { params }) {
  const { supabase, user } = await getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json();

  // ---- toggle "spesa fissa" ----
  if (body.is_fixed !== undefined) {
    const isFixed = !!body.is_fixed;
    const { data: tx } = await supabase
      .from("transactions")
      .select("id,merchant_name,amount")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single();
    if (!tx) return NextResponse.json({ error: "not found" }, { status: 404 });

    const merchant = (tx.merchant_name || "").trim();
    let q = supabase
      .from("transactions")
      .update({ is_fixed: isFixed })
      .eq("user_id", user.id);
    q = merchant
      ? q.ilike("merchant_name", merchant).eq("amount", tx.amount)
      : q.eq("id", params.id);
    const { error } = await q;
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true, is_fixed: isFixed, merchant });
  }

  // ---- override categoria ----
  const patch = {
    category_id: body.category_id ?? null,
    rule_id: null,
    category_source: body.reset ? "none" : "manual",
  };

  const { data, error } = await supabase
    .from("transactions")
    .update(patch)
    .eq("id", params.id)
    .eq("user_id", user.id)
    .select("*, categories(id,name,color,icon,is_income,bucket)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
