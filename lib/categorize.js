// Motore di categorizzazione: dato un insieme di regole ordinate, assegna a una
// transazione la categoria della PRIMA regola che matcha (priority crescente).
//
// Formato di una regola: { priority, enabled, category_id, conditions }
// conditions = { logic: "and"|"or", clauses: [ { field, op, value } ] }
//   field: "description" | "merchant" | "bank" | "amount"
//   op (testo):   contains | equals | startsWith | regex
//   op (importo): gt | lt | equals | between  (value = numero, o [min,max])

function fieldValue(tx, field) {
  switch (field) {
    case "description":
      return tx.description || "";
    case "merchant":
      return tx.merchant_name || tx.creditor_name || "";
    case "bank":
      return tx.institution_name || tx.bank || "";
    case "amount":
      return Number(tx.amount);
    case "foreign":
      return !!(tx.is_foreign ?? tx.foreign);
    default:
      return "";
  }
}

export function matchClause(tx, clause) {
  const { field, op, value } = clause || {};
  const target = fieldValue(tx, field);

  if (field === "foreign") {
    const isForeign = !!target;
    const want =
      value === true || value === "true" || value === "si" || value === "sì";
    return isForeign === want;
  }

  if (field === "amount") {
    const n = Number(target);
    const abs = Math.abs(n);
    switch (op) {
      case "gt":
        return abs > Number(value);
      case "lt":
        return abs < Number(value);
      case "equals":
        return abs === Number(value);
      case "between":
        return (
          Array.isArray(value) &&
          abs >= Number(value[0]) &&
          abs <= Number(value[1])
        );
      default:
        return false;
    }
  }

  const t = String(target).toLowerCase();
  const v = String(value ?? "").toLowerCase();
  switch (op) {
    case "contains":
      return v.length > 0 && t.includes(v);
    case "equals":
      return t === v;
    case "startsWith":
      return t.startsWith(v);
    case "regex":
      try {
        return new RegExp(value, "i").test(String(target));
      } catch {
        return false;
      }
    default:
      return false;
  }
}

export function matchRule(tx, rule) {
  const cond = rule.conditions || {};
  const clauses = cond.clauses || [];
  if (!clauses.length) return false;
  const logic = cond.logic || "and";
  return logic === "or"
    ? clauses.some((c) => matchClause(tx, c))
    : clauses.every((c) => matchClause(tx, c));
}

// Ritorna { category_id, rule_id } o { null, null } se nessuna regola matcha.
export function categorize(tx, rules) {
  const active = (rules || [])
    .filter((r) => r.enabled !== false)
    .sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100));
  for (const r of active) {
    if (matchRule(tx, r)) return { category_id: r.category_id, rule_id: r.id };
  }
  return { category_id: null, rule_id: null };
}
