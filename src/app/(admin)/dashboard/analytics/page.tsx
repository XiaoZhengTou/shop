import AnalyticsDashboard from "./AnalyticsDashboard";

export default function AnalyticsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-4xl font-semibold text-neutral-900">Analytics</h1>
        <p className="mt-1 font-sans text-sm text-neutral-500">销售数据与转化分析</p>
      </div>
      <AnalyticsDashboard />
    </div>
  );
}
