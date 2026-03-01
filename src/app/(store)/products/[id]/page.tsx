import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import ProductImage from "@/components/store/ProductImage";
import AddToCartButton from "@/components/store/AddToCartButton";
import WishlistButton from "@/components/store/WishlistButton";
import ReviewsSection from "@/components/store/ReviewsSection";
import ProductCard from "@/components/store/ProductCard";

interface ProductDetailPageProps {
  params: Promise<{ id: string }>;
}

async function getProduct(id: string) {
  try {
    return await prisma.product.findUnique({ where: { id } });
  } catch {
    return null;
  }
}

async function getRelated(category: string, excludeId: string) {
  try {
    return await prisma.product.findMany({
      where: { status: "ACTIVE", category, id: { not: excludeId } },
      orderBy: { createdAt: "desc" },
      take: 4,
      select: { id: true, titleZh: true, titleEn: true, price: true, category: true, images: true },
    });
  } catch {
    return [];
  }
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product || product.status !== "ACTIVE") notFound();

  const related = await getRelated(product.category, product.id);
  const imageUrl = product.images[0] || "/images/placeholder.svg";

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-12">
      <a
        href="/products"
        className="inline-flex items-center gap-2 font-sans text-sm text-neutral-500 hover:text-neutral-900 transition-colors duration-200 cursor-pointer mb-12"
      >
        <ArrowLeft size={14} />
        Back to Collection
      </a>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-24">
        {/* Image */}
        <div className="aspect-[3/4] relative bg-neutral-50 border border-neutral-200">
          <ProductImage src={imageUrl} alt={product.titleZh} />
        </div>

        {/* Product Info */}
        <div className="flex flex-col justify-center">
          <p className="font-sans text-xs text-neutral-400 uppercase tracking-widest mb-4">
            {product.category}
          </p>
          <h1 className="font-serif text-4xl font-semibold text-neutral-900 leading-tight">
            {product.titleZh}
          </h1>
          <p className="mt-2 font-sans text-sm text-neutral-500 italic">{product.titleEn}</p>
          <p className="mt-6 font-sans text-2xl font-bold text-neutral-900">
            ¥{Number(product.price).toFixed(2)}
          </p>

          <p className="mt-6 font-sans text-sm text-neutral-600 leading-relaxed">
            {product.descriptionZh}
          </p>

          {product.tags.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <span key={tag} className="font-sans text-xs text-neutral-500 border border-neutral-200 px-3 py-1">
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="mt-10 flex gap-3">
            <AddToCartButton
              product={{
                id: product.id,
                titleZh: product.titleZh,
                titleEn: product.titleEn,
                price: product.price.toString(),
                image: product.images[0] || "/images/placeholder.svg",
                category: product.category,
              }}
            />
            <WishlistButton productId={product.id} />
          </div>

          {product.stock > 0 ? (
            <p className="mt-4 font-sans text-xs text-emerald-600">In stock ({product.stock} available)</p>
          ) : (
            <p className="mt-4 font-sans text-xs text-red-600">Out of stock</p>
          )}
        </div>
      </div>

      {/* Reviews */}
      <ReviewsSection productId={product.id} />

      {/* Related Products */}
      {related.length > 0 && (
        <div className="mt-16 border-t border-neutral-200 pt-12">
          <h2 className="font-serif text-2xl font-semibold text-neutral-900 mb-8">
            同类推荐
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {related.map((p) => (
              <ProductCard
                key={p.id}
                id={p.id}
                titleZh={p.titleZh}
                titleEn={p.titleEn}
                price={p.price.toString()}
                category={p.category}
                images={p.images}
                locale="zh"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
