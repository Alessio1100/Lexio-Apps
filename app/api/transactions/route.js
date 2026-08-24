import { NextResponse } from "next/server";
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
