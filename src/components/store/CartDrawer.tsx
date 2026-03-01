"use client";

import { useCartStore } from "@/lib/store/cart";
import { X, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import Image from "next/image";
import { useSession } from "next-auth/react";

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, totalPrice, totalItems } =
    useCartStore();
  const { data: session } = useSession();
  const checkoutHref = session ? "/checkout" : "/login?callbackUrl=/checkout";

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-50 backdrop-blur-sm"
        onClick={closeCart}
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white z-50 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-200">
          <div className="flex items-center gap-3">
            <ShoppingBag size={18} className="text-neutral-900" />
            <h2 className="font-serif text-xl font-semibold text-neutral-900">
              购物袋
            </h2>
            {totalItems() > 0 && (
              <span className="font-sans text-xs text-neutral-500">
                ({totalItems()} 件)
              </span>
            )}
          </div>
          <button
            onClick={closeCart}
            aria-label="关闭购物袋"
            className="text-neutral-400 hover:text-neutral-900 transition-colors duration-200 cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <ShoppingBag size={48} className="text-neutral-200 mb-4" />
              <p className="font-serif text-xl text-neutral-400">购物袋是空的</p>
              <p className="mt-2 font-sans text-sm text-neutral-400">
                去挑选一些心仪的商品吧
              </p>
              <button
                onClick={closeCart}
                className="mt-8 font-sans text-sm text-neutral-900 border border-neutral-900 px-6 py-2 hover:bg-neutral-900 hover:text-white transition-colors duration-200 cursor-pointer"
              >
                继续购物
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {items.map((item) => (
                <li key={item.id} className="flex gap-4 px-6 py-5">
                  {/* Image */}
                  <a href={`/products/${item.id}`} onClick={closeCart}>
                    <div className="w-20 h-[106px] relative bg-neutral-50 border border-neutral-200 shrink-0">
                      <Image
                        src={item.image || "/images/placeholder.svg"}
                        alt={item.titleZh}
                        fill
                        className="object-cover"
                        unoptimized={item.image?.endsWith(".svg")}
                        onError={() => {}}
                      />
                    </div>
                  </a>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <a
                      href={`/products/${item.id}`}
                      onClick={closeCart}
                      className="font-sans text-sm font-medium text-neutral-900 hover:text-neutral-600 transition-colors duration-200 cursor-pointer line-clamp-2"
                    >
                      {item.titleZh}
                    </a>
                    <p className="mt-1 font-sans text-xs text-neutral-400">{item.category}</p>
                    <p className="mt-2 font-sans text-sm font-bold text-neutral-900">
                      ¥{item.price}
                    </p>

                    {/* Quantity controls */}
                    <div className="mt-3 flex items-center gap-3">
                      <div className="flex items-center border border-neutral-200">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          aria-label="减少数量"
                          className="w-8 h-8 flex items-center justify-center text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50 transition-colors duration-200 cursor-pointer"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-8 text-center font-sans text-sm text-neutral-900">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          aria-label="增加数量"
                          className="w-8 h-8 flex items-center justify-center text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50 transition-colors duration-200 cursor-pointer"
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(item.id)}
                        aria-label="删除商品"
                        className="text-neutral-300 hover:text-red-500 transition-colors duration-200 cursor-pointer ml-auto"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer — only show when items exist */}
        {items.length > 0 && (
          <div className="border-t border-neutral-200 px-6 py-6 space-y-4 bg-white">
            {/* Subtotal */}
            <div className="flex items-center justify-between">
              <span className="font-sans text-sm text-neutral-600">小计</span>
              <span className="font-sans text-lg font-bold text-neutral-900">
                ¥{totalPrice().toFixed(2)}
              </span>
            </div>
            <p className="font-sans text-xs text-neutral-400">
              运费将在结账时计算
            </p>

            {/* Checkout CTA */}
            <a
              href={checkoutHref}
              onClick={closeCart}
              className="block w-full text-center bg-neutral-900 text-white font-sans text-sm font-medium py-4 hover:bg-neutral-700 transition-colors duration-200 cursor-pointer"
            >
              {session ? "前往结账" : "登录后结账"}
            </a>

            {/* Continue shopping CTA */}
            <button
              onClick={closeCart}
              className="block w-full text-center border border-neutral-200 text-neutral-600 font-sans text-sm py-3 hover:border-neutral-900 hover:text-neutral-900 transition-colors duration-200 cursor-pointer"
            >
              继续购物
            </button>
          </div>
        )}
      </div>
    </>
  );
}
