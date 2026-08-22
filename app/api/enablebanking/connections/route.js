import { NextResponse } from "next/server";
import { getUser } from "../../../../lib/auth";

export async function GET() {
  const { supabase, user } = await getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("bank_connections")
    .select("*")
    .eq("user_id", user.id)
    .not("gc_account_id", "is", null)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
