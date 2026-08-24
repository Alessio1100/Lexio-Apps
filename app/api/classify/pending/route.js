import { NextResponse } from "next/server";
import { getUser } from "../../../../lib/auth";
import { deriveMerchant } from "../../../../lib/enablebanking";

// Elenco delle transazioni ancora senza categoria (dalle più recenti),
// da classificare una alla volta lato client.
export async function GET() {
  const { supabase, user } = await getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("transactions")
    .select("id,merchant_name,description,amount,booking_date,raw")
    .eq("user_id", user.id)
    .is("category_id", null)
    .order("booking_date", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const transactions = (data || []).map((t) => ({
    id: t.id,
    name: deriveMerchant(t.raw, t.description) || t.merchant_name || (t.description || "").slice(0, 40),
    amount: t.amount,
    date: t.booking_date,
  }));
  return NextResponse.json({ transactions });
}
