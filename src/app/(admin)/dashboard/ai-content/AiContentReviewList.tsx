"use client";

import { useState } from "react";
import { Check, X, ChevronDown, ChevronUp } from "lucide-react";
import { useRouter } from "next/navigation";

interface Product {
  id: string;
  titleZh: string;
  sku: string;
}

interface AiContentItem {
  id: string;
  type: string;
  market: string;
  status: string;
  content: unknown;
  reviewNote: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
  product: Product | null;
}

interface ListingContent {
  zh?: { title: string; description: string; tags: string[] };
  en?: { title: string; description: string; tags: string[] };
}

const TYPE_LABEL: Record<string, string> = {
  PRODUCT_LISTING: "商品文案",
  MARKETING_COPY: "营销文案",
  VIDEO_SCRIPT: "视频脚本",
  EMAIL_TEMPLATE: "邮件模板",
};

const STATUS_STYLE: Record<string, string> = {
  PENDING_REVIEW: "bg-amber-50 text-amber-700 border-amber-200",
  APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  REJECTED: "bg-red-50 text-red-600 border-red-200",
};

const STATUS_LABEL: Record<string, string> = {
  PENDING_REVIEW: "待审核",
  APPROVED: "已批准",
  REJECTED: "已拒绝",
};

function ContentCard({ item, onReview }: {
  item: AiContentItem;
  onReview?: (id: string, action: "approve" | "reject") => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);
  const content = item.content as ListingContent;
  const isPending = item.status === "PENDING_REVIEW";

  const handleAction = async (action: "approve" | "reject") => {
    if (!onReview) return;
    setLoading(action);
    await onReview(item.id, action);
    setLoading(null);
  };

  return (
    <div className="bg-white border border-neutral-200">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3 min-w-0">
          <span
            className={`shrink-0 inline-block border font-sans text-xs px-2 py-0.5 ${STATUS_STYLE[item.status] || ""}`}
          >
            {STATUS_LABEL[item.status] || item.status}
          </span>
          <span className="font-sans text-xs text-neutral-400 shrink-0">
            {TYPE_LABEL[item.type] || item.type}
          </span>
          {item.product && (
            <span className="font-sans text-sm text-neutral-700 truncate">
              {item.product.titleZh}
              <span className="text-neutral-400 ml-1">#{item.product.sku}</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-4">
          <span className="font-sans text-xs text-neutral-400">
            {new Date(item.createdAt).toLocaleDateString("zh-CN")}
          </span>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer"
            aria-label={expanded ? "收起" : "展开"}
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Content preview (expanded) */}
      {expanded && (
        <div className="border-t border-neutral-100 px-5 py-4 space-y-4">
          {content.zh && (
            <div>
              <p className="font-sans text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">中文</p>
              <p className="font-sans text-sm font-medium text-neutral-900">{content.zh.title}</p>
              <p className="mt-1 font-sans text-sm text-neutral-600 leading-relaxed whitespace-pre-wrap">
                {content.zh.description}
              </p>
              {content.zh.tags?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {content.zh.tags.map((tag) => (
                    <span key={tag} className="font-sans text-xs text-neutral-500 border border-neutral-200 px-2 py-0.5">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
          {content.en && (
            <div className={content.zh ? "border-t border-neutral-100 pt-4" : ""}>
              <p className="font-sans text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">English</p>
              <p className="font-sans text-sm font-medium text-neutral-900">{content.en.title}</p>
              <p className="mt-1 font-sans text-sm text-neutral-600 leading-relaxed whitespace-pre-wrap">
                {content.en.description}
              </p>
              {content.en.tags?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {content.en.tags.map((tag) => (
                    <span key={tag} className="font-sans text-xs text-neutral-500 border border-neutral-200 px-2 py-0.5">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Review note */}
          {item.reviewNote && (
            <p className="font-sans text-xs text-neutral-500 italic border-t border-neutral-100 pt-3">
              审核备注：{item.reviewNote}
            </p>
          )}

          {/* Action buttons for pending items */}
          {isPending && onReview && (
            <div className="flex gap-3 pt-2 border-t border-neutral-100">
              <button
                onClick={() => handleAction("approve")}
                disabled={loading !== null}
                className="flex items-center gap-1.5 bg-emerald-600 text-white font-sans text-sm px-4 py-2 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <Check size={14} />
                {loading === "approve" ? "处理中…" : "批准并更新商品"}
              </button>
              <button
                onClick={() => handleAction("reject")}
                disabled={loading !== null}
                className="flex items-center gap-1.5 border border-neutral-200 text-neutral-600 font-sans text-sm px-4 py-2 hover:border-red-300 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <X size={14} />
                {loading === "reject" ? "处理中…" : "拒绝"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AiContentReviewList({
  pending,
  reviewed,
}: {
  pending: AiContentItem[];
  reviewed: AiContentItem[];
}) {
  const router = useRouter();
  const [optimisticPending, setOptimisticPending] = useState(pending);
  const [optimisticReviewed, setOptimisticReviewed] = useState(reviewed);

  const handleReview = async (id: string, action: "approve" | "reject") => {
    const res = await fetch(`/api/admin/ai-content/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });

    if (res.ok) {
      const item = optimisticPending.find((i) => i.id === id);
      if (item) {
        const updated = { ...item, status: action === "approve" ? "APPROVED" : "REJECTED" };
        setOptimisticPending((prev) => prev.filter((i) => i.id !== id));
        setOptimisticReviewed((prev) => [updated, ...prev]);
      }
      router.refresh();
    }
  };

  return (
    <div className="space-y-8">
      {/* Pending */}
      <section>
        <h2 className="font-sans text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-3">
          待审核 ({optimisticPending.length})
        </h2>
        {optimisticPending.length === 0 ? (
          <div className="bg-white border border-neutral-200 px-6 py-10 text-center">
            <p className="font-sans text-sm text-neutral-400">暂无待审核内容</p>
          </div>
        ) : (
          <div className="space-y-2">
            {optimisticPending.map((item) => (
              <ContentCard key={item.id} item={item} onReview={handleReview} />
            ))}
          </div>
        )}
      </section>

      {/* Reviewed */}
      {optimisticReviewed.length > 0 && (
        <section>
          <h2 className="font-sans text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-3">
            已审核 ({optimisticReviewed.length})
          </h2>
          <div className="space-y-2">
            {optimisticReviewed.map((item) => (
              <ContentCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
