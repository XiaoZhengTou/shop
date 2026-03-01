import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ArrowLeft } from "lucide-react";
import ConversationDetail from "../ConversationDetail";

async function getConversation(id: string) {
  try {
    return await prisma.conversation.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        language: true,
        summary: true,
        createdAt: true,
        updatedAt: true,
        user: { select: { id: true, name: true, email: true } },
        messages: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            role: true,
            content: true,
            toolName: true,
            createdAt: true,
          },
        },
      },
    });
  } catch {
    return null;
  }
}

export default async function ConversationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const conversation = await getConversation(id);
  if (!conversation) notFound();

  return (
    <div>
      <div className="mb-8">
        <a
          href="/dashboard/conversations"
          className="inline-flex items-center gap-2 font-sans text-sm text-neutral-500 hover:text-neutral-900 transition-colors duration-200"
        >
          <ArrowLeft size={14} />
          返回对话列表
        </a>
        <div className="mt-4 flex items-start justify-between">
          <div>
            <h1 className="font-serif text-4xl font-semibold text-neutral-900">
              对话详情
            </h1>
            <p className="mt-1 font-sans text-sm text-neutral-500 font-mono">
              #{conversation.id.slice(-8)}
            </p>
          </div>
        </div>
      </div>

      <ConversationDetail conversation={conversation} />
    </div>
  );
}
