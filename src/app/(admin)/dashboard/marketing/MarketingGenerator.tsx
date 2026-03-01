"use client";

import { useState } from "react";
import { Loader2, Copy, Check, Sparkles } from "lucide-react";

interface Product {
  id: string;
  sku: string;
  titleZh: string;
  titleEn: string;
  category: string;
  price: unknown;
}

type Platform = "tiktok" | "xiaohongshu" | "instagram";
type Tone = "trendy" | "elegant" | "casual" | "professional";

interface MarketingContent {
  platform: Platform;
  title: string;
  body: string;
  hashtags: string[];
  callToAction: string;
  tips: string;
}

const PLATFORMS: { key: Platform; label: string; emoji: string; color: string }[] = [
  { key: "tiktok", label: "TikTok", emoji: "🎵", color: "border-pink-300 bg-pink-50 text-pink-700" },
  { key: "xiaohongshu", label: "小红书", emoji: "📕", color: "border-red-300 bg-red-50 text-red-700" },
  { key: "instagram", label: "Instagram", emoji: "📸", color: "border-purple-300 bg-purple-50 text-purple-700" },
];

const TONES: { key: Tone; label: string }[] = [
  { key: "trendy", label: "潮流" },
  { key: "elegant", label: "优雅" },
  { key: "casual", label: "休闲" },
  { key: "professional", label: "专业" },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1 font-sans text-xs text-neutral-400 hover:text-neutral-900 transition-colors cursor-pointer"
    >
      {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
      {copied ? "已复制" : "复制"}
    </button>
  );
}

function ResultCard({ content }: { content: MarketingContent }) {
  const platform = PLATFORMS.find((p) => p.key === content.platform);
  const fullText = `${content.title}\n\n${content.body}\n\n${content.callToAction}\n\n${content.hashtags.map((h) => `#${h}`).join(" ")}`;

  return (
    <div className="bg-white border border-neutral-200 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{platform?.emoji}</span>
          <span className={`font-sans text-xs font-semibold px-2 py-0.5 border rounded-sm ${platform?.color}`}>
            {platform?.label}
          </span>
        </div>
        <CopyButton text={fullText} />
      </div>

      {/* Title */}
      <div>
        <p className="font-sans text-xs text-neutral-400 uppercase tracking-wider mb-1">标题</p>
        <p className="font-sans text-sm font-semibold text-neutral-900">{content.title}</p>
      </div>

      {/* Body */}
      <div>
        <p className="font-sans text-xs text-neutral-400 uppercase tracking-wider mb-1">正文</p>
        <p className="font-sans text-sm text-neutral-700 whitespace-pre-line leading-relaxed">
          {content.body}
        </p>
      </div>

      {/* CTA */}
      <div>
        <p className="font-sans text-xs text-neutral-400 uppercase tracking-wider mb-1">行动号召</p>
        <p className="font-sans text-sm text-[#D4AF37] font-medium">{content.callToAction}</p>
      </div>

      {/* Hashtags */}
      <div>
        <p className="font-sans text-xs text-neutral-400 uppercase tracking-wider mb-2">标签</p>
        <div className="flex flex-wrap gap-1.5">
          {content.hashtags.map((tag) => (
            <span
              key={tag}
              className="font-sans text-xs bg-neutral-100 text-neutral-600 px-2 py-0.5"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>

      {/* Tips */}
      {content.tips && (
        <div className="border-t border-neutral-100 pt-3">
          <p className="font-sans text-xs text-neutral-400 italic">💡 {content.tips}</p>
        </div>
      )}
    </div>
  );
}

export default function MarketingGenerator({ products }: { products: Product[] }) {
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(["xiaohongshu"]);
  const [tone, setTone] = useState<Tone>("trendy");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<MarketingContent[]>([]);

  const togglePlatform = (p: Platform) => {
    setSelectedPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  };

  const generate = async () => {
    if (!selectedProductId || selectedPlatforms.length === 0) return;
    setLoading(true);
    setError("");
    setResults([]);

    try {
      const responses = await Promise.all(
        selectedPlatforms.map((platform) =>
          fetch("/api/admin/marketing/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId: selectedProductId, platform, tone }),
          }).then((r) => r.json())
        )
      );
      const failed = responses.find((r) => r.error);
      if (failed) { setError(failed.error); return; }
      setResults(responses as MarketingContent[]);
    } catch {
      setError("生成失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-3 gap-6">
      {/* Config panel */}
      <div className="col-span-1 space-y-6">
        <div className="bg-white border border-neutral-200 p-5 space-y-5">
          <h2 className="font-sans text-xs font-semibold text-neutral-500 uppercase tracking-widest">
            配置
          </h2>

          {/* Product selector */}
          <div>
            <label className="block font-sans text-xs text-neutral-500 mb-1.5">选择商品 *</label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full border border-neutral-200 px-3 py-2.5 font-sans text-sm focus:outline-none focus:border-neutral-900 transition-colors bg-white"
            >
              <option value="">— 请选择 —</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.titleZh} ({p.sku})
                </option>
              ))}
            </select>
          </div>

          {/* Platform selector */}
          <div>
            <label className="block font-sans text-xs text-neutral-500 mb-2">平台（可多选）*</label>
            <div className="space-y-2">
              {PLATFORMS.map((p) => (
                <button
                  key={p.key}
                  onClick={() => togglePlatform(p.key)}
                  className={`w-full flex items-center gap-2 px-3 py-2 border font-sans text-sm transition-colors cursor-pointer ${
                    selectedPlatforms.includes(p.key)
                      ? "border-neutral-900 bg-neutral-900 text-white"
                      : "border-neutral-200 text-neutral-600 hover:border-neutral-400"
                  }`}
                >
                  <span>{p.emoji}</span>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tone */}
          <div>
            <label className="block font-sans text-xs text-neutral-500 mb-2">语气风格</label>
            <div className="grid grid-cols-2 gap-2">
              {TONES.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTone(t.key)}
                  className={`px-3 py-2 border font-sans text-xs transition-colors cursor-pointer ${
                    tone === t.key
                      ? "border-neutral-900 bg-neutral-900 text-white"
                      : "border-neutral-200 text-neutral-600 hover:border-neutral-400"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="font-sans text-xs text-red-500">{error}</p>}

          <button
            onClick={generate}
            disabled={loading || !selectedProductId || selectedPlatforms.length === 0}
            className="w-full flex items-center justify-center gap-2 bg-[#D4AF37] text-white font-sans text-sm font-medium py-3 hover:bg-[#B8960F] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            {loading ? (
              <><Loader2 size={14} className="animate-spin" /> 生成中…</>
            ) : (
              <><Sparkles size={14} /> 生成文案</>
            )}
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="col-span-2 space-y-4">
        {results.length === 0 && !loading && (
          <div className="bg-white border border-neutral-200 px-6 py-16 text-center">
            <Sparkles size={32} className="mx-auto text-neutral-300 mb-3" />
            <p className="font-sans text-sm text-neutral-400">选择商品和平台，点击生成文案</p>
          </div>
        )}
        {loading && (
          <div className="bg-white border border-neutral-200 px-6 py-16 text-center">
            <Loader2 size={32} className="mx-auto text-neutral-300 mb-3 animate-spin" />
            <p className="font-sans text-sm text-neutral-400">AI 正在生成营销文案…</p>
          </div>
        )}
        {results.map((r) => (
          <ResultCard key={r.platform} content={r} />
        ))}
      </div>
    </div>
  );
}
