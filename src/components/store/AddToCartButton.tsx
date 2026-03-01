"use client";

import { useCartStore } from "@/lib/store/cart";
import { ShoppingBag } from "lucide-react";
import { useState } from "react";

interface AddToCartButtonProps {
  product: {
    id: string;
    titleZh: string;
    titleEn: string;
    price: string;
    image: string;
    category: string;
  };
}

export default function AddToCartButton({ product }: AddToCartButtonProps) {
  const addItem = useCartStore((s) => s.addItem);
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    addItem({
      id: product.id,
      titleZh: product.titleZh,
      titleEn: product.titleEn,
      price: parseFloat(product.price),
      image: product.image,
      category: product.category,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <button
      onClick={handleAdd}
      className="flex-1 flex items-center justify-center gap-2 bg-neutral-900 text-white font-sans text-sm font-medium px-8 py-4 hover:bg-neutral-700 transition-colors duration-200 cursor-pointer"
    >
      <ShoppingBag size={16} />
      {added ? "已加入购物袋 ✓" : "加入购物袋"}
    </button>
  );
}
