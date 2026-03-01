"use client";

import { useState } from "react";
import { LayoutDashboard, Package, BarChart3, MessageSquare, Settings, Zap, ChevronLeft, ChevronRight, ClipboardCheck, RefreshCw, Megaphone, BookOpen, ShoppingBag } from "lucide-react";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Package, label: "Products", href: "/dashboard/products" },
  { icon: ShoppingBag, label: "Orders", href: "/dashboard/orders" },
  { icon: Zap, label: "AI Generate", href: "/dashboard/listing-generator" },
  { icon: ClipboardCheck, label: "AI Review", href: "/dashboard/ai-content" },
  { icon: BookOpen, label: "Knowledge", href: "/dashboard/knowledge" },
  { icon: BarChart3, label: "Analytics", href: "/dashboard/analytics" },
  { icon: MessageSquare, label: "Conversations", href: "/dashboard/conversations" },
  { icon: RefreshCw, label: "Retention", href: "/dashboard/retention" },
  { icon: Megaphone, label: "Marketing", href: "/dashboard/marketing" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
];

export default function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`bg-neutral-900 text-white flex flex-col transition-all duration-300 ${
        collapsed ? "w-16" : "w-56"
      } min-h-screen shrink-0`}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-neutral-800">
        {!collapsed && (
          <div>
            <p className="font-serif text-lg font-semibold text-white">StyleAI</p>
            <p className="font-sans text-xs text-neutral-400">Admin</p>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="text-neutral-400 hover:text-white transition-colors duration-200 cursor-pointer"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-3 py-2 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors duration-200 cursor-pointer rounded-sm"
          >
            <item.icon size={18} className="shrink-0" />
            {!collapsed && (
              <span className="font-sans text-sm">{item.label}</span>
            )}
          </a>
        ))}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="px-4 py-4 border-t border-neutral-800">
          <p className="font-sans text-xs text-neutral-500">StyleAI v1.0</p>
        </div>
      )}
    </aside>
  );
}
