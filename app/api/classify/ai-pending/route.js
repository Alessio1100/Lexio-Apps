import { NextResponse } from "next/server";
import { getUser } from "../../../../lib/auth";
import { deriveMerchant } from "../../../../lib/enablebanking";

// Transazioni classificate da Gemini e ancora NON approvate (category_source='ai'),
// dalle più recenti. Mostrate sotto il pulsante Gemini in Impostazioni per revisione.
export async function GET() {
  const { supabase, user } = await getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("transactions")
    .select("id,merchant_name,description,amount,value_date,raw,categories(name,color,icon)")
    .eq("user_id", user.id)
    .eq("category_source", "ai")
    .order("value_date", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const transactions = (data || []).map((t) => ({
    id: t.id,
    name: deriveMerchant(t.raw, t.description) || t.merchant_name || (t.description || "").slice(0, 40),
    amount: t.amount,
    date: t.value_date,
    category: t.categories?.name || "",
    color: t.categories?.color || null,
    icon: t.categories?.icon || null,
  }));
  return NextResponse.json({ transactions });
}
