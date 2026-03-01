import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import KnowledgeForm from "../../KnowledgeForm";

async function getItem(id: string) {
  try {
    return await prisma.knowledgeBase.findUnique({ where: { id } });
  } catch {
    return null;
  }
}

export default async function EditKnowledgePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await getItem(id);
  if (!item) notFound();

  return (
    <KnowledgeForm
      itemId={item.id}
      initialData={{
        category: item.category,
        titleZh: item.titleZh,
        titleEn: item.titleEn,
        contentZh: item.contentZh,
        contentEn: item.contentEn,
        tags: item.tags.join(", "),
      }}
    />
  );
}
