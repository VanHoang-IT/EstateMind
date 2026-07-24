"use client";

import { useState, useRef, useEffect, Fragment } from "react";
import { chatService } from "@/services/chatService";

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
    if (!question || sending) return;

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

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open && (
        <div className="w-96 h-[28rem] bg-white border border-gray-200 rounded-lg shadow-xl flex flex-col mb-3 overflow-hidden">
          <div className="bg-red-500 text-white px-4 py-3 font-semibold flex justify-between items-center">
            <span>Hỗ trợ AI</span>
            <button
              onClick={() => setOpen(false)}
              className="text-white/80 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`text-sm px-3 py-2 rounded-lg max-w-[90%] leading-relaxed ${
                  m.role === "user"
                    ? "bg-red-500 text-white ml-auto"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {m.role === "assistant" ? renderMarkdown(m.text) : m.text}
              </div>
            ))}
            {sending && (
              <div className="text-xs text-gray-400 px-1">Đang trả lời...</div>
            )}
            <div ref={bottomRef} />
          </div>

          <form
            onSubmit={handleSend}
            className="border-t border-gray-100 p-2 flex gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nhập câu hỏi..."
              className="flex-1 text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:border-red-500"
            />
            <button
              type="submit"
              disabled={sending}
              className="bg-red-500 hover:bg-red-600 text-white text-sm font-medium px-3 rounded-md disabled:opacity-50"
            >
              Gửi
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg flex items-center justify-center text-2xl transition-transform hover:scale-105"
        aria-label="Mở chat hỗ trợ"
      >
        {open ? "✕" : "💬"}
      </button>
    </div>
  );
}
