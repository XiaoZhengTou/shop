import { NextRequest, NextResponse } from "next/server";
import { generateMarketingContent, MarketingPlatform } from "@/lib/services/marketing-service";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      productId?: string;
      platform: MarketingPlatform;
      tone?: "trendy" | "elegant" | "casual" | "professional";
      // Manual input if no productId
      titleZh?: string;
      titleEn?: string;
      descriptionZh?: string;
      descriptionEn?: string;
      category?: string;
      price?: number;
      tags?: string[];
    };

    if (!body.platform || !["tiktok", "xiaohongshu", "instagram"].includes(body.platform)) {
      return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
    }

    let input = {
      titleZh: body.titleZh ?? "",
      titleEn: body.titleEn ?? "",
      descriptionZh: body.descriptionZh ?? "",
      descriptionEn: body.descriptionEn ?? "",
      category: body.category ?? "dress",
      price: body.price ?? 0,
      tags: body.tags ?? [],
      platform: body.platform,
      tone: body.tone,
    };

    // If productId provided, fetch from DB
    if (body.productId) {
      const product = await prisma.product.findUnique({
        where: { id: body.productId },
        select: {
          titleZh: true, titleEn: true,
          descriptionZh: true, descriptionEn: true,
          category: true, price: true, tags: true,
        },
      });
      if (!product) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
      }
      input = {
        ...input,
        titleZh: product.titleZh,
        titleEn: product.titleEn,
        descriptionZh: product.descriptionZh ?? "",
        descriptionEn: product.descriptionEn ?? "",
        category: product.category,
        price: Number(product.price),
        tags: product.tags,
      };
    }

    if (!input.titleZh && !input.titleEn) {
      return NextResponse.json({ error: "Product title is required" }, { status: 400 });
    }

    const content = await generateMarketingContent(input);
    return NextResponse.json(content);
  } catch (error) {
    console.error("[POST /api/admin/marketing/generate]", error);
    return NextResponse.json({ error: "Failed to generate content" }, { status: 500 });
  }
}
