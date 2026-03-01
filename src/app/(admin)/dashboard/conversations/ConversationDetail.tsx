"use client";

import { useState, useRef, useEffect } from "react";
import { Send, UserCheck, CheckCircle, AlertTriangle } from "lucide-react";

interface Message {
  id: string;
  role: string;
  content: string;
  toolName: string | null;
  createdAt: Date;
}

interface Conversation {
  id: string;
  status: string;
  language: string;
  summary: string | null;
  createdAt: Date;
  updatedAt: Date;
  user: { id: string; name: string | null; email: string } | null;
  messages: Message[];
}

const STATUS_STYLE: Record<string, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  ESCALATED: "bg-amber-50 text-amber-700 border-amber-200",
  RESOLVED: "bg-neutral-100 text-neutral-500 border-neutral-200",
};

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "进行中",
  ESCALATED: "待接管",
  RESOLVED: "已解决",
};

function formatTime(date: Date | string) {
  return new Date(date).toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ConversationDetail({
  conversation: initial,
}: {
  conversation: Conversation;
}) {
  const [conv, setConv] = useState(initial);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conv.messages]);

  const sendReply = async () => {
    if (!reply.trim() || sending) return;
    setSending(true);
    setError("");

    const res = await fetch(`/api/admin/conversations/${conv.id}/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: reply.trim() }),
    });

    const data = await res.json();
    setSending(false);

    if (!res.ok) {
      setError(data.error || "发送失败");
      return;
    }

    setConv((prev) => ({
      ...prev,
      status: prev.status === "ESCALATED" ? "ACTIVE" : prev.status,
      messages: [...prev.messages, data],
    }));
    setReply("");
  };

  const resolveConversation = async () => {
    setResolving(true);
    const res = await fetch(`/api/admin/conversations/${conv.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "RESOLVED" }),
    });
    setResolving(false);
    if (res.ok) {
      setConv((prev) => ({ ...prev, status: "RESOLVED" }));
    }
  };

  const isResolved = conv.status === "RESOLVED";

  return (
    <div className="grid grid-cols-3 gap-6">
      {/* Chat panel */}
      <div className="col-span-2 flex flex-col bg-white border border-neutral-200" style={{ height: "calc(100vh - 280px)" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-200 shrink-0">
          <div className="flex items-center gap-3">
            <span
              className={`inline-block border font-sans text-xs px-2 py-0.5 ${
                STATUS_STYLE[conv.status] ?? "bg-neutral-100 text-neutral-500 border-neutral-200"
              }`}
            >
              {STATUS_LABEL[conv.status] ?? conv.status}
            </span>
            <span className="font-sans text-xs text-neutral-400 uppercase">{conv.language}</span>
          </div>
          {!isResolved && (
            <button
              onClick={resolveConversation}
              disabled={resolving}
              className="flex items-center gap-1.5 font-sans text-xs text-neutral-500 hover:text-emerald-700 disabled:opacity-50 transition-colors duration-200 cursor-pointer"
            >
              <CheckCircle size={13} />
              标记已解决
            </button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {conv.messages.map((msg) => {
            const isUser = msg.role === "USER";
            const isHuman = msg.toolName === "human_agent";
            return (
              <div
                key={msg.id}
                className={`flex ${isUser ? "justify-start" : "justify-end"}`}
              >
                <div className={`max-w-[75%] ${isUser ? "" : ""}`}>
                  {!isUser && (
                    <p className="font-sans text-xs text-neutral-400 mb-1 text-right">
                      {isHuman ? "人工客服" : "AI 助手"}
                    </p>
                  )}
                  <div
                    className={`px-4 py-2.5 font-sans text-sm leading-relaxed ${
                      isUser
                        ? "bg-neutral-100 text-neutral-800"
                        : isHuman
                        ? "bg-[#D4AF37] text-white"
                        : "bg-neutral-900 text-white"
                    }`}
                  >
                    {msg.content}
                  </div>
                  <p className={`font-sans text-xs text-neutral-400 mt-1 ${isUser ? "" : "text-right"}`}>
                    {formatTime(msg.createdAt)}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Reply input */}
        {!isResolved ? (
          <div className="border-t border-neutral-200 px-4 py-3 shrink-0">
            {error && (
              <p className="font-sans text-xs text-red-500 mb-2 flex items-center gap-1">
                <AlertTriangle size={12} /> {error}
              </p>
            )}
            <div className="flex gap-2">
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendReply();
                  }
                }}
                rows={2}
                placeholder="以人工客服身份回复… (Enter 发送，Shift+Enter 换行)"
                className="flex-1 border border-neutral-200 px-3 py-2 font-sans text-sm focus:outline-none focus:border-neutral-900 transition-colors resize-none"
              />
              <button
                onClick={sendReply}
                disabled={sending || !reply.trim()}
                className="flex items-center gap-1.5 bg-neutral-900 text-white font-sans text-sm px-4 hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-200 cursor-pointer shrink-0"
              >
                <Send size={14} />
                发送
              </button>
            </div>
          </div>
        ) : (
          <div className="border-t border-neutral-200 px-4 py-3 shrink-0 text-center">
            <p className="font-sans text-xs text-neutral-400">此对话已解决</p>
          </div>
        )}
      </div>

      {/* Sidebar */}
      <div className="space-y-4">
        {/* User info */}
        <div className="bg-white border border-neutral-200 p-5">
          <h3 className="font-sans text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-4">
            用户信息
          </h3>
          {conv.user ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <UserCheck size={14} className="text-neutral-400 shrink-0" />
                <span className="font-sans text-sm text-neutral-900">
                  {conv.user.name ?? "未设置姓名"}
                </span>
              </div>
              <p className="font-sans text-xs text-neutral-500 pl-5">{conv.user.email}</p>
            </div>
          ) : (
            <p className="font-sans text-sm text-neutral-400">匿名用户</p>
          )}
        </div>

        {/* Summary */}
        {conv.summary && (
          <div className="bg-amber-50 border border-amber-200 p-5">
            <h3 className="font-sans text-xs font-semibold text-amber-700 uppercase tracking-widest mb-3">
              AI 摘要
            </h3>
            <p className="font-sans text-sm text-amber-900 leading-relaxed">{conv.summary}</p>
          </div>
        )}

        {/* Meta */}
        <div className="bg-white border border-neutral-200 p-5">
          <h3 className="font-sans text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-4">
            对话信息
          </h3>
          <dl className="space-y-2">
            <div className="flex justify-between">
              <dt className="font-sans text-xs text-neutral-400">消息数</dt>
              <dd className="font-mono text-xs text-neutral-700">{conv.messages.length}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="font-sans text-xs text-neutral-400">语言</dt>
              <dd className="font-sans text-xs text-neutral-700 uppercase">{conv.language}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="font-sans text-xs text-neutral-400">创建时间</dt>
              <dd className="font-sans text-xs text-neutral-700">
                {new Date(conv.createdAt).toLocaleDateString("zh-CN")}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
