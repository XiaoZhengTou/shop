import { prisma } from "@/lib/prisma";
import { Plus } from "lucide-react";
import KnowledgeTable from "./KnowledgeTable";

async function getItems() {
  try {
    const rows = await prisma.knowledgeBase.findMany({
      orderBy: { updatedAt: "desc" },
      select: { id: true, category: true, titleZh: true, titleEn: true, tags: true, updatedAt: true },
    });
    return rows.map((r) => ({ ...r, updatedAt: r.updatedAt.toISOString() }));
  } catch {
    return [];
  }
}

export default async function KnowledgePage() {
  const items = await getItems();

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-4xl font-semibold text-neutral-900">Knowledge Base</h1>
          <p className="mt-1 font-sans text-sm text-neutral-500">
            AI 问答知识库，共 {items.length} 条
          </p>
        </div>
        <a
          href="/dashboard/knowledge/new"
          className="inline-flex items-center gap-2 bg-neutral-900 text-white font-sans text-sm px-4 py-2.5 hover:bg-neutral-700 transition-colors"
        >
          <Plus size={16} />
          新增条目
        </a>
      </div>
      <KnowledgeTable items={items} />
    </div>
  );
}
