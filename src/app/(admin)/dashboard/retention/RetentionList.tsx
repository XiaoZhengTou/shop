"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Mail, Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

interface Job {
  id: string;
  type: string;
  status: string;
  channel: string;
  scheduledAt: Date;
  sentAt: Date | null;
  payload: unknown;
  createdAt: Date;
  user: { id: string; name: string | null; email: string };
}

const TYPE_LABEL: Record<string, string> = {
  ABANDONED_CART_1: "第1次 (30min)",
  ABANDONED_CART_2: "第2次 (24h)",
  ABANDONED_CART_3: "第3次 (72h)",
};

const STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-neutral-100 text-neutral-500 border-neutral-200",
  SENT: "bg-emerald-50 text-emerald-700 border-emerald-200",
  FAILED: "bg-red-50 text-red-600 border-red-200",
  CANCELLED: "bg-neutral-100 text-neutral-400 border-neutral-200",
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: "待发送",
  SENT: "已发送",
  FAILED: "失败",
  CANCELLED: "已取消",
};

function formatTime(date: Date | string) {
  return new Date(date).toLocaleString("zh-CN", {
    month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function JobRow({ job }: { job: Job }) {
  const [expanded, setExpanded] = useState(false);
  const payload = job.payload as {
    touchNumber?: number;
    cartItems?: { titleZh: string; price: number; quantity: number }[];
    generatedContent?: {
      subjectZh: string; subjectEn: string;
      bodyZh: string; bodyEn: string;
      couponDiscount: number; segment: string;
    };
    couponCode?: string;
    needsApproval?: boolean;
  };

  const isNeedsApproval = payload?.needsApproval && job.status === "PENDING";

  return (
    <>
      <tr className={`hover:bg-neutral-50 transition-colors duration-150 ${isNeedsApproval ? "bg-amber-50/40" : ""}`}>
        {/* User */}
        <td className="px-4 py-4">
          <p className="font-sans text-sm text-neutral-900">{job.user.name ?? "—"}</p>
          <p className="font-sans text-xs text-neutral-400">{job.user.email}</p>
        </td>
        {/* Type */}
        <td className="px-4 py-4">
          <span className="font-sans text-xs text-neutral-600">{TYPE_LABEL[job.type] ?? job.type}</span>
        </td>
        {/* Status */}
        <td className="px-4 py-4">
          <div className="flex flex-col gap-1">
            <span className={`inline-block border font-sans text-xs px-2 py-0.5 w-fit ${STATUS_STYLE[job.status] ?? "bg-neutral-100 text-neutral-500 border-neutral-200"}`}>
              {STATUS_LABEL[job.status] ?? job.status}
            </span>
            {isNeedsApproval && (
              <span className="inline-flex items-center gap-1 font-sans text-xs text-amber-600">
                <AlertTriangle size={10} /> 需审批
              </span>
            )}
          </div>
        </td>
        {/* Segment */}
        <td className="px-4 py-4">
          <span className="font-sans text-xs text-neutral-500 capitalize">
            {payload?.generatedContent?.segment ?? "—"}
          </span>
        </td>
        {/* Coupon */}
        <td className="px-4 py-4">
          {payload?.couponCode ? (
            <span className="font-mono text-xs text-[#D4AF37]">{payload.couponCode}</span>
          ) : payload?.generatedContent?.couponDiscount ? (
            <span className="font-sans text-xs text-neutral-400">{payload.generatedContent.couponDiscount}% off</span>
          ) : (
            <span className="font-sans text-xs text-neutral-300">—</span>
          )}
        </td>
        {/* Scheduled */}
        <td className="px-4 py-4">
          <div className="flex items-center gap-1 text-neutral-400">
            <Clock size={11} />
            <span className="font-sans text-xs">{formatTime(job.scheduledAt)}</span>
          </div>
        </td>
        {/* Expand */}
        <td className="px-4 py-4">
          {payload?.generatedContent && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 font-sans text-xs text-neutral-400 hover:text-neutral-900 transition-colors cursor-pointer"
            >
              {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              {expanded ? "收起" : "查看"}
            </button>
          )}
        </td>
      </tr>

      {/* Expanded content */}
      {expanded && payload?.generatedContent && (
        <tr className="bg-neutral-50">
          <td colSpan={7} className="px-6 py-4">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="font-sans text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Mail size={11} /> 中文邮件
                </p>
                <p className="font-sans text-sm font-medium text-neutral-900 mb-1">
                  {payload.generatedContent.subjectZh}
                </p>
                <p className="font-sans text-xs text-neutral-600 whitespace-pre-line leading-relaxed">
                  {payload.generatedContent.bodyZh}
                </p>
              </div>
              <div>
                <p className="font-sans text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Mail size={11} /> English Email
                </p>
                <p className="font-sans text-sm font-medium text-neutral-900 mb-1">
                  {payload.generatedContent.subjectEn}
                </p>
                <p className="font-sans text-xs text-neutral-600 whitespace-pre-line leading-relaxed">
                  {payload.generatedContent.bodyEn}
                </p>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function RetentionList({ jobs }: { jobs: Job[] }) {
  const [filter, setFilter] = useState<"all" | "PENDING" | "SENT" | "FAILED">("all");

  const filtered = filter === "all" ? jobs : jobs.filter((j) => j.status === filter);

  const tabs = [
    { key: "all" as const, label: "全部", count: jobs.length },
    { key: "PENDING" as const, label: "待发送", count: jobs.filter((j) => j.status === "PENDING").length },
    { key: "SENT" as const, label: "已发送", count: jobs.filter((j) => j.status === "SENT").length },
    { key: "FAILED" as const, label: "失败", count: jobs.filter((j) => j.status === "FAILED").length },
  ];

  return (
    <div>
      <div className="flex gap-0 border-b border-neutral-200 mb-0">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2.5 font-sans text-sm transition-colors duration-200 cursor-pointer border-b-2 -mb-px ${
              filter === tab.key
                ? "border-neutral-900 text-neutral-900 font-medium"
                : "border-transparent text-neutral-500 hover:text-neutral-700"
            }`}
          >
            {tab.label}
            <span className={`ml-2 font-mono text-xs px-1.5 py-0.5 rounded-sm ${filter === tab.key ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-500"}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      <div className="bg-white border border-neutral-200 border-t-0 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="font-sans text-sm text-neutral-400">暂无记录</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50">
                  {["用户", "触达次数", "状态", "用户分层", "优惠券", "计划时间", ""].map((h) => (
                    <th key={h} className="px-4 py-3 font-sans text-xs font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filtered.map((job) => <JobRow key={job.id} job={job} />)}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
