import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Package, ArrowRight } from "lucide-react";
import { toDisplayImageUrl } from "@/lib/blob-image";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "待支付",
  PAID: "已支付",
  SHIPPED: "已发货",
  DELIVERED: "已签收",
  CANCELLED: "已取消",
  REFUNDED: "已退款",
  RETURN_REQUESTED: "退货申请中",
  RETURN_APPROVED: "退货已批准",
  RETURN_COMPLETED: "退货完成",
};

const STATUS_COLOR: Record<string, string> = {
  PENDING: "text-amber-600",
  PAID: "text-emerald-600",
  SHIPPED: "text-blue-600",
  DELIVERED: "text-emerald-600",
  CANCELLED: "text-neutral-400",
  REFUNDED: "text-neutral-400",
};

async function getUserOrders(userId: string) {
  try {
    return await prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          include: {
            product: { select: { titleZh: true, images: true } },
          },
          take: 3,
        },
        _count: { select: { items: true } },
      },
    });
  } catch {
    return [];
  }
}

export default async function AccountOrdersPage() {
  const session = await auth();
  if (!session?.user?.id) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="font-sans text-sm text-neutral-500">
          请先{" "}
          <a href="/login?callbackUrl=/account/orders" className="text-neutral-900 underline">
            登录
          </a>{" "}
          查看订单
        </p>
      </div>
    );
  }

  const orders = await getUserOrders(session.user.id);

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-12">
      <h1 className="font-serif text-3xl font-semibold text-neutral-900 mb-10">
        我的订单
      </h1>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center">
          <Package size={40} className="text-neutral-300 mb-4" />
          <p className="font-sans text-sm text-neutral-500">暂无订单</p>
          <a
            href="/products"
            className="mt-6 inline-block bg-neutral-900 text-white font-sans text-sm font-medium px-8 py-3 hover:bg-neutral-700 transition-colors duration-200"
          >
            去选购
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <a
              key={order.id}
              href={`/orders/${order.id}`}
              className="block border border-neutral-200 hover:border-neutral-400 transition-colors duration-200 group"
            >
              {/* Order header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-100 bg-neutral-50">
                <div className="flex items-center gap-4">
                  <span className="font-mono text-xs text-neutral-500 truncate max-w-[180px]">
                    {order.id}
                  </span>
                  <span
                    className={`font-sans text-xs font-medium ${STATUS_COLOR[order.status] || "text-neutral-600"}`}
                  >
                    {STATUS_LABEL[order.status] || order.status}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-sans text-sm font-semibold text-neutral-900">
                    ¥{Number(order.totalPrice).toFixed(2)}
                  </span>
                  <ArrowRight
                    size={14}
                    className="text-neutral-400 group-hover:text-neutral-900 transition-colors duration-200"
                  />
                </div>
              </div>

              {/* Order items preview */}
              <div className="flex gap-3 p-4 overflow-hidden">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="w-14 h-18 bg-neutral-50 flex-shrink-0 overflow-hidden border border-neutral-100"
                    style={{ height: "72px" }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={toDisplayImageUrl(item.product.images[0] || "/images/placeholder.svg")}
                      alt={item.product.titleZh}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
                {order._count.items > 3 && (
                  <div
                    className="w-14 flex-shrink-0 bg-neutral-100 flex items-center justify-center border border-neutral-100"
                    style={{ height: "72px" }}
                  >
                    <span className="font-sans text-xs text-neutral-500">
                      +{order._count.items - 3}
                    </span>
                  </div>
                )}
                <div className="flex-1 flex items-end justify-end">
                  <p className="font-sans text-xs text-neutral-400">
                    {new Date(order.createdAt).toLocaleDateString("zh-CN")}
                  </p>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
