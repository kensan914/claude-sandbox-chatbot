import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST() {
  const { data, error } = await supabase
    .from("threads")
    .insert({})
    .select("id")
    .single();

  if (error) {
    return NextResponse.json(
      { error: "スレッドの作成に失敗しました" },
      { status: 500 }
    );
  }

  return NextResponse.json({ threadId: data.id });
}
