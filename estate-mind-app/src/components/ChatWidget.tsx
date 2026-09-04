"use client";

import { useState, useRef, useEffect, Fragment } from "react";
import { chatService } from "@/services/chatService";
import { useAuth } from "@/contexts/AuthContext";

interface Message {
  role: "user" | "assistant";
  text: string;
}

function renderMarkdown(text: string) {
  const lines = text.split("\n");

  return lines.map((line, i) => {
    const trimmed = line.trim();
    const isListItem = /^(\d+\.|[-*])\s+/.test(trimmed);
    const content = isListItem ? trimmed.replace(/^(\d+\.|[-*])\s+/, "") : line;

    const parts = content.split(/(\*\*[^*]+\*\*)/g).map((part, j) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={j}>{part.slice(2, -2)}</strong>;
      }

      return <Fragment key={j}>{part}</Fragment>;
    });

    if (isListItem) {
      return (
        <div key={i} className="flex gap-1.5 pl-1">
          <span className="text-gray-400">•</span>
          <span>{parts}</span>
        </div>
      );
    }

    if (trimmed === "") {
      return <div key={i} className="h-2" />;
    }

    return <p key={i}>{parts}</p>;
  });
}

export default function ChatWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "Xin chào! Mình có thể giúp gì cho bạn về bất động sản?",
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sessionId, setSessionId] = useState<number | undefined>(undefined);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();

    const question = input.trim();

    if (!question || sending) {
      return;
    }

    setMessages((m) => [...m, { role: "user", text: question }]);
    setInput("");
    setSending(true);

    try {
      const res = await chatService.ask(question, sessionId);

      setSessionId(res.sessionId);
      setMessages((m) => [...m, { role: "assistant", text: res.answer }]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text: "Xin lỗi, mình đang gặp sự cố kết nối. Bạn thử lại sau nhé.",
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  if (user?.userRole === "ROLE_ADMIN" || user?.userRole === "ROLE_SELLER") {
    return null;
  }

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open && (
        <div className="mb-3 flex h-[28rem] w-96 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl">
          <div className="flex items-center justify-between bg-red-500 px-4 py-3 font-semibold text-white">
            <span>Hỗ trợ AI</span>

            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Đóng cửa sổ hỗ trợ AI"
              className="text-white/80 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto px-3 py-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[90%] rounded-lg px-3 py-2 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "ml-auto bg-red-500 text-white"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {m.role === "assistant" ? renderMarkdown(m.text) : m.text}
              </div>
            ))}

            {sending && (
              <div className="px-1 text-xs text-gray-400">Đang trả lời...</div>
            )}

            <div ref={bottomRef} />
          </div>

          <form
            onSubmit={handleSend}
            className="flex gap-2 border-t border-gray-100 p-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nhập câu hỏi..."
              aria-label="Nhập câu hỏi cho trợ lý AI"
              className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-red-500 focus:outline-none"
            />

            <button
              type="submit"
              disabled={sending}
              className="rounded-md bg-red-500 px-3 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50"
            >
              Gửi
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500 text-2xl text-white shadow-lg transition-transform hover:scale-105 hover:bg-red-600"
        aria-label={open ? "Đóng chat hỗ trợ" : "Mở chat hỗ trợ"}
      >
        {open ? "✕" : "💬"}
      </button>
    </div>
  );
}
