"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";

interface KnowledgeFormData {
  category: string;
  titleZh: string;
  titleEn: string;
  contentZh: string;
  contentEn: string;
  tags: string;
}

interface KnowledgeFormProps {
  initialData?: Partial<KnowledgeFormData>;
  itemId?: string;
}

const CATEGORIES = [
  { value: "faq", label: "FAQ 常见问题" },
  { value: "policy", label: "政策说明" },
  { value: "size_guide", label: "尺码指南" },
  { value: "product", label: "商品介绍" },
];

export default function KnowledgeForm({ initialData, itemId }: KnowledgeFormProps) {
  const router = useRouter();
  const isEdit = !!itemId;

  const [form, setForm] = useState<KnowledgeFormData>({
    category: initialData?.category ?? "faq",
    titleZh: initialData?.titleZh ?? "",
    titleEn: initialData?.titleEn ?? "",
    contentZh: initialData?.contentZh ?? "",
    contentEn: initialData?.contentEn ?? "",
    tags: initialData?.tags ?? "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const body = {
      ...form,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
    };

    const url = isEdit ? `/api/admin/knowledge/${itemId}` : "/api/admin/knowledge";
    const method = isEdit ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "保存失败");
      return;
    }

    router.push("/dashboard/knowledge");
    router.refresh();
  };

  return (
    <div className="max-w-2xl">
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900 transition-colors mb-8 cursor-pointer"
      >
        <ArrowLeft size={14} />
        返回
      </button>

      <h1 className="font-serif text-2xl font-semibold text-neutral-900 mb-8">
        {isEdit ? "编辑知识库" : "新增知识库"}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-xs font-medium text-neutral-500 uppercase tracking-widest mb-2">分类</label>
          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            className="w-full border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:border-neutral-900 transition-colors bg-white cursor-pointer"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-neutral-500 uppercase tracking-widest mb-2">中文标题</label>
            <input
              name="titleZh"
              value={form.titleZh}
              onChange={handleChange}
              required
              className="w-full border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:border-neutral-900 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-500 uppercase tracking-widest mb-2">英文标题</label>
            <input
              name="titleEn"
              value={form.titleEn}
              onChange={handleChange}
              className="w-full border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:border-neutral-900 transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-500 uppercase tracking-widest mb-2">中文内容</label>
          <textarea
            name="contentZh"
            value={form.contentZh}
            onChange={handleChange}
            required
            rows={6}
            placeholder="AI 问答时会引用这段内容回答用户问题…"
            className="w-full border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:border-neutral-900 transition-colors resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-500 uppercase tracking-widest mb-2">英文内容</label>
          <textarea
            name="contentEn"
            value={form.contentEn}
            onChange={handleChange}
            rows={6}
            className="w-full border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:border-neutral-900 transition-colors resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-500 uppercase tracking-widest mb-2">标签（逗号分隔）</label>
          <input
            name="tags"
            value={form.tags}
            onChange={handleChange}
            placeholder="例：退换货,物流,尺码"
            className="w-full border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:border-neutral-900 transition-colors"
          />
          <p className="text-xs text-neutral-400 mt-1">标签用于 AI 搜索匹配，填写用户可能问到的关键词</p>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-neutral-900 text-white text-sm px-6 py-2.5 hover:bg-neutral-700 disabled:opacity-50 transition-colors cursor-pointer"
          >
            {loading && <Loader2 size={13} className="animate-spin" />}
            {isEdit ? "保存修改" : "创建"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="border border-neutral-200 text-sm px-6 py-2.5 hover:border-neutral-900 transition-colors cursor-pointer"
          >
            取消
          </button>
        </div>
      </form>
    </div>
  );
}
