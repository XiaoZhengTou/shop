import Anthropic from "@anthropic-ai/sdk";
import { getOrderStatus, searchKnowledgeBase, TOOL_DEFINITIONS } from "@/lib/tools/order-tools";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 1024;
const MAX_TOOL_ROUNDS = 3;

// ============================================================
// Types
// ============================================================

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ServiceChainInput {
  messages: ChatMessage[];
  language: "zh" | "en";
  conversationId?: string;
}

export interface ServiceChainOutput {
  reply: string;
  needsEscalation: boolean;
  toolsUsed: string[];
}

// ============================================================
// System Prompts
// ============================================================

const SYSTEM_ZH = `你是 StyleAI 的AI客服助手，专业、友善，专注于时尚服装。

你可以使用以下工具：
- get_order_status: 查询订单状态
- search_knowledge_base: 搜索FAQ、退换货政策、尺码建议等

处理规则：
1. 优先使用工具获取准确信息，不要猜测
2. 如果用户询问订单，请让他们提供订单号
3. 如果遇到复杂投诉、退款争议、平台违规等问题，诚实告知需要转接人工客服
4. 回答简洁、专业，适当使用礼貌用语
5. 如果问题超出你的能力范围，输出"[ESCALATE]"标记

不要承诺无法实现的事项。`;

const SYSTEM_EN = `You are the AI customer service assistant for StyleAI, a fashion e-commerce brand. Be professional, friendly, and helpful.

You have access to these tools:
- get_order_status: Look up order status and details
- search_knowledge_base: Search FAQs, return policies, size guides, etc.

Guidelines:
1. Always use tools to get accurate information — don't guess
2. If a customer asks about an order, ask for the order ID first
3. For complex complaints, refund disputes, or issues beyond your scope, honestly inform the customer you're escalating to a human agent
4. Keep responses concise and professional
5. If you cannot resolve the issue, output "[ESCALATE]" marker

Never make promises you cannot keep.`;

// ============================================================
// Tool Executor
// ============================================================

async function executeTool(
  toolName: string,
  toolInput: Record<string, string>
): Promise<string> {
  if (toolName === "get_order_status") {
    const result = await getOrderStatus(toolInput.order_id);
    return JSON.stringify(result);
  }

  if (toolName === "search_knowledge_base") {
    const result = await searchKnowledgeBase(
      toolInput.query,
      (toolInput.language as "zh" | "en") || "zh"
    );
    return JSON.stringify(result);
  }

  return JSON.stringify({ error: `Unknown tool: ${toolName}` });
}

// ============================================================
// Main Chain
// ============================================================

export async function runServiceChain(
  input: ServiceChainInput
): Promise<ServiceChainOutput> {
  const { messages, language } = input;
  const systemPrompt = language === "en" ? SYSTEM_EN : SYSTEM_ZH;
  const toolsUsed: string[] = [];

  // Convert chat history to Anthropic format
  const anthropicMessages: Anthropic.MessageParam[] = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  let rounds = 0;
  let currentMessages = [...anthropicMessages];

  // Tool use loop (max MAX_TOOL_ROUNDS rounds)
  while (true) {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      tools: TOOL_DEFINITIONS,
      messages: currentMessages,
    });

    // If no tool use, we have our final answer
    if (response.stop_reason !== "tool_use") {
      const replyContent = response.content.find((c) => c.type === "text");
      const reply = replyContent?.type === "text" ? replyContent.text : "";

      const needsEscalation =
        reply.includes("[ESCALATE]") ||
        reply.toLowerCase().includes("transfer to") ||
        reply.includes("转接人工") ||
        reply.includes("人工客服");

      return {
        reply: reply.replace("[ESCALATE]", "").trim(),
        needsEscalation,
        toolsUsed,
      };
    }

    // Max rounds guard
    if (++rounds >= MAX_TOOL_ROUNDS) {
      const replyContent = response.content.find((c) => c.type === "text");
      const fallback =
        replyContent?.type === "text"
          ? replyContent.text
          : language === "zh"
          ? "抱歉，处理您的请求时遇到问题，请稍后再试或联系人工客服。"
          : "Sorry, I encountered an issue processing your request. Please try again or contact support.";
      return { reply: fallback, needsEscalation: false, toolsUsed };
    }

    // Process tool calls
    const toolUseBlocks = response.content.filter((c) => c.type === "tool_use");
    const toolResults: Anthropic.ToolResultBlockParam[] = [];

    for (const block of toolUseBlocks) {
      if (block.type !== "tool_use") continue;
      toolsUsed.push(block.name);
      const result = await executeTool(
        block.name,
        block.input as Record<string, string>
      );
      toolResults.push({
        type: "tool_result",
        tool_use_id: block.id,
        content: result,
      });
    }

    // Add assistant response + tool results to message history
    currentMessages = [
      ...currentMessages,
      { role: "assistant", content: response.content },
      { role: "user", content: toolResults },
    ];
  }
}
