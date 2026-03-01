import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json() as { content?: string };

    if (!body.content?.trim()) {
      return NextResponse.json({ error: "Reply content is required" }, { status: 400 });
    }

    // Verify conversation exists and is not RESOLVED
    const conversation = await prisma.conversation.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    if (conversation.status === "RESOLVED") {
      return NextResponse.json({ error: "Cannot reply to a resolved conversation" }, { status: 400 });
    }

    const message = await prisma.message.create({
      data: {
        conversationId: id,
        role: "ASSISTANT",
        content: body.content.trim(),
        toolName: "human_agent",
      },
      select: { id: true, role: true, content: true, toolName: true, createdAt: true },
    });

    // Mark conversation as ACTIVE if it was ESCALATED (human took over)
    if (conversation.status === "ESCALATED") {
      await prisma.conversation.update({
        where: { id },
        data: { status: "ACTIVE" },
      });
    }

    return NextResponse.json(message);
  } catch (error) {
    console.error("[POST /api/admin/conversations/[id]/reply]", error);
    return NextResponse.json({ error: "Failed to send reply" }, { status: 500 });
  }
}
