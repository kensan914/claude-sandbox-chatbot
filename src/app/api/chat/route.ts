import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";
import { anthropic, MODEL } from "@/lib/anthropic";
import { SYSTEM_PROMPT } from "@/lib/systemPrompt";
import type { Message } from "@/types/chat";

export async function POST(req: NextRequest) {
  const { threadId, message } = (await req.json()) as {
    threadId: string;
    message: string;
  };

  if (!threadId || !message) {
    return new Response(
      JSON.stringify({ error: "threadId と message は必須です" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // ユーザーメッセージを DB に保存
  const { error: insertError } = await supabase.from("messages").insert({
    thread_id: threadId,
    role: "user",
    content: message,
  });

  if (insertError) {
    return new Response(
      JSON.stringify({ error: "メッセージの保存に失敗しました" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  // 会話履歴を取得
  const { data: history, error: historyError } = await supabase
    .from("messages")
    .select("role, content")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });

  if (historyError) {
    return new Response(
      JSON.stringify({ error: "会話履歴の取得に失敗しました" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const messages = (history as Pick<Message, "role" | "content">[]).map(
    (m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })
  );

  // Claude API ストリーミング呼び出し
  const encoder = new TextEncoder();
  let fullResponse = "";

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const anthropicStream = anthropic.messages.stream({
          model: MODEL,
          max_tokens: 4096,
          system: SYSTEM_PROMPT,
          messages,
        });

        anthropicStream.on("text", (text) => {
          fullResponse += text;
          controller.enqueue(encoder.encode(text));
        });

        anthropicStream.on("error", (error) => {
          const errorMessage =
            error instanceof Error ? error.message : "AI応答中にエラーが発生しました";
          controller.enqueue(
            encoder.encode(`\n\n[ERROR]: ${errorMessage}`)
          );
          controller.close();
        });

        await anthropicStream.finalMessage();

        // AI 応答を DB に保存
        await supabase.from("messages").insert({
          thread_id: threadId,
          role: "assistant",
          content: fullResponse,
        });

        controller.close();
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "AI応答中にエラーが発生しました";
        controller.enqueue(
          encoder.encode(`\n\n[ERROR]: ${errorMessage}`)
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
