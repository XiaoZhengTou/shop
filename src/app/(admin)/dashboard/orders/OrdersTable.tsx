"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Package } from "lucide-react";
import { useRouter } from "next/navigation";

type OrderStatus =
  | "PENDING"
  | "PAID"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED"
  | "RETURN_REQUESTED"
  | "RETURN_APPROVED"
  | "RETURN_COMPLETED";

interface OrderItem {
  id: string;
  quantity: number;
  price: string;
  product: { titleZh: string };
}

interface Order {
  id: string;
  status: OrderStatus;
  totalPrice: string;
  currency: string;
  createdAt: Date;
  notes: string | null;
  user: { id: string; name: string | null; email: string | null };
  items: OrderItem[];
  _count: { items: number };
}

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

const STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  PAID: "bg-emerald-50 text-emerald-700 border-emerald-200",
  SHIPPED: "bg-blue-50 text-blue-700 border-blue-200",
  DELIVERED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CANCELLED: "bg-neutral-100 text-neutral-500 border-neutral-200",
  REFUNDED: "bg-neutral-100 text-neutral-500 border-neutral-200",
  RETURN_REQUESTED: "bg-orange-50 text-orange-700 border-orange-200",
  RETURN_APPROVED: "bg-orange-50 text-orange-700 border-orange-200",
  RETURN_COMPLETED: "bg-neutral-100 text-neutral-500 border-neutral-200",
};

// Status transitions available to admin
const NEXT_STATUSES: Record<string, OrderStatus[]> = {
  PAID: ["SHIPPED"],
  SHIPPED: ["DELIVERED"],
  RETURN_REQUESTED: ["RETURN_APPROVED", "CANCELLED"],
  RETURN_APPROVED: ["RETURN_COMPLETED"],
};

function OrderRow({ order }: { order: Order }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [updating, setUpdating] = useState(false);

  const notes = order.notes
    ? (JSON.parse(order.notes) as { address?: { name: string; phone: string; province: string; city: string; district?: string; detail: string }; paymentMethod?: string })
    : null;
  const address = notes?.address;
  const nextStatuses = NEXT_STATUSES[order.status] ?? [];

  const handleStatusUpdate = async (newStatus: OrderStatus) => {
    setUpdating(true);
    await fetch(`/api/admin/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setUpdating(false);
    router.refresh();
  };

  return (
    <div className="bg-white border border-neutral-200">
      {/* Row header */}
      <div className="flex items-center gap-4 px-5 py-4">
        <span
          className={`shrink-0 inline-block border font-sans text-xs px-2 py-0.5 ${STATUS_STYLE[order.status] ?? ""}`}
        >
          {STATUS_LABEL[order.status] ?? order.status}
        </span>
        <span className="font-mono text-xs text-neutral-400 truncate max-w-[180px]">
          {order.id}
        </span>
        <span className="font-sans text-sm text-neutral-700 flex-1 truncate">
          {order.user.name || order.user.email || "匿名用户"}
        </span>
        <span className="font-sans text-sm font-semibold text-neutral-900 shrink-0">
          ¥{Number(order.totalPrice).toFixed(2)}
        </span>
        <span className="font-sans text-xs text-neutral-400 shrink-0">
          {new Date(order.createdAt).toLocaleDateString("zh-CN")}
        </span>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer shrink-0"
          aria-label={expanded ? "收起" : "展开"}
        >
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-neutral-100 px-5 py-4 space-y-4">
          {/* Items */}
          <div>
            <p className="font-sans text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
              商品明细
            </p>
            <div className="space-y-1">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between font-sans text-sm">
                  <span className="text-neutral-700">
                    {item.product.titleZh} × {item.quantity}
                  </span>
                  <span className="text-neutral-900">
                    ¥{(Number(item.price) * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Address + payment */}
          {address && (
            <div>
              <p className="font-sans text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                收货地址
              </p>
              <p className="font-sans text-sm text-neutral-700">
                {address.name} · {address.phone}
              </p>
              <p className="font-sans text-sm text-neutral-500">
                {address.province} {address.city} {address.district} {address.detail}
              </p>
              {notes?.paymentMethod && (
                <p className="font-sans text-xs text-neutral-400 mt-1">
                  支付方式：{notes.paymentMethod}
                </p>
              )}
            </div>
          )}

          {/* Status actions */}
          {nextStatuses.length > 0 && (
            <div className="flex gap-2 pt-2 border-t border-neutral-100">
              {nextStatuses.map((s) => (
                <button
                  key={s}
                  disabled={updating}
                  onClick={() => handleStatusUpdate(s)}
                  className="font-sans text-xs px-4 py-2 bg-neutral-900 text-white hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  {updating ? "更新中…" : `标记为：${STATUS_LABEL[s]}`}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function OrdersTable({ orders }: { orders: Order[] }) {
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const filtered =
    statusFilter === "ALL"
      ? orders
      : orders.filter((o) => o.status === statusFilter);

  const filterOptions = [
    { value: "ALL", label: "全部" },
    { value: "PENDING", label: "待支付" },
    { value: "PAID", label: "已支付" },
    { value: "SHIPPED", label: "已发货" },
    { value: "DELIVERED", label: "已签收" },
    { value: "CANCELLED", label: "已取消" },
  ];

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {filterOptions.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`font-sans text-xs px-3 py-1.5 border transition-colors cursor-pointer ${
              statusFilter === f.value
                ? "bg-neutral-900 text-white border-neutral-900"
                : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-neutral-200 px-6 py-16 text-center">
          <Package size={32} className="text-neutral-200 mx-auto mb-3" />
          <p className="font-sans text-sm text-neutral-400">暂无订单</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((order) => (
            <OrderRow key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}
