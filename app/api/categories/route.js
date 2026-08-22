import { NextResponse } from "next/server";
import { getUser } from "../../../lib/auth";

export async function GET() {
  const { supabase, user } = await getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("user_id", user.id)
    .order("is_income", { ascending: true })
    .order("sort", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function POST(request) {
  const { supabase, user } = await getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json();
  const { data, error } = await supabase
    .from("categories")
    .insert({
      user_id: user.id,
      name: body.name,
      color: body.color || "#6366f1",
      icon: body.icon || "",
      bucket: body.bucket || (body.is_income ? "income" : "wants"),
      is_income: !!body.is_income,
      sort: body.sort ?? 100,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
