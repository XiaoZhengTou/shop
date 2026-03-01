import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() ?? "";
    const category = searchParams.get("category") ?? "";
    const minPrice = parseFloat(searchParams.get("minPrice") ?? "0") || 0;
    const maxPrice = parseFloat(searchParams.get("maxPrice") ?? "0") || 0;
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(48, parseInt(searchParams.get("limit") ?? "12"));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { status: "ACTIVE" };

    if (q) {
      where.OR = [
        { titleZh: { contains: q, mode: "insensitive" } },
        { titleEn: { contains: q, mode: "insensitive" } },
        { descriptionZh: { contains: q, mode: "insensitive" } },
        { tags: { has: q } },
        { sku: { contains: q, mode: "insensitive" } },
      ];
    }

    if (category) where.category = category;

    if (minPrice > 0 || maxPrice > 0) {
      where.price = {};
      if (minPrice > 0) (where.price as Record<string, unknown>).gte = minPrice;
      if (maxPrice > 0) (where.price as Record<string, unknown>).lte = maxPrice;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true, sku: true, titleZh: true, titleEn: true,
          price: true, category: true, tags: true, images: true,
          _count: { select: { reviews: true } },
        },
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      products,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("[GET /api/products/search]", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
