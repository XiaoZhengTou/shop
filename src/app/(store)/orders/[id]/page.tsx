import { notFound } from "next/navigation";
import { CheckCircle, Clock, Truck, PackageCheck, XCircle, RotateCcw } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import MockPayButton from "./MockPayButton";

interface OrderAddress {
  name: string;
  phone: string;
  province: string;
  city: string;
  district?: string;
  detail: string;
}

type OrderStatus =
  | "PENDING" | "PAID" | "SHIPPED" | "DELIVERED"
  | "CANCELLED" | "REFUNDED"
  | "RETURN_REQUESTED" | "RETURN_APPROVED" | "RETURN_COMPLETED";

// Normal fulfillment steps
const FULFILLMENT_STEPS: { status: OrderStatus; label: string; desc: string }[] = [
  { status: "PENDING",   label: "待支付",   desc: "订单已提交，等待支付" },
  { status: "PAID",      label: "已支付",   desc: "付款成功，等待商家发货" },
  { status: "SHIPPED",   label: "已发货",   desc: "商品已由商家发出" },
  { status: "DELIVERED", label: "已签收",   desc: "商品已送达，订单完成" },
];

const STATUS_ORDER: Record<string, number> = {
  PENDING: 0, PAID: 1, SHIPPED: 2, DELIVERED: 3,
};

const ABNORMAL_STATUSES = new Set([
  "CANCELLED", "REFUNDED", "RETURN_REQUESTED", "RETURN_APPROVED", "RETURN_COMPLETED",
]);

const ABNORMAL_INFO: Record<string, { label: string; color: string; desc: string }> = {
  CANCELLED:        { label: "已取消",     color: "text-neutral-500", desc: "订单已取消" },
  REFUNDED:         { label: "已退款",     color: "text-neutral-500", desc: "退款已处理完成" },
  RETURN_REQUESTED: { label: "退货申请中", color: "text-orange-600",  desc: "退货申请已提交，等待商家处理" },
  RETURN_APPROVED:  { label: "退货已批准", color: "text-orange-600",  desc: "商家已批准退货，请按指引寄回商品" },
  RETURN_COMPLETED: { label: "退货完成",   color: "text-neutral-500", desc: "退货流程已完成" },
};

