import { prisma } from "@/lib/prisma";
import ConversationList from "./ConversationList";

async function getConversationCounts() {
  try {
    const [total, active, escalated, resolved] = await Promise.all([
      prisma.conversation.count(),
      prisma.conversation.count({ where: { status: "ACTIVE" } }),
      prisma.conversation.count({ where: { status: "ESCALATED" } }),
      prisma.conversation.count({ where: { status: "RESOLVED" } }),
    ]);
    return { total, active, escalated, resolved };
  } catch {
    return { total: 0, active: 0, escalated: 0, resolved: 0 };
  }
}

async function getConversations() {
  try {
    return await prisma.conversation.findMany({
      orderBy: { updatedAt: "desc" },
      take: 50,
      select: {
        id: true,
        status: true,
        language: true,
        summary: true,
        createdAt: true,
        updatedAt: true,
        user: { select: { id: true, name: true, email: true } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { content: true, role: true, createdAt: true },
        },
        _count: { select: { messages: true } },
      },
    });
  } catch {
    return [];
  }
}

export default async function ConversationsPage() {
  const [counts, conversations] = await Promise.all([
    getConversationCounts(),
    getConversations(),
  ]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-4xl font-semibold text-neutral-900">Conversations</h1>
        <p className="mt-1 font-sans text-sm text-neutral-500">
          客服对话管理，共 {counts.total} 条对话
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-neutral-200 px-5 py-4">
          <p className="font-sans text-xs text-neutral-500 uppercase tracking-wider">进行中</p>
          <p className="mt-1 font-serif text-3xl font-semibold text-neutral-900">{counts.active}</p>
        </div>
        <div className="bg-white border border-amber-200 px-5 py-4">
          <p className="font-sans text-xs text-amber-600 uppercase tracking-wider">待接管</p>
          <p className="mt-1 font-serif text-3xl font-semibold text-amber-600">{counts.escalated}</p>
        </div>
        <div className="bg-white border border-neutral-200 px-5 py-4">
          <p className="font-sans text-xs text-neutral-500 uppercase tracking-wider">已解决</p>
          <p className="mt-1 font-serif text-3xl font-semibold text-neutral-900">{counts.resolved}</p>
        </div>
      </div>

      <ConversationList conversations={conversations} counts={counts} />
    </div>
  );
}
