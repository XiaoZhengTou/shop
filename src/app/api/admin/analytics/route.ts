import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Returns analytics data for the last N days
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = Math.min(90, Math.max(7, parseInt(searchParams.get("days") ?? "30")));
    // Use midnight UTC so today always has a bucket
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const since = new Date(todayStart.getTime() - days * 24 * 60 * 60 * 1000);

    // Daily revenue + order count for the period
    const orders = await prisma.order.findMany({
      where: { createdAt: { gte: since }, status: { in: ["PAID", "SHIPPED", "DELIVERED"] } },
      select: { totalPrice: true, createdAt: true, items: { select: { quantity: true } } },
      orderBy: { createdAt: "asc" },
    });

    // Build daily buckets (i <= days to include today)
    const buckets: Record<string, { date: string; revenue: number; orders: number; units: number }> = {};
    for (let i = 0; i <= days; i++) {
      const d = new Date(since.getTime() + i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      buckets[key] = { date: key, revenue: 0, orders: 0, units: 0 };
    }
    for (const order of orders) {
      const key = order.createdAt.toISOString().slice(0, 10);
      if (buckets[key]) {
        buckets[key].revenue += Number(order.totalPrice);
        buckets[key].orders += 1;
        buckets[key].units += order.items.reduce((s, i) => s + i.quantity, 0);
      }
    }
    const dailySales = Object.values(buckets);

    // Top products by revenue
    const orderItems = await prisma.orderItem.findMany({
      where: { order: { createdAt: { gte: since }, status: { in: ["PAID", "SHIPPED", "DELIVERED"] } } },
      select: {
        quantity: true,
        price: true,
        product: { select: { id: true, titleZh: true, sku: true, category: true } },
      },
    });

    const productMap: Record<string, { id: string; titleZh: string; sku: string; category: string; revenue: number; units: number }> = {};
    for (const item of orderItems) {
      const pid = item.product.id;
      if (!productMap[pid]) {
        productMap[pid] = { ...item.product, revenue: 0, units: 0 };
      }
      productMap[pid].revenue += Number(item.price) * item.quantity;
      productMap[pid].units += item.quantity;
    }
    const topProducts = Object.values(productMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Category breakdown
    const categoryMap: Record<string, { category: string; revenue: number; units: number }> = {};
    for (const p of Object.values(productMap)) {
      if (!categoryMap[p.category]) categoryMap[p.category] = { category: p.category, revenue: 0, units: 0 };
      categoryMap[p.category].revenue += p.revenue;
      categoryMap[p.category].units += p.units;
    }
    const categoryBreakdown = Object.values(categoryMap).sort((a, b) => b.revenue - a.revenue);

    // Summary stats
    const totalRevenue = dailySales.reduce((s, d) => s + d.revenue, 0);
    const totalOrders = dailySales.reduce((s, d) => s + d.orders, 0);
    const totalUnits = dailySales.reduce((s, d) => s + d.units, 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Active products count
    const activeProducts = await prisma.product.count({ where: { status: "ACTIVE" } });

    return NextResponse.json({
      period: { days, since: since.toISOString() },
      summary: { totalRevenue, totalOrders, totalUnits, avgOrderValue, activeProducts },
      dailySales,
      topProducts,
      categoryBreakdown,
    });
  } catch (error) {
    console.error("[GET /api/admin/analytics]", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