async function getOrder(id: string, userId: string) {
  try {
    return await prisma.order.findFirst({
      where: { id, userId },
      include: {
        items: {
          include: {
            product: { select: { titleZh: true, images: true } },
          },
        },
      },
    });
  } catch {
    return null;
  }
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="font-sans text-sm text-neutral-500">
          请先{" "}
          <a href="/login" className="text-neutral-900 underline">
            登录
          </a>{" "}
          查看订单
        </p>
      </div>
    );
  }

  const { id } = await params;
  const order = await getOrder(id, session.user.id);
  if (!order) notFound();

  const status = order.status as OrderStatus;
  const notes = order.notes
    ? (JSON.parse(order.notes) as { address: OrderAddress; paymentMethod: string })
    : null;
  const address = notes?.address;
  const isAbnormal = ABNORMAL_STATUSES.has(status);
  const currentStep = STATUS_ORDER[status] ?? 0;

  // Header icon + title
  const headerMap: Record<string, { icon: React.ElementType; iconClass: string; title: string }> = {
    PENDING:          { icon: Clock,        iconClass: "text-amber-400",   title: "待支付" },
    PAID:             { icon: CheckCircle,  iconClass: "text-emerald-500", title: "支付成功，等待发货" },
    SHIPPED:          { icon: Truck,        iconClass: "text-blue-500",    title: "商品已发货" },
    DELIVERED:        { icon: PackageCheck, iconClass: "text-emerald-500", title: "订单已完成" },
    CANCELLED:        { icon: XCircle,      iconClass: "text-neutral-400", title: "订单已取消" },
    REFUNDED:         { icon: XCircle,      iconClass: "text-neutral-400", title: "订单已退款" },
    RETURN_REQUESTED: { icon: RotateCcw,    iconClass: "text-orange-500",  title: "退货申请中" },
    RETURN_APPROVED:  { icon: RotateCcw,    iconClass: "text-orange-500",  title: "退货已批准" },
    RETURN_COMPLETED: { icon: CheckCircle,  iconClass: "text-neutral-400", title: "退货完成" },
  };
  const header = headerMap[status] ?? headerMap.PENDING;
  const HeaderIcon = header.icon;

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-6 py-16">

      {/* Header */}
      <div className="flex flex-col items-center text-center mb-10">
        <HeaderIcon size={48} className={`${header.iconClass} mb-4`} />
        <h1 className="font-serif text-3xl font-semibold text-neutral-900">
          {header.title}
        </h1>
        <p className="mt-2 font-sans text-sm text-neutral-500">
          订单号：<span className="font-mono text-neutral-700">{order.id}</span>
        </p>
        <p className="mt-1 font-sans text-xs text-neutral-400">
          下单时间：{new Date(order.createdAt).toLocaleString("zh-CN")}
        </p>
      </div>

      {/* Status timeline (normal flow only) */}
      {!isAbnormal && (
        <section className="mb-10">
          <div className="flex items-start gap-0">
            {FULFILLMENT_STEPS.map((step, idx) => {
              const done = STATUS_ORDER[step.status] <= currentStep;
              const active = STATUS_ORDER[step.status] === currentStep;
              const isLast = idx === FULFILLMENT_STEPS.length - 1;

              return (
                <div key={step.status} className="flex-1 flex flex-col items-center">
                  {/* Dot + line */}
                  <div className="flex items-center w-full">
                    {/* Left line */}
                    <div
                      className={`flex-1 h-px ${idx === 0 ? "invisible" : done ? "bg-neutral-900" : "bg-neutral-200"}`}
                    />
                    {/* Dot */}
                    <div
                      className={`w-3 h-3 rounded-full border-2 shrink-0 ${
                        active
                          ? "border-neutral-900 bg-neutral-900"
                          : done
                          ? "border-neutral-900 bg-neutral-900"
                          : "border-neutral-300 bg-white"
                      }`}
                    />
                    {/* Right line */}
                    <div
                      className={`flex-1 h-px ${isLast ? "invisible" : done && !active ? "bg-neutral-900" : "bg-neutral-200"}`}
                    />
                  </div>

                  {/* Label */}
                  <div className="mt-2 text-center px-1">
                    <p
                      className={`font-sans text-xs font-medium ${
                        active ? "text-neutral-900" : done ? "text-neutral-600" : "text-neutral-300"
                      }`}
                    >
                      {step.label}
                    </p>
                    {active && (
                      <p className="mt-0.5 font-sans text-xs text-neutral-400 leading-tight">
                        {step.desc}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Abnormal status notice */}
      {isAbnormal && (
        <section className="mb-8 border border-neutral-200 p-4 bg-neutral-50">
          <p className={`font-sans text-sm font-medium ${ABNORMAL_INFO[status]?.color ?? "text-neutral-600"}`}>
            {ABNORMAL_INFO[status]?.label}
          </p>
          <p className="mt-1 font-sans text-xs text-neutral-500">
            {ABNORMAL_INFO[status]?.desc}
          </p>
        </section>
      )}

      {/* Order items */}
      <section className="border border-neutral-200 divide-y divide-neutral-100 mb-8">
        {order.items.map((item) => (
          <div key={item.id} className="flex gap-4 p-4">
            <div className="w-16 h-20 bg-neutral-50 flex-shrink-0 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.product.images[0] || "/images/placeholder.svg"}
                alt={item.product.titleZh}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 flex justify-between items-start">
              <div>
                <p className="font-sans text-sm text-neutral-900">{item.product.titleZh}</p>
                <p className="mt-1 font-sans text-xs text-neutral-500">x{item.quantity}</p>
              </div>
              <p className="font-sans text-sm font-medium text-neutral-900">
                ¥{(Number(item.price) * item.quantity).toFixed(2)}
              </p>
            </div>
          </div>
        ))}
        <div className="flex justify-between items-center px-4 py-3 bg-neutral-50">
          <span className="font-sans text-sm text-neutral-500">订单总计</span>
          <span className="font-sans text-sm font-semibold text-neutral-900">
            ¥{Number(order.totalPrice).toFixed(2)}
          </span>
        </div>
      </section>

      {/* Shipping address */}
      {address && (
        <section className="mb-8">
          <h2 className="font-sans text-xs font-semibold text-neutral-900 uppercase tracking-widest mb-3">
            收货地址
          </h2>
          <div className="border border-neutral-200 p-4">
            <p className="font-sans text-sm text-neutral-900 font-medium">
              {address.name} · {address.phone}
            </p>
            <p className="mt-1 font-sans text-sm text-neutral-600">
              {address.province} {address.city} {address.district}
            </p>
            <p className="font-sans text-sm text-neutral-600">{address.detail}</p>
          </div>
        </section>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        {status === "PENDING" && <MockPayButton orderId={order.id} />}
        <a
          href="/account/orders"
          className="flex-1 flex items-center justify-center border border-neutral-900 font-sans text-sm font-medium py-3 hover:bg-neutral-50 transition-colors duration-200"
        >
          查看所有订单
        </a>
        <a
          href="/products"
          className="flex-1 flex items-center justify-center bg-neutral-900 text-white font-sans text-sm font-medium py-3 hover:bg-neutral-700 transition-colors duration-200"
        >
          继续购物
        </a>
      </div>
    </div>
  );
}
