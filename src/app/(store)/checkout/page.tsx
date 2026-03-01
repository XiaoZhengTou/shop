"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCartStore } from "@/lib/store/cart";
import { Loader2 } from "lucide-react";

const PAYMENT_METHODS = [
  { value: "alipay", label: "支付宝" },
  { value: "wechat", label: "微信支付" },
  { value: "card", label: "银行卡" },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { items, totalPrice, clearCart } = useCartStore();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    province: "",
    city: "",
    district: "",
    detail: "",
  });
  const [payment, setPayment] = useState("alipay");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Redirect unauthenticated users
  if (status === "unauthenticated") {
    router.replace("/login?callbackUrl=/checkout");
    return null;
  }

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={24} className="animate-spin text-neutral-400" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="font-sans text-sm text-neutral-500">购物车是空的</p>
        <a href="/products" className="mt-4 inline-block font-sans text-sm text-neutral-900 underline">
          去选购
        </a>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.name || !form.phone || !form.province || !form.city || !form.detail) {
      setError("请填写完整收货信息");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: items.map((i) => ({
          productId: i.id,
          quantity: i.quantity,
          price: i.price,
        })),
        address: form,
        paymentMethod: payment,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "下单失败，请重试");
      return;
    }

    clearCart();
    router.push(`/orders/${data.orderId}`);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 py-12">
      <h1 className="font-serif text-3xl font-semibold text-neutral-900 mb-10">
        结账
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
        {/* Left: Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-3 space-y-8">
          {/* Shipping */}
          <section>
            <h2 className="font-sans text-xs font-semibold text-neutral-900 uppercase tracking-widest mb-5">
              收货地址
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-sans text-xs text-neutral-500 mb-1.5">
                    收货人
                  </label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    className="w-full border border-neutral-200 px-3 py-2.5 font-sans text-sm focus:outline-none focus:border-neutral-900 transition-colors"
                    placeholder="姓名"
                  />
                </div>
                <div>
                  <label className="block font-sans text-xs text-neutral-500 mb-1.5">
                    手机号
                  </label>
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    required
                    className="w-full border border-neutral-200 px-3 py-2.5 font-sans text-sm focus:outline-none focus:border-neutral-900 transition-colors"
                    placeholder="11 位手机号"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block font-sans text-xs text-neutral-500 mb-1.5">
                    省份
                  </label>
                  <input
                    name="province"
                    value={form.province}
                    onChange={handleChange}
                    required
                    className="w-full border border-neutral-200 px-3 py-2.5 font-sans text-sm focus:outline-none focus:border-neutral-900 transition-colors"
                    placeholder="省"
                  />
                </div>
                <div>
                  <label className="block font-sans text-xs text-neutral-500 mb-1.5">
                    城市
                  </label>
                  <input
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    required
                    className="w-full border border-neutral-200 px-3 py-2.5 font-sans text-sm focus:outline-none focus:border-neutral-900 transition-colors"
                    placeholder="市"
                  />
                </div>
                <div>
                  <label className="block font-sans text-xs text-neutral-500 mb-1.5">
                    区/县
                  </label>
                  <input
                    name="district"
                    value={form.district}
                    onChange={handleChange}
                    className="w-full border border-neutral-200 px-3 py-2.5 font-sans text-sm focus:outline-none focus:border-neutral-900 transition-colors"
                    placeholder="区（选填）"
                  />
                </div>
              </div>

              <div>
                <label className="block font-sans text-xs text-neutral-500 mb-1.5">
                  详细地址
                </label>
                <input
                  name="detail"
                  value={form.detail}
                  onChange={handleChange}
                  required
                  className="w-full border border-neutral-200 px-3 py-2.5 font-sans text-sm focus:outline-none focus:border-neutral-900 transition-colors"
                  placeholder="街道、楼号、门牌号"
                />
              </div>
            </div>
          </section>

          {/* Payment */}
          <section>
            <h2 className="font-sans text-xs font-semibold text-neutral-900 uppercase tracking-widest mb-5">
              支付方式
            </h2>
            <div className="flex flex-col gap-3">
              {PAYMENT_METHODS.map((m) => (
                <label
                  key={m.value}
                  className={`flex items-center gap-3 border px-4 py-3 cursor-pointer transition-colors duration-200 ${
                    payment === m.value
                      ? "border-neutral-900 bg-neutral-50"
                      : "border-neutral-200 hover:border-neutral-400"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value={m.value}
                    checked={payment === m.value}
                    onChange={() => setPayment(m.value)}
                    className="accent-neutral-900"
                  />
                  <span className="font-sans text-sm text-neutral-900">
                    {m.label}
                  </span>
                </label>
              ))}
            </div>
          </section>

          {error && (
            <p className="font-sans text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#D4AF37] text-white font-sans text-sm font-medium py-4 hover:bg-[#B8960F] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 cursor-pointer"
          >
            {loading ? "提交中…" : `确认下单 · ¥${totalPrice().toFixed(2)}`}
          </button>
        </form>

        {/* Right: Order Summary */}
        <div className="lg:col-span-2">
          <h2 className="font-sans text-xs font-semibold text-neutral-900 uppercase tracking-widest mb-5">
            订单明细
          </h2>
          <div className="border border-neutral-200 divide-y divide-neutral-100">
            {items.map((item) => (
              <div key={item.id} className="flex gap-3 p-4">
                <div className="w-16 h-20 bg-neutral-50 flex-shrink-0 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.image}
                    alt={item.titleZh}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-sans text-sm text-neutral-900 line-clamp-2 leading-snug">
                    {item.titleZh}
                  </p>
                  <p className="mt-1 font-sans text-xs text-neutral-500">
                    x{item.quantity}
                  </p>
                  <p className="mt-1 font-sans text-sm font-medium text-neutral-900">
                    ¥{(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-between font-sans text-sm">
            <span className="text-neutral-500">合计</span>
            <span className="font-semibold text-neutral-900">
              ¥{totalPrice().toFixed(2)}
            </span>
          </div>
          <p className="mt-2 font-sans text-xs text-neutral-400">
            含税，不含运费（演示项目）
          </p>
        </div>
      </div>
    </div>
  );
}
