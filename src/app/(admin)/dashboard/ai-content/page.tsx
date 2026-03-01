import { prisma } from "@/lib/prisma";
import AiContentReviewList from "./AiContentReviewList";

async function getAiContents() {
  try {
    return await prisma.aiContent.findMany({
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      include: {
        product: { select: { id: true, titleZh: true, sku: true } },
      },
    });
  } catch {
    return [];
  }
}

export default async function AiContentPage() {
  const contents = await getAiContents();

  const pending = contents.filter((c) => c.status === "PENDING_REVIEW");
  const reviewed = contents.filter((c) => c.status !== "PENDING_REVIEW");

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-4xl font-semibold text-neutral-900">
            AI Content Review
          </h1>
          <p className="mt-1 font-sans text-sm text-neutral-500">
            审核 AI 生成的商品文案，批准后自动更新商品描述
          </p>
        </div>
        {pending.length > 0 && (
          <span className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 font-sans text-xs font-medium px-3 py-1.5">
            {pending.length} 条待审核
          </span>
        )}
      </div>

      <AiContentReviewList pending={pending} reviewed={reviewed} />
    </div>
  );
}
