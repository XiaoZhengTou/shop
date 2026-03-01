"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";

export default function WishlistButton({ productId }: { productId: string }) {
  const [wishlisted, setWishlisted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/wishlist")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.wishlist)) {
          setWishlisted(d.wishlist.includes(productId));
        }
      })
      .catch(() => {});
  }, [productId]);

  const toggle = async () => {
    setLoading(true);
    const res = await fetch("/api/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });
    if (res.ok) {
      const data = await res.json();
      setWishlisted(data.wishlisted);
    }
    setLoading(false);
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
      className={`flex items-center justify-center w-12 h-12 border transition-colors duration-200 cursor-pointer disabled:opacity-50 ${
        wishlisted
          ? "border-red-300 bg-red-50 text-red-500"
          : "border-neutral-200 text-neutral-400 hover:border-neutral-900 hover:text-neutral-900"
      }`}
    >
      <Heart size={18} fill={wishlisted ? "currentColor" : "none"} />
    </button>
  );
}
