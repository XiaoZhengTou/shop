"use client";

import { useState } from "react";
import { MessageSquare, User, Clock, ChevronRight } from "lucide-react";

interface ConversationItem {
  id: string;
  status: string;
  language: string;
  summary: string | null;
  createdAt: Date;
  updatedAt: Date;
  user: { id: string; name: string | null; email: string } | null;
  messages: { content: string; role: string; createdAt: Date }[];
  _count: { messages: number };
}

interface Counts {
  total: number;
  active: number;
  escalated: number;
  resolved: number;
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

type TabFilter = "all" | "ACTIVE" | "ESCALATED" | "RESOLVED";

function formatTime(date: Date | string) {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "刚刚";
  if (mins < 60) return `${mins}分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}小时前`;
  return d.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
}

export default function ConversationList({
  conversations,
  counts,
}: {
  conversations: ConversationItem[];
  counts: Counts;
}) {
  const [activeTab, setActiveTab] = useState<TabFilter>("all");

  const tabs: { key: TabFilter; label: string; count: number }[] = [
    { key: "all", label: "全部", count: counts.total },
    { key: "ESCALATED", label: "待接管", count: counts.escalated },
    { key: "ACTIVE", label: "进行中", count: counts.active },
    { key: "RESOLVED", label: "已解决", count: counts.resolved },
  ];

  const filtered =
    activeTab === "all"
      ? conversations
      : conversations.filter((c) => c.status === activeTab);

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-0 border-b border-neutral-200 mb-0">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 font-sans text-sm transition-colors duration-200 cursor-pointer border-b-2 -mb-px ${
              activeTab === tab.key
                ? "border-neutral-900 text-neutral-900 font-medium"
                : "border-transparent text-neutral-500 hover:text-neutral-700"
            }`}
          >
            {tab.label}
            <span
              className={`ml-2 font-mono text-xs px-1.5 py-0.5 rounded-sm ${
                activeTab === tab.key
                  ? tab.key === "ESCALATED"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-neutral-900 text-white"
                  : "bg-neutral-100 text-neutral-500"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-neutral-200 border-t-0 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <MessageSquare size={32} className="mx-auto text-neutral-300 mb-3" />
            <p className="font-sans text-sm text-neutral-400">暂无对话记录</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50">
                  {["用户", "最新消息", "消息数", "语言", "状态", "时间", ""].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 font-sans text-xs font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filtered.map((conv) => {
                  const latestMsg = conv.messages[0];
                  return (
                    <tr
                      key={conv.id}
                      className={`hover:bg-neutral-50 transition-colors duration-150 ${
                        conv.status === "ESCALATED" ? "bg-amber-50/30" : ""
                      }`}
                    >
                      {/* User */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-neutral-200 flex items-center justify-center shrink-0">
                            <User size={12} className="text-neutral-500" />
                          </div>
                          <div className="min-w-0">
                            {conv.user ? (
                              <>
                                <p className="font-sans text-sm text-neutral-900 truncate max-w-[120px]">
                                  {conv.user.name ?? "—"}
                                </p>
                                <p className="font-sans text-xs text-neutral-400 truncate max-w-[120px]">
                                  {conv.user.email}
                                </p>
                              </>
                            ) : (
                              <p className="font-sans text-sm text-neutral-400">匿名用户</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Latest message */}
                      <td className="px-4 py-4 max-w-xs">
                        {latestMsg ? (
                          <p className="font-sans text-sm text-neutral-600 truncate">
                            {latestMsg.role === "USER" ? "👤 " : "🤖 "}
                            {latestMsg.content}
                          </p>
                        ) : (
                          <span className="font-sans text-sm text-neutral-300">—</span>
                        )}
                      </td>

                      {/* Message count */}
                      <td className="px-4 py-4">
                        <span className="font-mono text-sm text-neutral-500">
                          {conv._count.messages}
                        </span>
                      </td>

                      {/* Language */}
                      <td className="px-4 py-4">
                        <span className="font-sans text-xs text-neutral-500 uppercase">
                          {conv.language}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4">
                        <span
                          className={`inline-block border font-sans text-xs px-2 py-0.5 ${
                            STATUS_STYLE[conv.status] ?? "bg-neutral-100 text-neutral-500 border-neutral-200"
                          }`}
                        >
                          {STATUS_LABEL[conv.status] ?? conv.status}
                        </span>
                      </td>

                      {/* Time */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1 text-neutral-400">
                          <Clock size={12} />
                          <span className="font-sans text-xs">
                            {formatTime(conv.updatedAt)}
                          </span>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="px-4 py-4">
                        <a
                          href={`/dashboard/conversations/${conv.id}`}
                          className="flex items-center gap-1 font-sans text-xs text-neutral-400 hover:text-neutral-900 transition-colors duration-200"
                        >
                          查看
                          <ChevronRight size={12} />
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
