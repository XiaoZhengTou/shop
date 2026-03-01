"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, EyeOff, Eye } from "lucide-react";

interface Product {
  id: string;
  sku: string;
  titleZh: string;
  titleEn: string;
  price: unknown;
  stock: number;
  category: string;
  status: string;
  images: string[];
  createdAt: Date;
}

const STATUS_STYLE: Record<string, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  DRAFT: "bg-neutral-100 text-neutral-500 border-neutral-200",
  INACTIVE: "bg-red-50 text-red-600 border-red-200",
  OUT_OF_STOCK: "bg-amber-50 text-amber-700 border-amber-200",
};

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "上架",
  DRAFT: "草稿",
  INACTIVE: "下架",
  OUT_OF_STOCK: "缺货",
};

export default function ProductTable({ products }: { products: Product[] }) {
  const router = useRouter();
  const [items, setItems] = useState(products);
  const [toggling, setToggling] = useState<string | null>(null);

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    setToggling(id);

    const res = await fetch(`/api/admin/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });

    if (res.ok) {
      setItems((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p))
      );
      router.refresh();
    }
    setToggling(null);
  };

  if (items.length === 0) {
    return (
      <div className="bg-white border border-neutral-200 px-6 py-16 text-center">
        <p className="font-sans text-sm text-neutral-400">暂无商品，点击右上角新增</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-neutral-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50">
              {["商品", "SKU", "分类", "价格", "库存", "状态", "操作"].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 font-sans text-xs font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {items.map((product) => (
              <tr key={product.id} className="hover:bg-neutral-50 transition-colors duration-150">
                {/* Product */}
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-12 bg-neutral-100 shrink-0 overflow-hidden">
                      {product.images[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.images[0]}
                          alt={product.titleZh}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-neutral-200" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-sans text-sm font-medium text-neutral-900 truncate max-w-[180px]">
                        {product.titleZh}
                      </p>
                      <p className="font-sans text-xs text-neutral-400 truncate max-w-[180px]">
                        {product.titleEn}
                      </p>
                    </div>
                  </div>
                </td>
                {/* SKU */}
                <td className="px-4 py-4">
                  <span className="font-mono text-xs text-neutral-500">{product.sku}</span>
                </td>
                {/* Category */}
                <td className="px-4 py-4">
                  <span className="font-sans text-sm text-neutral-600">{product.category}</span>
                </td>
                {/* Price */}
                <td className="px-4 py-4">
                  <span className="font-sans text-sm font-medium text-neutral-900">
                    ¥{Number(product.price).toFixed(2)}
                  </span>
                </td>
                {/* Stock */}
                <td className="px-4 py-4">
                  <span
                    className={`font-sans text-sm ${
                      product.stock === 0 ? "text-red-500" : product.stock < 5 ? "text-amber-600" : "text-neutral-700"
                    }`}
                  >
                    {product.stock}
                  </span>
                </td>
                {/* Status */}
                <td className="px-4 py-4">
                  <span
                    className={`inline-block border font-sans text-xs px-2 py-0.5 ${STATUS_STYLE[product.status] || "bg-neutral-100 text-neutral-500"}`}
                  >
                    {STATUS_LABEL[product.status] || product.status}
                  </span>
                </td>
                {/* Actions */}
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <a
                      href={`/dashboard/products/${product.id}/edit`}
                      className="p-1.5 text-neutral-400 hover:text-neutral-900 transition-colors duration-200 cursor-pointer"
                      title="编辑"
                    >
                      <Pencil size={14} />
                    </a>
                    <button
                      onClick={() => toggleStatus(product.id, product.status)}
                      disabled={toggling === product.id}
                      className="p-1.5 text-neutral-400 hover:text-neutral-900 disabled:opacity-50 transition-colors duration-200 cursor-pointer"
                      title={product.status === "ACTIVE" ? "下架" : "上架"}
                    >
                      {product.status === "ACTIVE" ? (
                        <EyeOff size={14} />
                      ) : (
                        <Eye size={14} />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
