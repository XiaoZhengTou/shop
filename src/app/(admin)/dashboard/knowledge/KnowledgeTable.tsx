"use client";

import { useState } from "react";
import { Pencil, Trash2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface KnowledgeItem {
  id: string;
  category: string;
  titleZh: string;
  titleEn: string;
  tags: string[];
  updatedAt: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  faq: "FAQ",
  policy: "政策",
  size_guide: "尺码",
  product: "商品",
};

export default function KnowledgeTable({ items: initial }: { items: KnowledgeItem[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("确认删除这条知识库内容？")) return;
    setDeleting(id);
    const res = await fetch(`/api/admin/knowledge/${id}`, { method: "DELETE" });
    if (res.ok) {
      setItems((prev) => prev.filter((i) => i.id !== id));
    }
    setDeleting(null);
  };

  if (items.length === 0) {
    return (
      <div className="border border-dashed border-neutral-200 py-16 text-center">
        <p className="font-sans text-sm text-neutral-400">暂无知识库内容</p>
        <a href="/dashboard/knowledge/new" className="mt-3 inline-block font-sans text-sm text-neutral-900 underline underline-offset-2">
          添加第一条
        </a>
      </div>
    );
  }

  return (
    <div className="border border-neutral-200">
      <table className="w-full">
        <thead>
          <tr className="border-b border-neutral-200 bg-neutral-50">
            <th className="text-left font-sans text-xs font-medium text-neutral-500 uppercase tracking-widest px-4 py-3">标题</th>
            <th className="text-left font-sans text-xs font-medium text-neutral-500 uppercase tracking-widest px-4 py-3">分类</th>
            <th className="text-left font-sans text-xs font-medium text-neutral-500 uppercase tracking-widest px-4 py-3 hidden md:table-cell">标签</th>
            <th className="text-left font-sans text-xs font-medium text-neutral-500 uppercase tracking-widest px-4 py-3 hidden md:table-cell">更新时间</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50 transition-colors">
              <td className="px-4 py-3">
                <p className="font-sans text-sm text-neutral-900">{item.titleZh}</p>
                {item.titleEn && <p className="font-sans text-xs text-neutral-400 italic">{item.titleEn}</p>}
              </td>
              <td className="px-4 py-3">
                <span className="font-sans text-xs border border-neutral-200 px-2 py-0.5 text-neutral-600">
                  {CATEGORY_LABELS[item.category] ?? item.category}
                </span>
              </td>
              <td className="px-4 py-3 hidden md:table-cell">
                <div className="flex flex-wrap gap-1">
                  {item.tags.map((t) => (
                    <span key={t} className="font-sans text-xs text-neutral-400 border border-neutral-100 px-1.5 py-0.5">{t}</span>
                  ))}
                </div>
              </td>
              <td className="px-4 py-3 hidden md:table-cell">
                <span className="font-sans text-xs text-neutral-400">
                  {new Date(item.updatedAt).toLocaleDateString("zh-CN")}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2 justify-end">
                  <a
                    href={`/dashboard/knowledge/${item.id}/edit`}
                    className="p-1.5 text-neutral-400 hover:text-neutral-900 transition-colors cursor-pointer"
                  >
                    <Pencil size={14} />
                  </a>
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={deleting === item.id}
                    className="p-1.5 text-neutral-400 hover:text-red-500 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {deleting === item.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
