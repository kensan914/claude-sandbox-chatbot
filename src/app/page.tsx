import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default async function Home() {
  const { data, error } = await supabase
    .from("threads")
    .insert({})
    .select("id")
    .single();

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-red-500">スレッドの作成に失敗しました</p>
      </div>
    );
  }

  redirect(`/threads/${data.id}`);
}
