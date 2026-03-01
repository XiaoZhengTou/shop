import { prisma } from "@/lib/prisma";
import OrdersTable from "./OrdersTable";

async function getOrders() {
  try {
    const rows = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: {
          include: {
            product: { select: { titleZh: true } },
          },
        },
        _count: { select: { items: true } },
      },
    });
    // Serialize Decimal → string so Client Components can receive the data
    return rows.map((o) => ({
      ...o,
      totalPrice: o.totalPrice.toString(),
      items: o.items.map((item) => ({
        ...item,
        price: item.price.toString(),
      })),
    }));
  } catch {
    return [];
  }
}

export default async function OrdersPage() {
  const orders = await getOrders();

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "PENDING").length,
    paid: orders.filter((o) => o.status === "PAID").length,
    shipped: orders.filter((o) => o.status === "SHIPPED").length,
  };

  return (
    <div>
      <h1 className="font-serif text-4xl font-semibold text-neutral-900 mb-2">
        Orders
      </h1>
      <p className="font-sans text-sm text-neutral-500 mb-8">
        查看和管理所有客户订单
      </p>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "全部订单", value: stats.total, color: "text-neutral-900" },
          { label: "待支付", value: stats.pending, color: "text-amber-600" },
          { label: "已支付", value: stats.paid, color: "text-emerald-600" },
          { label: "已发货", value: stats.shipped, color: "text-blue-600" },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-neutral-200 p-5">
            <p className={`font-sans text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="mt-1 font-sans text-xs text-neutral-500">{s.label}</p>
          </div>
        ))}
      </div>

      <OrdersTable orders={orders} />
    </div>
  );
}
