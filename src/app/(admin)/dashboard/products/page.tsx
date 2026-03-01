import { prisma } from "@/lib/prisma";
import { Plus } from "lucide-react";
import ProductTable from "./ProductTable";

async function getProducts() {
  try {
    return await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true, sku: true, titleZh: true, titleEn: true,
        price: true, stock: true, category: true, status: true,
        images: true, createdAt: true,
      },
    });
  } catch {
    return [];
  }
}

export default async function ProductsPage() {
  const raw = await getProducts();
  const products = raw.map((p) => ({ ...p, price: p.price.toString() }));

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-4xl font-semibold text-neutral-900">Products</h1>
          <p className="mt-1 font-sans text-sm text-neutral-500">
            管理商品目录，共 {products.length} 件商品
          </p>
        </div>
        <a
          href="/dashboard/products/new"
          className="inline-flex items-center gap-2 bg-neutral-900 text-white font-sans text-sm font-medium px-4 py-2.5 hover:bg-neutral-700 transition-colors duration-200"
        >
          <Plus size={16} />
          新增商品
        </a>
      </div>

      <ProductTable products={products} />
    </div>
  );
}
