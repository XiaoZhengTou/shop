"use client";

import { useState, useEffect } from "react";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import { TrendingUp, ShoppingBag, Package, DollarSign, Loader2, RefreshCw } from "lucide-react";

interface DailySale {
  date: string;
  revenue: number;
  orders: number;
  units: number;
}

interface TopProduct {
  id: string;
  titleZh: string;
  sku: string;
  category: string;
  revenue: number;
  units: number;
}

interface CategoryData {
  category: string;
  revenue: number;
  units: number;
}

interface AnalyticsData {
  period: { days: number; since: string };
  summary: {
    totalRevenue: number;
    totalOrders: number;
    totalUnits: number;
    avgOrderValue: number;
    activeProducts: number;
  };
  dailySales: DailySale[];
  topProducts: TopProduct[];
  categoryBreakdown: CategoryData[];
}

const PERIOD_OPTIONS = [
  { label: "7天", value: 7 },
  { label: "30天", value: 30 },
  { label: "90天", value: 90 },
];

const CATEGORY_COLORS = ["#D4AF37", "#1a1a1a", "#6b7280", "#d1d5db", "#9ca3af"];

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="bg-white border border-neutral-200 px-5 py-4">
      <div className="flex items-center justify-between mb-3">
        <p className="font-sans text-xs text-neutral-500 uppercase tracking-wider">{label}</p>
        <Icon size={14} className="text-neutral-400" />
      </div>
      <p className="font-serif text-3xl font-semibold text-neutral-900">{value}</p>
      {sub && <p className="font-sans text-xs text-neutral-400 mt-1">{sub}</p>}
    </div>
  );
}

function formatRevenue(v: number) {
  if (v >= 10000) return `¥${(v / 10000).toFixed(1)}万`;
  return `¥${v.toFixed(0)}`;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function AnalyticsDashboard() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [tick, setTick] = useState(0); // increment to force re-fetch

  useEffect(() => {
    setLoading(true);
    setError("");
    fetch(`/api/admin/analytics?days=${days}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error || !d.summary) { setError(d.error || "数据格式错误"); }
        else { setData(d); setLastUpdated(new Date()); }
        setLoading(false);
      })
      .catch(() => { setError("加载失败"); setLoading(false); });
  }, [days, tick]);

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex gap-2">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setDays(opt.value)}
              className={`px-4 py-1.5 font-sans text-sm border transition-colors cursor-pointer ${
                days === opt.value
                  ? "bg-neutral-900 text-white border-neutral-900"
                  : "border-neutral-200 text-neutral-600 hover:border-neutral-400"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <p className="font-sans text-xs text-neutral-400">
              更新于 {lastUpdated.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </p>
          )}
          <button
            onClick={() => setTick((t) => t + 1)}
            disabled={loading}
            className="flex items-center gap-1.5 border border-neutral-200 px-3 py-1.5 font-sans text-xs text-neutral-600 hover:border-neutral-400 hover:text-neutral-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            刷新
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={24} className="animate-spin text-neutral-400" />
        </div>
      )}

      {error && <p className="font-sans text-sm text-red-500">{error}</p>}

      {data && !loading && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-4 gap-4">
            <StatCard icon={DollarSign} label="总收入" value={formatRevenue(data.summary.totalRevenue)} sub={`近${days}天`} />
            <StatCard icon={ShoppingBag} label="订单数" value={String(data.summary.totalOrders)} sub={`均单价 ¥${data.summary.avgOrderValue.toFixed(0)}`} />
            <StatCard icon={Package} label="销售件数" value={String(data.summary.totalUnits)} />
            <StatCard icon={TrendingUp} label="在售商品" value={String(data.summary.activeProducts)} />
          </div>

          {/* Revenue trend chart */}
          <div className="bg-white border border-neutral-200 p-5">
            <h2 className="font-sans text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-5">
              收入趋势
            </h2>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={data.dailySales} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} interval={Math.floor(data.dailySales.length / 6)} />
                <YAxis tickFormatter={(v) => `¥${v}`} tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} width={55} />
                <Tooltip
                  formatter={(v) => [`¥${Number(v ?? 0).toFixed(0)}`, "收入"]}
                  labelFormatter={(l) => `日期: ${l}`}
                  contentStyle={{ fontSize: 12, border: "1px solid #e5e7eb", borderRadius: 0 }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#D4AF37" strokeWidth={2} fill="url(#revenueGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Orders bar chart */}
          <div className="bg-white border border-neutral-200 p-5">
            <h2 className="font-sans text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-5">
              每日订单数
            </h2>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={data.dailySales} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} interval={Math.floor(data.dailySales.length / 6)} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} allowDecimals={false} width={30} />
                <Tooltip
                  formatter={(v) => [Number(v ?? 0), "订单"]}
                  contentStyle={{ fontSize: 12, border: "1px solid #e5e7eb", borderRadius: 0 }}
                />
                <Bar dataKey="orders" fill="#1a1a1a" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Category pie */}
            <div className="bg-white border border-neutral-200 p-5">
              <h2 className="font-sans text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-5">
                分类收入占比
              </h2>
              {data.categoryBreakdown.length === 0 ? (
                <p className="font-sans text-sm text-neutral-400 text-center py-8">暂无数据</p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={data.categoryBreakdown} dataKey="revenue" nameKey="category" cx="50%" cy="50%" outerRadius={70} label={(props) => { const p = props as unknown as { category: string; percent: number }; return `${p.category} ${(p.percent * 100).toFixed(0)}%`; }} labelLine={false} fontSize={11}>
                      {data.categoryBreakdown.map((_, i) => (
                        <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => [`¥${Number(v ?? 0).toFixed(0)}`, "收入"]} contentStyle={{ fontSize: 12, border: "1px solid #e5e7eb", borderRadius: 0 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Top products table */}
            <div className="bg-white border border-neutral-200 p-5">
              <h2 className="font-sans text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-4">
                热销商品 Top 5
              </h2>
              {data.topProducts.length === 0 ? (
                <p className="font-sans text-sm text-neutral-400 text-center py-8">暂无数据</p>
              ) : (
                <div className="space-y-3">
                  {data.topProducts.slice(0, 5).map((p, i) => (
                    <div key={p.id} className="flex items-center gap-3">
                      <span className="font-mono text-xs text-neutral-300 w-4 shrink-0">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-sans text-sm text-neutral-900 truncate">{p.titleZh}</p>
                        <p className="font-sans text-xs text-neutral-400">{p.sku} · {p.units}件</p>
                      </div>
                      <span className="font-sans text-sm font-medium text-neutral-900 shrink-0">
                        {formatRevenue(p.revenue)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
