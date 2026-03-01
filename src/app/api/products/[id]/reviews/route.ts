import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/products/[id]/reviews
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const reviews = await prisma.review.findMany({
      where: { productId: id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true, rating: true, comment: true, createdAt: true,
        user: { select: { name: true } },
      },
    });

    const avgRating = reviews.length
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : 0;

    return NextResponse.json({ reviews, avgRating, total: reviews.length });
  } catch (error) {
    console.error("[GET /api/products/[id]/reviews]", error);
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}

// POST /api/products/[id]/reviews
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json() as { rating?: number; comment?: string };

    if (!body.rating || body.rating < 1 || body.rating > 5) {
      return NextResponse.json({ error: "Rating must be 1-5" }, { status: 400 });
    }

    // Check user has purchased this product
    const hasPurchased = await prisma.orderItem.findFirst({
      where: {
        productId: id,
        order: { userId: session.user.id, status: { in: ["PAID", "SHIPPED", "DELIVERED"] } },
      },
    });

    if (!hasPurchased) {
      return NextResponse.json({ error: "只有购买过的用户才能评价" }, { status: 403 });
    }

    const review = await prisma.review.upsert({
      where: { userId_productId: { userId: session.user.id, productId: id } },
      create: {
        userId: session.user.id,
        productId: id,
        rating: body.rating,
        comment: body.comment?.trim() ?? null,
      },
      update: {
        rating: body.rating,
        comment: body.comment?.trim() ?? null,
      },
      select: {
        id: true, rating: true, comment: true, createdAt: true,
        user: { select: { name: true } },
      },
    });

    return NextResponse.json(review);
  } catch (error) {
    console.error("[POST /api/products/[id]/reviews]", error);
    return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
  }
}
