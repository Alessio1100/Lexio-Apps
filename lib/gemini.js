// Classificazione delle spese con Gemini (Google AI Studio API).
// Solo lato server: usa GEMINI_API_KEY. Piano gratuito sufficiente per uso personale.
const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

function buildPrompt(txs, categoryNames, examples) {
  const lines = [
    "Sei un assistente che classifica spese bancarie personali in UNA categoria.",
    "",
    "Categorie disponibili (usa ESATTAMENTE uno di questi nomi; se sei incerto usa stringa vuota \"\"):",
    ...categoryNames.map((n) => `- ${n}`),
  ];
  if (examples.length) {
    lines.push(
      "",
      "Esempi di come l'utente ha già classificato (esercente => categoria):",
      ...examples.map((e) => `- ${e.merchant} => ${e.category}`)
    );
  }
  lines.push(
    "",
    "Classifica queste transazioni (importo negativo = spesa, positivo = entrata).",
    "Rispondi SOLO con un array JSON di oggetti {id, category}.",
    "",
    "Transazioni:",
    ...txs.map(
      (t) =>
        `- id=${t.id} | esercente="${(t.merchant || "").slice(0, 60)}" | importo=${t.amount} | descrizione="${(t.description || "").slice(0, 90)}"`
    )
  );
  return lines.join("\n");
}

// Ritorna [{ id, category }] con category = nome categoria (o "" se incerto).
export async function classifyWithGemini({ transactions, categoryNames, examples = [] }) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY non configurata");
  if (!transactions.length) return [];

  const body = {
    contents: [{ role: "user", parts: [{ text: buildPrompt(transactions, categoryNames, examples) }] }],
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
    throw new Error(`Gemini ${res.status}: ${data?.error?.message || res.statusText}`);
  }
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
  try {
    const arr = JSON.parse(text);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}
