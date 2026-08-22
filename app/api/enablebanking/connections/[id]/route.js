import { NextResponse } from "next/server";
import { getUser } from "../../../../../lib/auth";

// Scollega un conto (rimuove la connessione e, a cascata, le sue transazioni).
export async function DELETE(request, { params }) {
  const { supabase, user } = await getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { error } = await supabase
    .from("bank_connections")
    .delete()
    .eq("id", params.id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
