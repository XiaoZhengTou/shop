import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
}

interface CheckoutBody {
  items: OrderItem[];
  address: {
    name: string;
    phone: string;
    province: string;
    city: string;
    district: string;
    detail: string;
  };
  paymentMethod: string;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const body: CheckoutBody = await req.json();
  const { items, address, paymentMethod } = body;

  if (!items?.length) {
    return NextResponse.json({ error: "购物车为空" }, { status: 400 });
  }

  // Verify products exist and have sufficient stock
  const productIds = items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, status: "ACTIVE" },
    select: { id: true, price: true, stock: true, titleZh: true },
  });

  if (products.length !== items.length) {
    return NextResponse.json({ error: "部分商品不存在或已下架" }, { status: 400 });
  }

  // Build order items with verified prices
  const orderItems = items.map((item) => {
    const product = products.find((p) => p.id === item.productId)!;
    return {
      productId: item.productId,
      quantity: item.quantity,
      price: product.price, // Use DB price, not client-sent price
      stock: product.stock,
    };
  });

  // Check stock for each item
  for (const item of orderItems) {
    if (item.stock < item.quantity) {
      const product = products.find((p) => p.id === item.productId)!;
      return NextResponse.json(
        { error: `商品「${product.titleZh}」库存不足（剩余 ${item.stock}）` },
        { status: 400 }
      );
    }
  }

  const totalPrice = orderItems.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0
  );

  // Create order in a transaction
  try {
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          userId: session.user.id,
          totalPrice,
          notes: JSON.stringify({ address, paymentMethod }),
          items: {
            create: orderItems.map(({ productId, quantity, price }) => ({
              productId,
              quantity,
              price,
            })),
          },
        },
        include: {
          items: {
            include: { product: { select: { titleZh: true, images: true } } },
          },
        },
      });

      // Deduct stock for each product
      for (const item of orderItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      return newOrder;
    });

    return NextResponse.json({ orderId: order.id }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/orders] Transaction error:", err);
    return NextResponse.json(
      { error: "下单失败，请稍后重试", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
