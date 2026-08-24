// Classificazione delle spese con Gemini (Google AI Studio API).
// Solo lato server: usa GEMINI_API_KEY. Piano gratuito sufficiente per uso personale.
const MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";

function catLabel(c) {
  const tipo = c.is_income ? "entrata" : "uscita";
  const bucket = c.bucket && c.bucket !== "income" ? ` · ${c.bucket}` : "";
  return `- ${c.name} [${tipo}${bucket}]`;
}

function buildPrompt({ transactions, categories, examples, rulesText }) {
  const lines = [
    "Sei un assistente che classifica spese bancarie personali in UNA categoria.",
    "",
    'Categorie disponibili (usa ESATTAMENTE il nome; se sei incerto usa stringa vuota ""):',
    ...categories.map(catLabel),
  ];

  if (rulesText) {
    lines.push(
      "",
      "Regole dell'utente (indicazioni forti: seguile, ma ragiona sul contesto per correggere quando serve):",
      rulesText
    );
  }

  if (examples.length) {
    lines.push(
      "",
      "Esempi di come l'utente ha già classificato a mano (esercente => categoria):",
      ...examples.map((e) => `- ${e.merchant} => ${e.category}`)
    );
  }

  lines.push(
    "",
    "REGOLE SPECIALI IMPORTANTI:",
    "- Se la spesa è avvenuta ALL'ESTERO (estero=si, oppure valuta diversa da EUR, oppure città/paese estero nel nome o nella descrizione) → categoria \"Viaggi / Vacanze\", ANCHE se l'esercente sarebbe di un'altra categoria (es. un supermercato o ristorante all'estero va in Viaggi, NON in Alimentari o Ristoranti).",
    "- Se l'importo è positivo (entrata), scegli SOLO tra le categorie di tipo [entrata].",
    "- Se l'importo è negativo (spesa), scegli tra le categorie di tipo [uscita].",
    "- Un giroconto tra conti propri, se esiste la categoria, va in \"Trasferimenti\".",
    "",
    "Per ogni transazione: 'testo_originale' è la descrizione GREZZA della banca (usala come fonte PRINCIPALE per capire esercente e luogo); 'esercente' è solo un nome semplificato di supporto.",
    "",
    "Classifica queste transazioni. Rispondi SOLO con un array JSON di oggetti {id, category}.",
    "",
    "Transazioni:",
    ...transactions.map(
      (t) =>
        `- id=${t.id} | esercente="${(t.merchant || "").slice(0, 60)}" | importo=${t.amount} | valuta=${t.currency || "EUR"} | estero=${t.foreign ? "si" : "no"} | banca="${t.bank || ""}" | testo_originale="${(t.description || "").slice(0, 400)}"`
    )
  );
  return lines.join("\n");
}

// Ritorna [{ id, category }] con category = nome categoria (o "" se incerto).
export async function classifyWithGemini({ transactions, categories, examples = [], rulesText = "" }) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY non configurata");
  if (!transactions.length) return [];

  const body = {
    contents: [
      { role: "user", parts: [{ text: buildPrompt({ transactions, categories, examples, rulesText }) }] },
    ],
    generationConfig: {
      temperature: 0,
      responseMimeType: "application/json",
      responseSchema: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: { id: { type: "STRING" }, category: { type: "STRING" } },
          required: ["id", "category"],
        },
      },
    },
  };

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`,
    { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body), cache: "no-store" }
  );
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(`Gemini ${res.status}: ${data?.error?.message || res.statusText}`);
    err.status = res.status;
    const retry = (data?.error?.details || []).find((d) =>
      (d["@type"] || "").includes("RetryInfo")
    )?.retryDelay;
    if (retry) err.retryDelay = retry; // es. "30s"
    throw err;
  }
  // i modelli "thinking" possono restituire più parti: concatena solo il testo
  const parts = data.candidates?.[0]?.content?.parts || [];
  const text = parts.map((p) => p.text).filter(Boolean).join("") || "[]";
  try {
    const arr = JSON.parse(text);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

// Riassume le regole dell'utente in testo leggibile da mettere nel prompt.
export function summarizeRules(rules, categoryNameById) {
  const out = [];
  for (const r of (rules || []).filter((x) => x.enabled !== false)) {
    const cat = categoryNameById[r.category_id];
    if (!cat) continue;
    const clauses = r.conditions?.clauses || [];
    if (!clauses.length) continue;
    const logic = r.conditions?.logic === "or" ? " oppure " : " e ";
    const parts = clauses.slice(0, 12).map((c) => {
      if (c.field === "foreign") return "è all'estero";
      if (c.field === "direction") return c.value === "in" ? "è un'entrata" : "è un'uscita";
      if (c.field === "amount") return `importo ${c.op} ${c.value}`;
      return `contiene "${c.value}"`;
    });
    out.push(`- ${cat}: se ${parts.join(logic)}`);
  }
  return out.join("\n");
}
