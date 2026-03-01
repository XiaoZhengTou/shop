import { NextRequest, NextResponse } from "next/server";
import { runServiceChain, ChatMessage } from "@/lib/chains/service-chain";
import { prisma } from "@/lib/prisma";

interface ChatRequestBody {
  messages: ChatMessage[];
  language?: "zh" | "en";
  conversationId?: string;  // If continuing existing conversation
  userId?: string;          // Optional user ID for logged-in users
}

function validateBody(body: unknown): body is ChatRequestBody {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  return (
    Array.isArray(b.messages) &&
    b.messages.length > 0 &&
    b.messages.every(
      (m) =>
        typeof m === "object" &&
        m !== null &&
        (m as Record<string, unknown>).role !== undefined &&
        (m as Record<string, unknown>).content !== undefined
    )
  );
}

export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    if (!validateBody(body)) {
      return NextResponse.json(
        { error: "Invalid request body. messages array required." },
        { status: 400 }
      );
    }

    const language = body.language ?? "zh";
    const messages = body.messages;
    const userId = body.userId;

    // Get or create conversation in DB
    let conversationId = body.conversationId;
    if (!conversationId) {
      const conversation = await prisma.conversation.create({
        data: {
          language,
          status: "ACTIVE",
          ...(userId && { userId }),
        },
      });
      conversationId = conversation.id;
    }

    // Save the latest user message to DB
    const latestUserMessage = messages[messages.length - 1];
    if (latestUserMessage.role === "user") {
      await prisma.message.create({
        data: {
          conversationId,
          role: "USER",
          content: latestUserMessage.content,
        },
      });
    }

    // Run the service chain
    const result = await runServiceChain({
      messages,
      language,
      conversationId,
    });

    // Save AI reply to DB
    await prisma.message.create({
      data: {
        conversationId,
        role: "ASSISTANT",
        content: result.reply,
        toolName: result.toolsUsed.length > 0 ? result.toolsUsed.join(",") : null,
      },
    });

    // Handle escalation
    if (result.needsEscalation) {
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { status: "ESCALATED" },
      });
    }

    return NextResponse.json({
      reply: result.reply,
      needsEscalation: result.needsEscalation,
      conversationId,
      toolsUsed: result.toolsUsed,
    });
  } catch (error) {
    console.error("[POST /api/ai/chat] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to process chat message",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed. Use POST." },
    { status: 405 }
  );
}
