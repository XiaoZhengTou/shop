"use client";

import { useState, useEffect } from "react";
import { ShoppingBag, Menu, X, Search, User, LogOut, Package } from "lucide-react";
import { useCartStore } from "@/lib/store/cart";
import { useSession, signOut } from "next-auth/react";

export default function StoreNav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { openCart, totalItems } = useCartStore();
  const count = mounted ? totalItems() : 0;
  const { data: session } = useSession();

  useEffect(() => { setMounted(true); }, []);

  const navLinks = [
    { href: "/products", label: "Collection" },
    { href: "/products?category=dress", label: "Dresses" },
    { href: "/products?category=tops", label: "Tops" },
    { href: "/products?category=outerwear", label: "Outerwear" },
  ];

  return (
    <nav className="bg-white/95 backdrop-blur-sm border-b border-neutral-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="/" className="font-serif text-xl font-semibold text-neutral-900 cursor-pointer">
            StyleAI
          </a>

          {/* Desktop Nav */}
          <ul className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="font-sans text-sm text-neutral-600 hover:text-neutral-900 transition-colors duration-200 cursor-pointer"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          {/* Right Icons */}
          <div className="flex items-center gap-4">
            <button
              aria-label="Search"
              className="text-neutral-600 hover:text-neutral-900 transition-colors duration-200 cursor-pointer"
            >
              <Search size={20} />
            </button>

            {/* Auth Button */}
            {session ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  aria-label="User menu"
                  className="text-neutral-600 hover:text-neutral-900 transition-colors duration-200 cursor-pointer"
                >
                  <User size={20} />
                </button>
                {userMenuOpen && (
                  <>
                    {/* Backdrop */}
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    {/* Dropdown */}
                    <div className="absolute right-0 top-8 z-20 w-48 bg-white border border-neutral-200 shadow-sm">
                      <div className="px-4 py-3 border-b border-neutral-100">
                        <p className="font-sans text-xs text-neutral-500">已登录</p>
                        <p className="font-sans text-sm text-neutral-900 truncate mt-0.5">
                          {session.user?.name || session.user?.email}
                        </p>
                      </div>
                      <a
                        href="/account/orders"
                        onClick={() => setUserMenuOpen(false)}
                        className="w-full flex items-center gap-2 px-4 py-2.5 font-sans text-sm text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 transition-colors duration-200 cursor-pointer"
                      >
                        <Package size={14} />
                        我的订单
                      </a>
                      <button
                        onClick={() => signOut({ callbackUrl: "/" })}
                        className="w-full flex items-center gap-2 px-4 py-2.5 font-sans text-sm text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 transition-colors duration-200 cursor-pointer border-t border-neutral-100"
                      >
                        <LogOut size={14} />
                        退出登录
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <a
                href="/login"
                className="font-sans text-sm text-neutral-600 hover:text-neutral-900 transition-colors duration-200 cursor-pointer"
              >
                登录
              </a>
            )}

            <button
              aria-label="Shopping bag"
              onClick={openCart}
              className="text-neutral-600 hover:text-neutral-900 transition-colors duration-200 cursor-pointer relative"
            >
              <ShoppingBag size={20} />
              {count > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#D4AF37] text-white font-sans text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                  {count > 9 ? "9+" : count}
                </span>
              )}
            </button>

            {/* Mobile menu toggle */}
            <button
              aria-label="Toggle menu"
              className="md:hidden text-neutral-600 hover:text-neutral-900 transition-colors duration-200 cursor-pointer"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-neutral-100 py-4">
            <ul className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="font-sans text-sm text-neutral-600 hover:text-neutral-900 transition-colors duration-200 cursor-pointer block py-1"
                    onClick={() => setMobileOpen(false)}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
              <li className="border-t border-neutral-100 pt-4">
                {session ? (
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="font-sans text-sm text-neutral-600 hover:text-neutral-900 transition-colors duration-200 cursor-pointer flex items-center gap-2"
                  >
                    <LogOut size={14} />
                    退出登录
                  </button>
                ) : (
                  <a
                    href="/login"
                    className="font-sans text-sm text-neutral-600 hover:text-neutral-900 transition-colors duration-200"
                  >
                    登录 / 注册
                  </a>
                )}
              </li>
            </ul>
          </div>
        )}
      </div>
    </nav>
  );
}
