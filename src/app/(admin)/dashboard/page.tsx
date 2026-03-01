import { prisma } from "@/lib/prisma";
import { Package, ShoppingBag, MessageSquare, TrendingUp } from "lucide-react";

async function getStats() {
  try {
    const [productCount, orderCount, conversationCount, pendingAiContent] =
      await Promise.all([
        prisma.product.count({ where: { status: "ACTIVE" } }),
        prisma.order.count(),
        prisma.conversation.count({ where: { status: "ACTIVE" } }),
        prisma.aiContent.count({ where: { status: "PENDING_REVIEW" } }),
      ]);
    return { productCount, orderCount, conversationCount, pendingAiContent };
  } catch {
    return { productCount: 0, orderCount: 0, conversationCount: 0, pendingAiContent: 0 };
  }
}

export default async function DashboardPage() {
  const stats = await getStats();

  const statCards = [
    { icon: Package, label: "Active Products", value: stats.productCount, color: "text-blue-600" },
    { icon: ShoppingBag, label: "Total Orders", value: stats.orderCount, color: "text-emerald-600" },
    { icon: MessageSquare, label: "Active Chats", value: stats.conversationCount, color: "text-purple-600" },
    { icon: TrendingUp, label: "AI Pending Review", value: stats.pendingAiContent, color: "text-amber-600" },
  ];

  return (
    <div>
      <h1 className="font-serif text-4xl font-semibold text-neutral-900 mb-2">
        Dashboard
      </h1>
      <p className="font-sans text-sm text-neutral-500 mb-8">
        Welcome back. Here&apos;s an overview of your store.
      </p>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="bg-white border border-neutral-200 rounded-none p-6"
          >
            <stat.icon size={20} className={stat.color} />
            <p className="mt-3 font-sans text-2xl font-bold text-neutral-900">
              {stat.value}
            </p>
            <p className="mt-1 font-sans text-xs text-neutral-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-neutral-200 rounded-none p-6">
          <h2 className="font-sans text-base font-semibold text-neutral-900 mb-4">
            Quick Actions
          </h2>
          <div className="space-y-3">
            <a
              href="/dashboard/listing-generator"
              className="flex items-center gap-3 p-3 bg-neutral-50 hover:bg-neutral-100 transition-colors duration-200 cursor-pointer border border-neutral-200"
            >
              <div className="w-8 h-8 bg-neutral-900 flex items-center justify-center shrink-0">
                <span className="text-[#D4AF37] text-sm font-bold">AI</span>
              </div>
              <div>
                <p className="font-sans text-sm font-medium text-neutral-900">Generate Listing</p>
                <p className="font-sans text-xs text-neutral-500">AI-powered product descriptions</p>
              </div>
            </a>
            <a
              href="/dashboard/products"
              className="flex items-center gap-3 p-3 bg-neutral-50 hover:bg-neutral-100 transition-colors duration-200 cursor-pointer border border-neutral-200"
            >
              <div className="w-8 h-8 bg-neutral-200 flex items-center justify-center shrink-0">
                <Package size={14} className="text-neutral-600" />
              </div>
              <div>
                <p className="font-sans text-sm font-medium text-neutral-900">Manage Products</p>
                <p className="font-sans text-xs text-neutral-500">View and edit your catalog</p>
              </div>
            </a>
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-none p-6">
          <h2 className="font-sans text-base font-semibold text-neutral-900 mb-4">
            AI Content Pending Review
          </h2>
          {stats.pendingAiContent > 0 ? (
            <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200">
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <div>
                <p className="font-sans text-sm font-medium text-neutral-900">
                  {stats.pendingAiContent} items awaiting review
                </p>
                <a
                  href="/dashboard/ai-content"
                  className="font-sans text-xs text-amber-700 hover:text-amber-900 cursor-pointer"
                >
                  Review now →
                </a>
              </div>
            </div>
          ) : (
            <p className="font-sans text-sm text-neutral-400">No pending reviews</p>
          )}
        </div>
      </div>
    </div>
  );
}
