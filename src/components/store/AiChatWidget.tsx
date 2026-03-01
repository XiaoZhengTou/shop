"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2, AlertCircle } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AiChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "您好！我是 StyleAI 的AI助手，有什么可以帮您的吗？\n\nHello! I'm StyleAI's AI assistant. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [needsEscalation, setNeedsEscalation] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMessage: Message = { role: "user", content: trimmed };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);
    setNeedsEscalation(false);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages,
          language: "zh",
          conversationId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply },
      ]);

      if (data.conversationId && !conversationId) {
        setConversationId(data.conversationId);
      }

      if (data.needsEscalation) {
        setNeedsEscalation(true);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "抱歉，暂时无法连接到客服系统，请稍后再试。",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Chat Panel */}
      {isOpen && (
        <div
          className="fixed bottom-24 right-4 md:right-8 w-[calc(100vw-2rem)] max-w-sm z-40 flex flex-col rounded-none overflow-hidden shadow-2xl"
          style={{
            backdropFilter: "blur(20px) saturate(180%)",
            background: "rgba(255,255,255,0.92)",
            border: "1px solid rgba(229,229,229,0.8)",
            height: "480px",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 bg-neutral-900">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
              <div>
                <p className="font-sans text-sm font-medium text-white">AI 智能客服</p>
                <p className="font-sans text-xs text-neutral-400">StyleAI Assistant</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
              className="text-neutral-400 hover:text-white transition-colors duration-200 cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] px-3 py-2 text-sm font-sans leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-neutral-900 text-white rounded-none"
                      : "bg-white border border-neutral-200 text-neutral-800 rounded-none"
                  }`}
                  style={
                    msg.role === "assistant"
                      ? {
                          backdropFilter: "blur(10px)",
                          background: "rgba(255,255,255,0.9)",
                        }
                      : undefined
                  }
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div
                  className="px-3 py-2 border border-neutral-200"
                  style={{ background: "rgba(255,255,255,0.9)" }}
                >
                  <Loader2 size={16} className="animate-spin text-neutral-400" />
                </div>
              </div>
            )}

            {/* Escalation notice */}
            {needsEscalation && (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 p-3">
                <AlertCircle size={14} className="text-amber-500 mt-0.5 shrink-0" />
                <p className="font-sans text-xs text-amber-700">
                  您的问题已转接至人工客服，请稍等片刻。工作时间：9:00-22:00
                </p>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-neutral-200 p-3 bg-white/80">
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="输入消息... (Enter 发送)"
                rows={1}
                className="flex-1 resize-none font-sans text-sm text-neutral-900 placeholder:text-neutral-400 border border-neutral-200 px-3 py-2 outline-none focus:border-neutral-900 transition-colors duration-200"
                style={{ minHeight: "36px", maxHeight: "100px" }}
              />
              <button
                onClick={sendMessage}
                disabled={isLoading || !input.trim()}
                aria-label="Send message"
                className="bg-neutral-900 text-white p-2 hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-200 cursor-pointer shrink-0"
              >
                <Send size={16} />
              </button>
            </div>
            <p className="mt-2 font-sans text-xs text-neutral-400">
              AI 回复仅供参考，复杂问题建议咨询人工客服
            </p>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open AI chat support"
        className="fixed bottom-6 right-4 md:right-8 z-50 w-14 h-14 bg-neutral-900 text-white flex items-center justify-center hover:bg-neutral-700 transition-colors duration-200 cursor-pointer shadow-lg"
        style={{
          backdropFilter: "blur(8px)",
        }}
      >
        {isOpen ? <X size={20} /> : <MessageCircle size={20} />}
      </button>
    </>
  );
}
