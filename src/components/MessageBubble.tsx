"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Message } from "@/types/chat";
import ImageModal from "./ImageModal";

type Props = {
  message: Pick<Message, "role" | "content" | "image_url">;
  isError?: boolean;
};

export default function MessageBubble({ message, isError }: Props) {
  const isUser = message.role === "user";
  const [showModal, setShowModal] = useState(false);
  const imageUrl = message.image_url;

  return (
    <>
      <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
        <div
          className={`max-w-[75%] rounded-2xl px-4 py-3 ${
            isUser
              ? "bg-blue-500 text-white"
              : isError
                ? "bg-red-50 border border-red-200 text-red-700"
                : "bg-gray-100 text-gray-800"
          }`}
        >
          {imageUrl && (
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className={`mb-2 block cursor-pointer ${!message.content ? "mb-0" : ""}`}
            >
              <img
                src={imageUrl}
                alt="添付画像"
                className="max-h-48 rounded-lg object-cover"
              />
            </button>
          )}
          {isUser ? (
            message.content && (
              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                {message.content}
              </p>
            )
          ) : (
            <div className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-headings:my-2">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </div>
      {showModal && imageUrl && (
        <ImageModal imageUrl={imageUrl} onClose={() => setShowModal(false)} />
      )}
    </>
  );
}
