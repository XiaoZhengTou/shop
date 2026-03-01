import { prisma } from "@/lib/prisma";
import RetentionList from "./RetentionList";

async function getStats() {
  try {
    const [total, pending, sent, failed, needsApproval] = await Promise.all([
      prisma.marketingJob.count({
        where: { type: { in: ["ABANDONED_CART_1", "ABANDONED_CART_2", "ABANDONED_CART_3"] } },
      }),
      prisma.marketingJob.count({
        where: {
          type: { in: ["ABANDONED_CART_1", "ABANDONED_CART_2", "ABANDONED_CART_3"] },
          status: "PENDING",
        },
      }),
      prisma.marketingJob.count({
        where: {
          type: { in: ["ABANDONED_CART_1", "ABANDONED_CART_2", "ABANDONED_CART_3"] },
          status: "SENT",
        },
      }),
      prisma.marketingJob.count({
        where: {
          type: { in: ["ABANDONED_CART_1", "ABANDONED_CART_2", "ABANDONED_CART_3"] },
          status: "FAILED",
        },
      }),
      prisma.marketingJob.count({
        where: {
          type: { in: ["ABANDONED_CART_1", "ABANDONED_CART_2", "ABANDONED_CART_3"] },
          status: "PENDING",
          payload: { path: ["needsApproval"], equals: true },
        },
      }),
    ]);
    return { total, pending, sent, failed, needsApproval };
  } catch {
    return { total: 0, pending: 0, sent: 0, failed: 0, needsApproval: 0 };
  }
}

async function getJobs() {
  try {
    return await prisma.marketingJob.findMany({
      where: { type: { in: ["ABANDONED_CART_1", "ABANDONED_CART_2", "ABANDONED_CART_3"] } },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
  } catch {
    return [];
  }
}

export default async function RetentionPage() {
  const [stats, jobs] = await Promise.all([getStats(), getJobs()]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-4xl font-semibold text-neutral-900">Retention</h1>
        <p className="mt-1 font-sans text-sm text-neutral-500">
          弃单挽回任务，共 {stats.total} 条记录
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-neutral-200 px-5 py-4">
          <p className="font-sans text-xs text-neutral-500 uppercase tracking-wider">待发送</p>
          <p className="mt-1 font-serif text-3xl font-semibold text-neutral-900">{stats.pending}</p>
        </div>
        <div className="bg-white border border-amber-200 px-5 py-4">
          <p className="font-sans text-xs text-amber-600 uppercase tracking-wider">待审批</p>
          <p className="mt-1 font-serif text-3xl font-semibold text-amber-600">{stats.needsApproval}</p>
        </div>
        <div className="bg-white border border-emerald-200 px-5 py-4">
          <p className="font-sans text-xs text-emerald-600 uppercase tracking-wider">已发送</p>
          <p className="mt-1 font-serif text-3xl font-semibold text-emerald-700">{stats.sent}</p>
        </div>
        <div className="bg-white border border-neutral-200 px-5 py-4">
          <p className="font-sans text-xs text-neutral-500 uppercase tracking-wider">失败</p>
          <p className="mt-1 font-serif text-3xl font-semibold text-red-500">{stats.failed}</p>
        </div>
      </div>

      <RetentionList jobs={jobs} />
    </div>
  );
}
