import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/webhooks/cart-abandoned
// Called when user has items in cart but hasn't checked out after 30min
// Body: { userId: string }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { userId?: string };
    if (!body.userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    const { userId } = body;

    // Check user exists and has cart items
    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      include: {
        product: {
          select: { id: true, titleZh: true, titleEn: true, price: true, category: true, stock: true },
        },
      },
    });

    if (cartItems.length === 0) {
      return NextResponse.json({ message: "No cart items, skipping" });
    }

    // Check if user already has a pending order (not abandoned)
    const recentOrder = await prisma.order.findFirst({
      where: {
        userId,
        status: { in: ["PENDING", "PAID"] },
        createdAt: { gte: new Date(Date.now() - 30 * 60 * 1000) },
      },
    });

    if (recentOrder) {
      return NextResponse.json({ message: "Recent order found, skipping" });
    }

    // Count existing abandoned cart jobs for this user (frequency control)
    const existingJobs = await prisma.marketingJob.count({
      where: {
        userId,
        type: { in: ["ABANDONED_CART_1", "ABANDONED_CART_2", "ABANDONED_CART_3"] },
        status: { in: ["PENDING", "SENT"] },
        createdAt: { gte: new Date(Date.now() - 72 * 60 * 60 * 1000) },
      },
    });

    if (existingJobs >= 3) {
      return NextResponse.json({ message: "Max touch limit reached, skipping" });
    }

    // Determine which touch this is
    const touchNumber = existingJobs + 1;
    const jobType = (["ABANDONED_CART_1", "ABANDONED_CART_2", "ABANDONED_CART_3"] as const)[touchNumber - 1];

    // Schedule delays: touch1=now, touch2=24h, touch3=72h
    const delayMs = touchNumber === 1 ? 0 : touchNumber === 2 ? 24 * 60 * 60 * 1000 : 72 * 60 * 60 * 1000;
    const scheduledAt = new Date(Date.now() + delayMs);

    const cartPayload = cartItems.map((item) => ({
      productId: item.product.id,
      titleZh: item.product.titleZh,
      titleEn: item.product.titleEn,
      price: Number(item.product.price),
      category: item.product.category,
      stock: item.product.stock,
      quantity: item.quantity,
    }));

    const job = await prisma.marketingJob.create({
      data: {
        userId,
        type: jobType,
        status: "PENDING",
        channel: "email",
        scheduledAt,
        payload: { touchNumber, cartItems: cartPayload },
      },
    });

    return NextResponse.json({ jobId: job.id, touchNumber, scheduledAt });
  } catch (error) {
    console.error("[POST /api/webhooks/cart-abandoned]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
