import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getUser } from "../../../lib/auth";
import { deriveMerchant } from "../../../lib/enablebanking";

// GET /api/transactions?from=YYYY-MM-DD&to=YYYY-MM-DD&category=&connection=&q=
export async function GET(request) {
  const { supabase, user } = await getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const category = searchParams.get("category");
  const connection = searchParams.get("connection");
  const q = searchParams.get("q");

  let query = supabase
    .from("transactions")
    .select(
      "*, categories(id,name,color,icon,is_income,bucket), bank_connections(id,institution_name)"
    )
    .eq("user_id", user.id)
    .order("booking_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (from) query = query.gte("booking_date", from);
  if (to) query = query.lt("booking_date", to);
  if (category === "none") query = query.is("category_id", null);
  else if (category) query = query.eq("category_id", category);
  if (connection) query = query.eq("connection_id", connection);
  if (q) query = query.or(`description.ilike.%${q}%,merchant_name.ilike.%${q}%`);

  const { data, error } = await query.limit(2000);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Nome "indicativo" calcolato al volo (vale anche per le spese passate),
  // e rimozione del pesante campo raw dal payload.
  const rows = (data || []).map((r) => {
    const { raw, ...rest } = r;
    return {
      ...rest,
      display_name:
        deriveMerchant(raw, r.description) || r.merchant_name || r.description || "",
    };
  });
  return NextResponse.json(rows);
}

// POST: aggiunge una spesa manuale (es. contanti).
// { amount, is_expense, name, category_id, date }
export async function POST(request) {
  const { supabase, user } = await getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json();
  const value = Math.abs(Number(body.amount) || 0);
  if (!value) return NextResponse.json({ error: "importo non valido" }, { status: 400 });
  const isExpense = body.is_expense !== false; // default: spesa
  const signed = isExpense ? -value : value;
  const date = body.date || new Date().toISOString().slice(0, 10);
  const name = (body.name || "").trim() || "Spesa in contanti";

  const { data, error } = await supabase
    .from("transactions")
    .insert({
      user_id: user.id,
      connection_id: null, // manuale/contanti: nessuna banca
      gc_transaction_id: `manual_${randomUUID()}`,
      booking_date: date,
      value_date: date,
      amount: signed,
      currency: body.currency || "EUR",
      description: name,
      merchant_name: name,
      is_foreign: false,
      category_id: body.category_id || null,
      category_source: body.category_id ? "manual" : "none",
    })
    .select("*, categories(id,name,color,icon,is_income,bucket)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
