import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/wishlist — get current user's wishlist product IDs
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ wishlist: [] });
  }

  const items = await prisma.wishlist.findMany({
    where: { userId: session.user.id },
    select: { productId: true },
  });

  return NextResponse.json({ wishlist: items.map((i) => i.productId) });
}

// POST /api/wishlist — toggle a product in/out of wishlist
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json() as { productId?: string };
  if (!body.productId) {
    return NextResponse.json({ error: "productId required" }, { status: 400 });
  }

  const userId = session.user.id;
  const { productId } = body;

  const existing = await prisma.wishlist.findUnique({
    where: { userId_productId: { userId, productId } },
  });

  if (existing) {
    await prisma.wishlist.delete({
      where: { userId_productId: { userId, productId } },
    });
    return NextResponse.json({ wishlisted: false });
  } else {
    await prisma.wishlist.create({ data: { userId, productId } });
    return NextResponse.json({ wishlisted: true });
  }
}
