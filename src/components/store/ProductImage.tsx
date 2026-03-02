"use client";

import Image from "next/image";
import { useState } from "react";
import { toDisplayImageUrl } from "@/lib/blob-image";

const PLACEHOLDER = "/images/placeholder.svg";

interface ProductImageProps {
  src: string;
  alt: string;
  priority?: boolean;
}

export default function ProductImage({ src, alt, priority = true }: ProductImageProps) {
  const [imgSrc, setImgSrc] = useState(toDisplayImageUrl(src || PLACEHOLDER));

  return (
    <Image
      src={imgSrc}
      alt={alt}
      fill
      className="object-cover"
      priority={priority}
      onError={() => setImgSrc(PLACEHOLDER)}
      unoptimized={imgSrc === PLACEHOLDER || imgSrc.endsWith(".svg")}
    />
  );
}
