import { NextResponse } from "next/server";
import { getUser } from "../../../../lib/auth";

export async function PATCH(request, { params }) {
  const { supabase, user } = await getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json();
  const patch = {};
  for (const k of ["name", "color", "icon", "bucket", "is_income", "sort"]) {
    if (body[k] !== undefined) patch[k] = body[k];
  }

  const { data, error } = await supabase
    .from("categories")
    .update(patch)
    .eq("id", params.id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function DELETE(request, { params }) {
  const { supabase, user } = await getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", params.id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
