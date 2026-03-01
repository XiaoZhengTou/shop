import { prisma } from "@/lib/prisma";
import ProductCard from "@/components/store/ProductCard";
import ProductSearch from "@/components/store/ProductSearch";

interface ProductsPageProps {
  searchParams: Promise<{ category?: string; q?: string }>;
}

async function getProducts(category?: string, q?: string) {
  try {
    const where: Record<string, unknown> = { status: "ACTIVE" };
    if (category) where.category = category;
    if (q) {
      where.OR = [
        { titleZh: { contains: q, mode: "insensitive" } },
        { titleEn: { contains: q, mode: "insensitive" } },
        { tags: { has: q } },
      ];
    }
    return await prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  } catch {
    return [];
  }
}

const CATEGORIES = ["all", "dress", "tops", "outerwear", "bottoms", "accessories"];

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const products = await getProducts(params.category, params.q);

  const categoryLabel = params.category
    ? params.category.charAt(0).toUpperCase() + params.category.slice(1)
    : "All";

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-12">
      {/* Page Header */}
      <div className="mb-10">
        <p className="font-sans text-xs text-neutral-400 uppercase tracking-widest mb-2">Collection</p>
        <h1 className="font-serif text-4xl font-semibold text-neutral-900">
          {categoryLabel} Products
        </h1>
      </div>

      {/* Search + Filter bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <ProductSearch defaultValue={params.q ?? ""} />
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map((cat) => {
            const active = (params.category ?? "all") === cat;
            const href = cat === "all" ? "/products" : `/products?category=${cat}`;
            return (
              <a
                key={cat}
                href={href}
                className={`font-sans text-xs px-3 py-1.5 border transition-colors duration-200 capitalize ${
                  active
                    ? "bg-neutral-900 text-white border-neutral-900"
                    : "border-neutral-200 text-neutral-600 hover:border-neutral-900"
                }`}
              >
                {cat}
              </a>
            );
          })}
        </div>
      </div>

      <p className="font-sans text-sm text-neutral-500 mb-6">
        {products.length} {products.length === 1 ? "item" : "items"}
        {params.q && <span className="ml-1">for "{params.q}"</span>}
      </p>

      {/* Product Grid */}
      {products.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              id={product.id}
              titleZh={product.titleZh}
              titleEn={product.titleEn}
              price={product.price.toString()}
              category={product.category}
              images={product.images}
              locale="zh"
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-32">
          <p className="font-serif text-2xl text-neutral-300">No products found</p>
          <p className="mt-4 font-sans text-sm text-neutral-400">Try a different search or category</p>
        </div>
      )}
    </div>
  );
}
