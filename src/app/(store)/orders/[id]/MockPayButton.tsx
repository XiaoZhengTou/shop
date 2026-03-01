"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Loader2 } from "lucide-react";

export default function MockPayButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePay = async () => {
    setLoading(true);
    setError("");

    const res = await fetch(`/api/orders/${orderId}/pay`, { method: "POST" });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "支付失败，请重试");
      return;
    }

    router.refresh();
  };

  if (error) {
    return (
      <p className="font-sans text-sm text-red-600 text-center">{error}</p>
    );
  }

  return (
    <button
      onClick={handlePay}
      disabled={loading}
      className="flex-1 flex items-center justify-center gap-2 bg-[#D4AF37] text-white font-sans text-sm font-medium py-3 hover:bg-[#B8960F] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 cursor-pointer"
    >
      {loading ? (
        <>
          <Loader2 size={16} className="animate-spin" />
          处理中…
        </>
      ) : (
        <>
          <CreditCard size={16} />
          模拟支付（演示）
        </>
      )}
    </button>
  );
}
