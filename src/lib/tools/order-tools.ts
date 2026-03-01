import { prisma } from "@/lib/prisma";

// Tool: get_order_status
export async function getOrderStatus(orderId: string): Promise<object> {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: { product: { select: { titleZh: true, titleEn: true } } },
        },
      },
    });

    if (!order) {
      return { error: "Order not found", orderId };
    }

    // Desensitize: no user PII
    return {
      id: order.id,
      status: order.status,
      totalPrice: order.totalPrice.toString(),
      currency: order.currency,
      createdAt: order.createdAt.toISOString(),
      itemCount: order.items.length,
      items: order.items.map((item) => ({
        product: item.product.titleZh || item.product.titleEn,
        quantity: item.quantity,
        price: item.price.toString(),
      })),
    };
  } catch {
    return { error: "Failed to fetch order", orderId };
  }
}

// Tool: search_knowledge_base (text-based fallback without pgvector)
export async function searchKnowledgeBase(
  query: string,
  language: "zh" | "en" = "zh"
): Promise<object> {
  try {
    // Extract meaningful terms: split by spaces/punctuation, keep 2+ char substrings
    const cleaned = query.replace(/[？?！!。，,、""''「」【】()（）\s]/g, " ");
    const terms = Array.from(
      new Set(
        cleaned.split(/\s+/)
          .filter((t) => t.length >= 2)
          .concat([query.slice(0, 20)]) // also try raw query prefix
      )
    );

    const items = await prisma.knowledgeBase.findMany({
      take: 3,
      where: {
        OR: terms.flatMap((term) => [
          { titleZh: { contains: term, mode: "insensitive" } },
          { titleEn: { contains: term, mode: "insensitive" } },
          { contentZh: { contains: term, mode: "insensitive" } },
          { contentEn: { contains: term, mode: "insensitive" } },
          { tags: { hasSome: [term] } },
        ]),
      },
    });

    if (items.length === 0) {
      return { results: [], message: "No relevant articles found" };
    }

    return {
      results: items.map((item) => ({
        title: language === "zh" ? item.titleZh : item.titleEn,
        content: language === "zh" ? item.contentZh : item.contentEn,
        category: item.category,
      })),
    };
  } catch {
    return { error: "Failed to search knowledge base" };
  }
}

// Tool definitions for Claude API
export const TOOL_DEFINITIONS = [
  {
    name: "get_order_status",
    description:
      "Query the status, items, and details of a specific order by order ID. Use when customer asks about their order.",
    input_schema: {
      type: "object" as const,
      properties: {
        order_id: {
          type: "string",
          description: "The order ID to look up",
        },
      },
      required: ["order_id"],
    },
  },
  {
    name: "search_knowledge_base",
    description:
      "Search the knowledge base for FAQs, policies, size guides, and product information. Use for general questions about returns, shipping, sizing, etc.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description: "The search query",
        },
        language: {
          type: "string",
          enum: ["zh", "en"],
          description: "Language for the response (zh for Chinese, en for English)",
        },
      },
      required: ["query"],
    },
  },
];
