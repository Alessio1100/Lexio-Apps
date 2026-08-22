import { NextResponse } from "next/server";
import { getUser } from "../../../../lib/auth";

// PATCH: assegna manualmente una categoria (blocca la ricategorizzazione automatica).
// { category_id: "..." }  → source manual
// { category_id: null, reset: true } → torna a "none" (ricategorizzabile dalle regole)
export async function PATCH(request, { params }) {
  const { supabase, user } = await getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json();
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
    .select("*, categories(id,name,color,icon,is_income)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
