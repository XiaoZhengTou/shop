import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const conversation = await prisma.conversation.findUnique({
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

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    return NextResponse.json(conversation);
  } catch (error) {
    console.error("[GET /api/admin/conversations/[id]]", error);
    return NextResponse.json({ error: "Failed to fetch conversation" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json() as { status?: string };

    const allowedStatuses = ["ACTIVE", "ESCALATED", "RESOLVED"];
    if (!body.status || !allowedStatuses.includes(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const conversation = await prisma.conversation.update({
      where: { id },
      data: { status: body.status as "ACTIVE" | "ESCALATED" | "RESOLVED" },
      select: { id: true, status: true },
    });

    return NextResponse.json(conversation);
  } catch (error) {
    console.error("[PATCH /api/admin/conversations/[id]]", error);
    return NextResponse.json({ error: "Failed to update conversation" }, { status: 500 });
  }
}
