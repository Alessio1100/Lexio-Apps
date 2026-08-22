import { NextResponse } from "next/server";
import { getUser } from "../../../../lib/auth";
import { categorize } from "../../../../lib/categorize";

// Ricalcola la categoria di TUTTE le transazioni non "manual" applicando le regole.
export async function POST() {
  const { supabase, user } = await getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const [{ data: rules }, { data: txs }, { data: connections }] = await Promise.all([
    supabase.from("rules").select("*").eq("user_id", user.id),
    supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .neq("category_source", "manual"),
    supabase.from("bank_connections").select("id,institution_name").eq("user_id", user.id),
  ]);

  const bankById = Object.fromEntries(
    (connections || []).map((c) => [c.id, c.institution_name])
  );

  let updated = 0;
  const jobs = (txs || []).map(async (tx) => {
    const enriched = { ...tx, institution_name: bankById[tx.connection_id] };
    const { category_id, rule_id } = categorize(enriched, rules || []);
    const source = category_id ? "rule" : "none";
    if (
      tx.category_id !== category_id ||
      tx.rule_id !== rule_id ||
      tx.category_source !== source
    ) {
      await supabase
        .from("transactions")
        .update({ category_id, rule_id, category_source: source })
        .eq("id", tx.id)
        .eq("user_id", user.id);
      updated++;
    }
  });
  await Promise.all(jobs);

  return NextResponse.json({ ok: true, updated });
}
