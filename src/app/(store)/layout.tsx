import type { ReactNode } from "react";
import StoreNav from "@/components/store/StoreNav";
import AiChatWidget from "@/components/store/AiChatWidget";
import CartDrawer from "@/components/store/CartDrawer";

export default function StoreLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <StoreNav />
      <main>{children}</main>
      <AiChatWidget />
      <CartDrawer />
      <footer className="border-t border-neutral-200 py-12 mt-16">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between gap-8">
            <div>
              <p className="font-serif text-xl font-semibold text-neutral-900">StyleAI</p>
              <p className="mt-2 font-sans text-sm text-neutral-500">AI-Powered Fashion</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8 text-sm font-sans">
              <div>
                <p className="font-semibold text-neutral-900 mb-3">Shop</p>
                <ul className="space-y-2 text-neutral-500">
                  <li><a href="/products" className="hover:text-neutral-900 transition-colors duration-200">All Products</a></li>
                  <li><a href="/products?category=dress" className="hover:text-neutral-900 transition-colors duration-200">Dresses</a></li>
                  <li><a href="/products?category=tops" className="hover:text-neutral-900 transition-colors duration-200">Tops</a></li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-neutral-900 mb-3">Help</p>
                <ul className="space-y-2 text-neutral-500">
                  <li><a href="#" className="hover:text-neutral-900 transition-colors duration-200">Returns</a></li>
                  <li><a href="#" className="hover:text-neutral-900 transition-colors duration-200">Size Guide</a></li>
                  <li><a href="#" className="hover:text-neutral-900 transition-colors duration-200">Contact</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-neutral-100">
            <p className="text-xs text-neutral-400 font-sans">© 2026 StyleAI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
