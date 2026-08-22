import { NextResponse } from "next/server";
import { getUser } from "../../../../lib/auth";
import { listAspsps } from "../../../../lib/enablebanking";

// GET /api/enablebanking/aspsps?country=IT
// Elenco banche; mette Revolut e BuddyBank in cima.
export async function GET(request) {
  const { user } = await getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const country = (searchParams.get("country") || "IT").toUpperCase();

  try {
    const list = await listAspsps(country);
    const priority = (name) => {
      const n = (name || "").toLowerCase();
      if (n.includes("revolut")) return 0;
      if (n.includes("buddy")) return 1;
      return 2;
    };
    list.sort(
      (a, b) => priority(a.name) - priority(b.name) || (a.name || "").localeCompare(b.name || "")
    );
    return NextResponse.json(list);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 502 });
  }
}
