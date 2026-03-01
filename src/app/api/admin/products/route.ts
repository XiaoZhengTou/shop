import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/admin/products?page=1&status=ACTIVE&q=...
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const status = searchParams.get("status") || undefined;
  const q = searchParams.get("q") || undefined;
  const pageSize = 20;

  const where = {
    ...(status ? { status: status as "DRAFT" | "ACTIVE" | "INACTIVE" | "OUT_OF_STOCK" } : {}),
    ...(q ? {
      OR: [
        { titleZh: { contains: q, mode: "insensitive" as const } },
        { titleEn: { contains: q, mode: "insensitive" as const } },
        { sku: { contains: q, mode: "insensitive" as const } },
      ],
    } : {}),
  };

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true, sku: true, titleZh: true, titleEn: true,
        price: true, stock: true, category: true, status: true,
        images: true, createdAt: true,
      },
    }),
  ]);

  return NextResponse.json({ products, total, page, pageSize });
}

// POST /api/admin/products
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { sku, titleZh, titleEn, descriptionZh, descriptionEn, price, stock, category, tags, status, images } = body;

  if (!sku || !titleZh || !titleEn || !price || !category) {
    return NextResponse.json({ error: "必填字段缺失" }, { status: 400 });
  }

  try {
    const product = await prisma.product.create({
      data: {
        sku,
        titleZh,
        titleEn,
        descriptionZh: descriptionZh || "",
        descriptionEn: descriptionEn || "",
        price,
        stock: stock ?? 0,
        category,
        tags: tags ?? [],
        status: status ?? "DRAFT",
        images: images ?? [],
      },
    });
    return NextResponse.json({ product }, { status: 201 });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "P2002") {
      return NextResponse.json({ error: "SKU 已存在" }, { status: 409 });
    }
    return NextResponse.json({ error: "创建失败" }, { status: 500 });
  }
}
