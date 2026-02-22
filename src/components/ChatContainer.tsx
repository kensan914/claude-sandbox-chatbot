"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";
import TypingIndicator from "./TypingIndicator";
import type { Message } from "@/types/chat";

type Props = {
  threadId: string;
  initialMessages: Message[];
};

export default function ChatContainer({ threadId, initialMessages }: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [streamingContent, setStreamingContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, scrollToBottom]);

  const handleSend = async (content: string, image?: File | null) => {
    setIsLoading(true);
    setError(null);
    setUploadError(null);
    setStreamingContent("");

    let imageUrl: string | undefined;

    // 画像がある場合はアップロード
    if (image) {
      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", image);
        formData.append("threadId", threadId);

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          const errorData = await uploadRes.json();
          setUploadError(errorData.error || "画像のアップロードに失敗しました");
          setIsLoading(false);
          setIsUploading(false);
          return;
        }

        const uploadData = await uploadRes.json();
        imageUrl = uploadData.imageUrl;
      } catch {
        setUploadError("画像のアップロードに失敗しました");
        setIsLoading(false);
        setIsUploading(false);
        return;
      } finally {
        setIsUploading(false);
      }
    }

    // ユーザーメッセージを即座にUIに追加
    const userMessage: Message = {
      id: crypto.randomUUID(),
      thread_id: threadId,
      role: "user",
      content,
      image_url: imageUrl ?? null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId, message: content, imageUrl }),
      });

      if (!res.ok || !res.body) {
        throw new Error("チャットAPIへのリクエストに失敗しました");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";
      let hasError = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });

        // エラーチェック
        if (chunk.includes("[ERROR]:")) {
          const errorMsg = chunk.split("[ERROR]:").pop()?.trim() || "エラーが発生しました";
          setError(errorMsg);
          hasError = true;
          break;
        }

        fullText += chunk;
        setStreamingContent(fullText);
      }

      if (!hasError && fullText) {
        // ストリーミング完了後、メッセージリストに追加
        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          thread_id: threadId,
          role: "assistant",
          content: fullText,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "エラーが発生しました";
      setError(errorMessage);
    } finally {
      setStreamingContent("");
      setIsLoading(false);
    }
  };

  const isBusy = isLoading || isUploading;

  return (
    <div className="flex h-screen flex-col bg-white">
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-2xl space-y-4">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          {streamingContent && (
            <MessageBubble
              message={{ role: "assistant", content: streamingContent }}
            />
          )}
          {error && (
            <MessageBubble
              message={{ role: "assistant", content: error }}
              isError
            />
          )}
          {isUploading && (
            <div className="flex justify-center py-2">
              <span className="text-sm text-gray-500">画像をアップロード中...</span>
            </div>
          )}
          {isLoading && !streamingContent && !isUploading && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <div className="mx-auto w-full max-w-2xl">
        {uploadError && (
          <div className="px-4 pb-2">
            <p className="text-sm text-red-600">{uploadError}</p>
          </div>
        )}
        <MessageInput onSend={handleSend} disabled={isBusy} />
      </div>
    </div>
  );
}
