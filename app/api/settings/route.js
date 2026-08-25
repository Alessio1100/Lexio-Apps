import { NextResponse } from "next/server";
import { getUser } from "../../../lib/auth";
import { salaryAnchorsFromTx } from "../../../lib/periods";

export async function GET() {
  const { supabase, user } = await getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let { data } = await supabase
    .from("settings")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  // fallback: se il trigger non ha creato la riga, creala ora
  if (!data) {
    const { data: created } = await supabase
      .from("settings")
      .insert({ user_id: user.id })
      .select()
      .single();
    data = created;
  }

  // Modalità "salary": i confini dei periodi seguono la data reale dell'accredito
  // stipendio (bonifico "EMOLUMENTI"). Calcoliamo la mappa mese->data e la
  // alleghiamo alla risposta (non è persistita: dipende dalle transazioni).
  if (data?.month_start_mode === "salary") {
    const since = new Date(Date.now() - 400 * 24 * 3600 * 1000)
      .toISOString()
      .slice(0, 10);
    const { data: sal } = await supabase
      .from("transactions")
      .select("value_date, booking_date, amount")
      .eq("user_id", user.id)
      .gt("amount", 0)
      .ilike("description", "%EMOLUMENTI%")
      .gte("value_date", since);
    data = {
      ...data,
      salary_anchors: salaryAnchorsFromTx(sal || [], data.month_start_day || 23),
    };
  }
  return NextResponse.json(data);
}

export async function PUT(request) {
  const { supabase, user } = await getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json();
  const patch = {};
  if (body.month_start_mode) patch.month_start_mode = body.month_start_mode;
  if (body.month_start_day != null)
    patch.month_start_day = Math.min(31, Math.max(1, Number(body.month_start_day)));
  if (body.default_period) patch.default_period = body.default_period;
  if (body.currency) patch.currency = body.currency;
  patch.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("settings")
    .update(patch)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
