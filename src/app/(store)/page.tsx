import { ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import ProductCard from "@/components/store/ProductCard";
import Image from "next/image";

export const dynamic = "force-dynamic";

async function getFeaturedProducts() {
  try {
    return await prisma.product.findMany({
      where: { status: "ACTIVE" },
      take: 4,
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("[HomePage] Failed to fetch products:", error);
    // Return empty array to prevent page crash
    return [];
  }
}

export default async function HomePage() {
  const products = await getFeaturedProducts();

  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/products/index/image3.png"
            alt="Hero Background"
            fill
            sizes="(max-width: 1280px) 100vw, 1280px"
            quality={90}
            className="object-cover object-center"
            priority
          />
          <div className="absolute inset-0 bg-black/40" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-32 w-full">
          <div className="max-w-3xl">
            <p className="font-sans text-sm font-medium text-[#D4AF37] tracking-widest uppercase mb-6">
              AI-Powered Fashion
            </p>
            <h1
              className="font-serif text-white leading-none tracking-tight mb-8"
              style={{ fontSize: "clamp(3.5rem, 10vw, 8rem)" }}
            >
              Dress with
              <br />
              <span className="italic text-[#D4AF37]">Intention</span>
            </h1>
            <p className="font-sans text-lg text-white/80 max-w-lg leading-relaxed mb-12">
              Curated fashion pieces, styled by AI. Discover your signature look.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="/products"
                className="inline-flex items-center gap-2 bg-[#D4AF37] text-black font-sans text-sm font-semibold px-10 py-5 hover:bg-[#c49f2a] transition-colors duration-200"
              >
                Shop Collection <ArrowRight size={16} />
              </a>
              <a
                href="/products?new=true"
                className="inline-flex items-center gap-2 border border-white text-white font-sans text-sm font-medium px-10 py-5 hover:bg-white/10 transition-colors duration-200"
              >
                New Arrivals
              </a>
            </div>
          </div>
        </div>
      </section>

     

      {/* Image 2 3 竖排 有间距有边距 */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 flex flex-col gap-6">
          {[
            { img: "/images/products/index/image2.png", label: "Dresses", href: "/products?category=dress" },
            { img: "/images/products/index/image3.png", label: "Tops", href: "/products?category=tops" },
          ].map((item) => (
            <a key={item.label} href={item.href}
              className="relative overflow-hidden group block" style={{ height: "80vh" }}>
              <Image src={item.img} alt={item.label} fill
                sizes="(max-width: 1280px) 100vw, 1280px" quality={90}
                className="object-cover object-center transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 p-10 md:p-16">
                <h3 className="font-serif text-white text-4xl md:text-6xl font-medium">{item.label}</h3>
                <span className="font-sans text-white/70 text-sm tracking-widest uppercase mt-3 flex items-center gap-1">
                  Shop Now <ArrowRight size={14} />
                </span>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-12">
            <h2 className="font-serif text-3xl font-medium text-neutral-900">Featured Pieces</h2>
            <a href="/products"
              className="font-sans text-sm text-neutral-500 hover:text-neutral-900 transition-colors duration-200 flex items-center gap-1">
              View All <ArrowRight size={14} />
            </a>
          </div>
          {products.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} id={product.id}
                  titleZh={product.titleZh} titleEn={product.titleEn}
                  price={product.price.toString()} category={product.category}
                  images={product.images} locale="zh" />
              ))}
            </div>
          ) : (
            <div className="text-center py-24">
              <p className="font-sans text-neutral-400">Products coming soon</p>
            </div>
          )}
        </div>
      </section>

      {/* Brand Story */}
      <section className="relative py-24 md:py-32 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image src="/images/products/index/image1.png"
            alt="Brand Story" fill className="object-cover object-center" />
          <div className="absolute inset-0 bg-neutral-900/80" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="max-w-xl">
            <p className="font-sans text-xs text-[#D4AF37] tracking-widest uppercase mb-4">Our Story</p>
            <h2 className="font-serif text-white text-4xl md:text-6xl font-medium leading-tight">
              Fashion, reimagined<br />with intelligence
            </h2>
            <p className="mt-6 font-sans text-sm text-neutral-400 leading-relaxed">
              StyleAI combines the art of fashion curation with the precision of AI.
            </p>
            <a href="/products"
              className="mt-8 inline-flex items-center gap-2 text-[#D4AF37] font-sans text-sm hover:opacity-80 transition-opacity duration-200">
              Explore the Collection <ArrowRight size={14} />
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
