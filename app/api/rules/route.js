import { NextResponse } from "next/server";
import { getUser } from "../../../lib/auth";

export async function GET() {
  const { supabase, user } = await getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("rules")
    .select("*")
    .eq("user_id", user.id)
    .order("priority", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function POST(request) {
  const { supabase, user } = await getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json();
  const { data, error } = await supabase
    .from("rules")
    .insert({
      user_id: user.id,
      name: body.name,
      priority: body.priority ?? 100,
      enabled: body.enabled ?? true,
      conditions: body.conditions || { logic: "and", clauses: [] },
      category_id: body.category_id || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
