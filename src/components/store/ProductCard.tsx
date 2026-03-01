"use client";

import Image from "next/image";
import { useState } from "react";
import { ShoppingBag } from "lucide-react";
import { useCartStore } from "@/lib/store/cart";

interface ProductCardProps {
  id: string;
  titleZh: string;
  titleEn: string;
  price: string | number;
  category: string;
  images: string[];
  locale?: "zh" | "en";
}

const PLACEHOLDER = "/images/placeholder.svg";

export default function ProductCard({
  id,
  titleZh,
  titleEn,
  price,
  images,
  category,
  locale = "zh",
}: ProductCardProps) {
  const title = locale === "zh" ? titleZh : titleEn;
  const [src, setSrc] = useState(images[0] || PLACEHOLDER);
  const displayPrice = typeof price === "string" ? parseFloat(price) : price;
  const addItem = useCartStore((s) => s.addItem);
  const [added, setAdded] = useState(false);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault(); // Don't navigate to product page
    addItem({ id, titleZh, titleEn, price: displayPrice, image: src, category });
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  return (
    <a
      href={`/products/${id}`}
      className="group block bg-white border border-neutral-200 rounded-none cursor-pointer"
    >
      {/* Product Image */}
      <div className="aspect-[3/4] relative overflow-hidden bg-neutral-50">
        <Image
          src={src}
          alt={title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          onError={() => setSrc(PLACEHOLDER)}
          unoptimized={src === PLACEHOLDER || src.endsWith(".svg")}
        />
        {/* Quick-add overlay */}
        <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <button
            onClick={handleQuickAdd}
            className="w-full flex items-center justify-center gap-2 bg-neutral-900/90 text-white font-sans text-xs font-medium py-3 hover:bg-neutral-900 transition-colors duration-200 cursor-pointer"
          >
            <ShoppingBag size={12} />
            {added ? "已加入 ✓" : "加入购物袋"}
          </button>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4">
        <h3 className="font-sans text-sm font-medium text-neutral-900 line-clamp-2 leading-snug">
          {title}
        </h3>
        <p className="mt-2 font-sans text-base font-bold text-neutral-900">
          {locale === "zh" ? `¥${displayPrice}` : `$${displayPrice}`}
        </p>
      </div>
    </a>
  );
}
