"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export default function ProductSearch({ defaultValue }: { defaultValue: string }) {
  const [q, setQ] = useState(defaultValue);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    router.push(`/products${params.toString() ? `?${params}` : ""}`);
  };

  return (
    <form onSubmit={handleSubmit} className="flex-1 flex gap-2">
      <div className="relative flex-1">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="搜索商品…"
          className="w-full border border-neutral-200 pl-9 pr-4 py-2 font-sans text-sm focus:outline-none focus:border-neutral-900 transition-colors"
        />
      </div>
      <button
        type="submit"
        className="px-4 py-2 bg-neutral-900 text-white font-sans text-sm hover:bg-neutral-700 transition-colors cursor-pointer"
      >
        搜索
      </button>
    </form>
  );
}
