import { NextResponse } from "next/server";
import { getUser } from "../../../../lib/auth";
import { categorize } from "../../../../lib/categorize";
import { deriveMerchant } from "../../../../lib/enablebanking";
import { detectTransferIds, ensureTransferCategory } from "../../../../lib/transfers";
import { idsToMarkFixed } from "../../../../lib/fixed";

// Ricalcola tutto sulle transazioni NON manuali:
// 1) aggiorna la controparte (merchant) dal dato grezzo,
// 2) riapplica le regole,
// 3) marca i giroconti interni come "Trasferimenti".
export async function POST() {
  const { supabase, user } = await getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const [{ data: rules }, { data: txs }, { data: connections }] = await Promise.all([
    supabase.from("rules").select("*").eq("user_id", user.id),
    // rielabora solo le auto-assegnate dalle regole o non categorizzate:
    // preserva manuali, memoria (memory), AI (ai) e trasferimenti
    supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .in("category_source", ["none", "rule"]),
    supabase.from("bank_connections").select("id,institution_name").eq("user_id", user.id),
  ]);

  const bankById = Object.fromEntries(
    (connections || []).map((c) => [c.id, c.institution_name])
  );
  const transferCatId = await ensureTransferCategory(supabase, user.id);

  // 1) + 2): ricalcolo controparte e categoria per ogni transazione
  const working = (txs || []).map((tx) => {
    const merchant = tx.raw
      ? deriveMerchant(tx.raw, tx.description) || tx.merchant_name
      : tx.merchant_name;
    const enriched = { ...tx, merchant_name: merchant, institution_name: bankById[tx.connection_id] };
    const { category_id, rule_id } = categorize(enriched, rules || []);
    return {
      ...tx,
      merchant_name: merchant,
      category_id,
      rule_id,
      category_source: category_id ? "rule" : "none",
    };
  });

  // 3): i giroconti interni vincono sulle regole
  const transferIds = detectTransferIds(working);
  for (const t of working) {
    if (transferIds.has(t.id)) {
      t.category_id = transferCatId;
      t.rule_id = null;
      t.category_source = "transfer";
    }
  }

  let updated = 0;
  await Promise.all(
    working.map(async (t) => {
      await supabase
        .from("transactions")
        .update({
          merchant_name: t.merchant_name,
          category_id: t.category_id,
          rule_id: t.rule_id,
          category_source: t.category_source,
        })
        .eq("id", t.id)
        .eq("user_id", user.id);
      updated++;
    })
  );

  // propaga le spese fisse alle ricorrenze della stessa controparte + stesso importo
  const { data: allTx } = await supabase
    .from("transactions")
    .select("id,merchant_name,amount,is_fixed")
    .eq("user_id", user.id);
  const fixedIds = idsToMarkFixed(allTx || []);
  await Promise.all(
    fixedIds.map((id) =>
      supabase.from("transactions").update({ is_fixed: true }).eq("id", id).eq("user_id", user.id)
    )
  );

  return NextResponse.json({
    ok: true,
    updated,
    transfers: transferIds.size,
    fixed: fixedIds.length,
  });
}
