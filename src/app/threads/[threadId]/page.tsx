import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import ChatContainer from "@/components/ChatContainer";
import type { Message } from "@/types/chat";

type Props = {
  params: Promise<{ threadId: string }>;
};

export default async function ThreadPage({ params }: Props) {
  const { threadId } = await params;

  // スレッドの存在確認
  const { data: thread, error: threadError } = await supabase
    .from("threads")
    .select("id")
    .eq("id", threadId)
    .single();

  if (threadError || !thread) {
    notFound();
  }

  // 会話履歴を取得
  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });

  return <ChatContainer threadId={threadId} initialMessages={(messages as Message[]) ?? []} />;
}
