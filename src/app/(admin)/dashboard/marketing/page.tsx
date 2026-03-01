import { prisma } from "@/lib/prisma";
import MarketingGenerator from "./MarketingGenerator";

async function getProducts() {
  try {
    return await prisma.product.findMany({
      where: { status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        sku: true,
        titleZh: true,
        titleEn: true,
        category: true,
        price: true,
      },
    });
  } catch {
    return [];
  }
}

export default async function MarketingPage() {
  const products = await getProducts();

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-4xl font-semibold text-neutral-900">Marketing</h1>
        <p className="mt-1 font-sans text-sm text-neutral-500">
          AI 营销文案生成 — TikTok · 小红书 · Instagram
        </p>
      </div>
      <MarketingGenerator products={products} />
    </div>
  );
}
