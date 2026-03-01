"use client";

import { useState, useEffect } from "react";
import { Star, Loader2 } from "lucide-react";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: { name: string | null };
}

function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange?.(star)}
          onMouseEnter={() => onChange && setHover(star)}
          onMouseLeave={() => onChange && setHover(0)}
          className={onChange ? "cursor-pointer" : "cursor-default"}
          aria-label={`${star} star`}
        >
          <Star
            size={16}
            fill={(hover || value) >= star ? "#D4AF37" : "none"}
            stroke={(hover || value) >= star ? "#D4AF37" : "#d1d5db"}
          />
        </button>
      ))}
    </div>
  );
}

export default function ReviewsSection({ productId }: { productId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetch(`/api/products/${productId}/reviews`)
      .then((r) => r.json())
      .then((d) => {
        setReviews(d.reviews ?? []);
        setAvgRating(d.avgRating ?? 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError("");

    const res = await fetch(`/api/products/${productId}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating, comment }),
    });

    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setSubmitError(data.error || "提交失败");
      return;
    }

    setReviews((prev) => [data, ...prev.filter((r) => r.id !== data.id)]);
    setSubmitted(true);
    setComment("");
  };

  return (
    <div className="mt-16 border-t border-neutral-200 pt-12">
      <div className="flex items-center gap-4 mb-8">
        <h2 className="font-serif text-2xl font-semibold text-neutral-900">用户评价</h2>
        {!loading && reviews.length > 0 && (
          <div className="flex items-center gap-2">
            <StarRating value={Math.round(avgRating)} />
            <span className="font-sans text-sm text-neutral-500">
              {avgRating.toFixed(1)} ({reviews.length} 条)
            </span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 size={20} className="animate-spin text-neutral-400" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Reviews list */}
          <div className="space-y-4">
            {reviews.length === 0 ? (
              <p className="font-sans text-sm text-neutral-400">暂无评价</p>
            ) : (
              reviews.map((r) => (
                <div key={r.id} className="border border-neutral-100 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <StarRating value={r.rating} />
                      <span className="font-sans text-xs text-neutral-500">
                        {r.user.name ?? "匿名用户"}
                      </span>
                    </div>
                    <span className="font-sans text-xs text-neutral-400">
                      {new Date(r.createdAt).toLocaleDateString("zh-CN")}
                    </span>
                  </div>
                  {r.comment && (
                    <p className="font-sans text-sm text-neutral-700 leading-relaxed">{r.comment}</p>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Submit review form */}
          <div className="bg-neutral-50 p-5">
            <h3 className="font-sans text-sm font-semibold text-neutral-700 mb-4">写评价</h3>
            {submitted ? (
              <p className="font-sans text-sm text-emerald-600">感谢您的评价！</p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block font-sans text-xs text-neutral-500 mb-1.5">评分</label>
                  <StarRating value={rating} onChange={setRating} />
                </div>
                <div>
                  <label className="block font-sans text-xs text-neutral-500 mb-1.5">评论（可选）</label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={3}
                    placeholder="分享您的使用体验…"
                    className="w-full border border-neutral-200 px-3 py-2 font-sans text-sm focus:outline-none focus:border-neutral-900 transition-colors resize-none"
                  />
                </div>
                {submitError && (
                  <p className="font-sans text-xs text-red-500">{submitError}</p>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 bg-neutral-900 text-white font-sans text-sm px-6 py-2.5 hover:bg-neutral-700 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {submitting && <Loader2 size={13} className="animate-spin" />}
                  提交评价
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
