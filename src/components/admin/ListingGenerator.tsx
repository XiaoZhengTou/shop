"use client";

import { useState } from "react";
import { Loader2, Sparkles, CheckCircle, AlertTriangle, Copy, ChevronDown } from "lucide-react";

interface ListingResult {
  zh?: { title: string; description: string; tags: string[] };
  en?: { title: string; description: string; tags: string[] };
  market: "zh" | "en" | "both";
}

interface ComplianceIssue {
  level: "error" | "warning";
  rule: string;
  matched: string;
  suggestion: string;
}

interface ComplianceResult {
  passed: boolean;
  issues: ComplianceIssue[];
}

interface ApiResponse {
  success: boolean;
  listing: ListingResult;
  compliance: {
    zh?: ComplianceResult;
    en?: ComplianceResult;
    allPassed: boolean;
  };
  savedId?: string;
}

export default function ListingGenerator() {
  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState("dress");
  const [features, setFeatures] = useState("");
  const [priceHint, setPriceHint] = useState("");
  const [targetMarket, setTargetMarket] = useState<"zh" | "en" | "both">("both");
  const [saveAsDraft, setSaveAsDraft] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const categories = ["dress", "tops", "outerwear", "pants", "accessories", "shoes"];

  const handleGenerate = async () => {
    if (!productName.trim() || !features.trim()) {
      setError("请填写商品名称和核心卖点");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/ai/listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: productName.trim(),
          category,
          keyFeatures: features.split(/[,，\n]/).map((f) => f.trim()).filter(Boolean),
          targetMarket,
          priceHint: priceHint.trim() || undefined,
          saveAsDraft,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || `HTTP ${response.status}`);
      }

      const data: ApiResponse = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "生成失败，请重试");
    } finally {
      setIsLoading(false);
    }
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Input Panel */}
      <div className="bg-white border border-neutral-200 rounded-none p-6 space-y-5">
        <h2 className="font-sans text-base font-semibold text-neutral-900">
          商品信息
        </h2>

        {/* Product Name */}
        <div>
          <label className="block font-sans text-xs font-medium text-neutral-700 mb-2">
            商品名称 *
          </label>
          <input
            type="text"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="例：优雅纯色A字裙"
            className="w-full font-sans text-sm border border-neutral-200 px-3 py-2 outline-none focus:border-neutral-900 transition-colors duration-200"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block font-sans text-xs font-medium text-neutral-700 mb-2">
            品类
          </label>
          <div className="relative">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full appearance-none font-sans text-sm border border-neutral-200 px-3 py-2 outline-none focus:border-neutral-900 transition-colors duration-200 cursor-pointer bg-white"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
          </div>
        </div>

        {/* Key Features */}
        <div>
          <label className="block font-sans text-xs font-medium text-neutral-700 mb-2">
            核心卖点 * <span className="text-neutral-400 font-normal">（用逗号或换行分隔）</span>
          </label>
          <textarea
            value={features}
            onChange={(e) => setFeatures(e.target.value)}
            placeholder="例：高品质面料，垂感好&#10;A字版型，显瘦&#10;多场合适用"
            rows={4}
            className="w-full font-sans text-sm border border-neutral-200 px-3 py-2 outline-none focus:border-neutral-900 transition-colors duration-200 resize-none"
          />
        </div>

        {/* Price Hint */}
        <div>
          <label className="block font-sans text-xs font-medium text-neutral-700 mb-2">
            价格参考 <span className="text-neutral-400 font-normal">（可选）</span>
          </label>
          <input
            type="text"
            value={priceHint}
            onChange={(e) => setPriceHint(e.target.value)}
            placeholder="例：¥299 / $45"
            className="w-full font-sans text-sm border border-neutral-200 px-3 py-2 outline-none focus:border-neutral-900 transition-colors duration-200"
          />
        </div>

        {/* Target Market */}
        <div>
          <label className="block font-sans text-xs font-medium text-neutral-700 mb-2">
            目标市场
          </label>
          <div className="flex gap-2">
            {(["zh", "en", "both"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setTargetMarket(m)}
                className={`flex-1 font-sans text-xs py-2 border transition-colors duration-200 cursor-pointer ${
                  targetMarket === m
                    ? "bg-neutral-900 text-white border-neutral-900"
                    : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-900"
                }`}
              >
                {m === "zh" ? "国内 ZH" : m === "en" ? "跨境 EN" : "双语 Both"}
              </button>
            ))}
          </div>
        </div>

        {/* Save as Draft */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="saveAsDraft"
            checked={saveAsDraft}
            onChange={(e) => setSaveAsDraft(e.target.checked)}
            className="cursor-pointer"
          />
          <label htmlFor="saveAsDraft" className="font-sans text-sm text-neutral-700 cursor-pointer">
            保存为草稿（待人工审核）
          </label>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 p-3">
            <AlertTriangle size={14} className="text-red-500 shrink-0" />
            <p className="font-sans text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 bg-neutral-900 text-white font-sans text-sm font-medium py-3 hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              AI 生成中...
            </>
          ) : (
            <>
              <Sparkles size={16} />
              生成文案
            </>
          )}
        </button>
      </div>

      {/* Result Panel */}
      <div
        className="rounded-none p-6 space-y-5 min-h-[400px]"
        style={{
          backdropFilter: "blur(20px) saturate(180%)",
          background: "rgba(255,255,255,0.85)",
          border: "1px solid rgba(255,255,255,0.6)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
        }}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-sans text-base font-semibold text-neutral-900">
            AI 生成结果
          </h2>
          {result?.compliance.allPassed !== undefined && (
            <div
              className={`flex items-center gap-1.5 font-sans text-xs font-medium px-2 py-1 ${
                result.compliance.allPassed
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {result.compliance.allPassed ? (
                <CheckCircle size={12} />
              ) : (
                <AlertTriangle size={12} />
              )}
              {result.compliance.allPassed ? "合规通过" : "合规警告"}
            </div>
          )}
        </div>

        {!result && !isLoading && (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Sparkles size={32} className="text-neutral-200 mb-4" />
            <p className="font-sans text-sm text-neutral-400">
              填写左侧信息，点击「生成文案」
            </p>
          </div>
        )}

        {isLoading && (
          <div className="flex flex-col items-center justify-center h-64">
            <Loader2 size={32} className="text-neutral-300 animate-spin mb-4" />
            <p className="font-sans text-sm text-neutral-400">AI 正在生成文案...</p>
          </div>
        )}

        {result && !isLoading && (
          <div className="space-y-6">
            {/* ZH Result */}
            {result.listing.zh && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="font-sans text-xs font-semibold text-neutral-900 bg-neutral-100 px-2 py-0.5">
                    中文
                  </span>
                  {result.compliance.zh && !result.compliance.zh.passed && (
                    <span className="font-sans text-xs text-red-600">
                      ⚠ {result.compliance.zh.issues.length} 个合规问题
                    </span>
                  )}
                </div>
                <div className="bg-white border border-neutral-200 p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="font-sans text-xs text-neutral-400 mb-1">标题</p>
                      <p className="font-sans text-sm font-medium text-neutral-900">
                        {result.listing.zh.title}
                      </p>
                    </div>
                    <button
                      onClick={() => copyText(result.listing.zh!.title)}
                      aria-label="Copy title"
                      className="text-neutral-400 hover:text-neutral-900 transition-colors duration-200 cursor-pointer shrink-0"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                  <hr className="border-neutral-100" />
                  <div>
                    <p className="font-sans text-xs text-neutral-400 mb-1">描述</p>
                    <p className="font-sans text-xs text-neutral-700 leading-relaxed">
                      {result.listing.zh.description}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {result.listing.zh.tags.map((tag) => (
                      <span key={tag} className="font-sans text-xs text-neutral-500 border border-neutral-200 px-2 py-0.5">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* EN Result */}
            {result.listing.en && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="font-sans text-xs font-semibold text-neutral-900 bg-neutral-100 px-2 py-0.5">
                    English
                  </span>
                  {result.compliance.en && !result.compliance.en.passed && (
                    <span className="font-sans text-xs text-red-600">
                      ⚠ {result.compliance.en.issues.length} compliance issues
                    </span>
                  )}
                </div>
                <div className="bg-white border border-neutral-200 p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="font-sans text-xs text-neutral-400 mb-1">Title</p>
                      <p className="font-sans text-sm font-medium text-neutral-900">
                        {result.listing.en.title}
                      </p>
                    </div>
                    <button
                      onClick={() => copyText(result.listing.en!.title)}
                      aria-label="Copy title"
                      className="text-neutral-400 hover:text-neutral-900 transition-colors duration-200 cursor-pointer shrink-0"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                  <hr className="border-neutral-100" />
                  <div>
                    <p className="font-sans text-xs text-neutral-400 mb-1">Description</p>
                    <p className="font-sans text-xs text-neutral-700 leading-relaxed">
                      {result.listing.en.description}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {result.listing.en.tags.map((tag) => (
                      <span key={tag} className="font-sans text-xs text-neutral-500 border border-neutral-200 px-2 py-0.5">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Saved indicator */}
            {result.savedId && (
              <div className="flex items-center gap-2 font-sans text-xs text-neutral-500 border-t border-neutral-100 pt-4">
                <CheckCircle size={12} className="text-emerald-500" />
                已保存为草稿 (ID: {result.savedId.slice(0, 8)}...)
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
