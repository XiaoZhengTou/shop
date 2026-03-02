import { getOrderStatus, searchKnowledgeBase } from "@/lib/tools/order-tools";

const SILICONFLOW_API_KEY = process.env.SILICONFLOW_API_KEY!;
const SILICONFLOW_BASE_URL = "https://api.siliconflow.cn/v1";

const MODEL = "Pro/zai-org/GLM-4.7";
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

// OpenAI-compatible message types
type OAIMessage =
  | { role: "system"; content: string }
  | { role: "user"; content: string }
  | { role: "assistant"; content: string | null; tool_calls?: OAIToolCall[] }
  | { role: "tool"; tool_call_id: string; content: string };

interface OAIToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}

interface OAIResponse {
  choices: Array<{
    message: {
      role: string;
      content: string | null;
      tool_calls?: OAIToolCall[];
    };
    finish_reason: string;
  }>;
}

// ============================================================
// OpenAI-format Tool Definitions
// ============================================================

const TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "get_order_status",
      description:
        "Query the status, items, and details of a specific order by order ID. Use when customer asks about their order.",
      parameters: {
        type: "object",
        properties: {
          order_id: {
            type: "string",
            description: "The order ID to look up",
          },
        },
        required: ["order_id"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "search_knowledge_base",
      description:
        "Search the knowledge base for FAQs, policies, size guides, and product information. Use for general questions about returns, shipping, sizing, etc.",
      parameters: {
        type: "object",
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
  },
];

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
// API call
// ============================================================

async function callSiliconFlow(messages: OAIMessage[]): Promise<OAIResponse> {
  const res = await fetch(`${SILICONFLOW_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SILICONFLOW_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      messages,
      tools: TOOLS,
      tool_choice: "auto",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SiliconFlow API error ${res.status}: ${text}`);
  }

  return res.json() as Promise<OAIResponse>;
}

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

  // Build initial messages with system prompt
  const currentMessages: OAIMessage[] = [
    { role: "system", content: systemPrompt },
    ...messages.map((m) => ({ role: m.role, content: m.content } as OAIMessage)),
  ];

  let rounds = 0;

  // Tool use loop (max MAX_TOOL_ROUNDS rounds)
  while (true) {
    const response = await callSiliconFlow(currentMessages);
    const choice = response.choices[0];
    const message = choice.message;

    // If no tool calls, we have our final answer
    if (choice.finish_reason !== "tool_calls" || !message.tool_calls?.length) {
      const reply = message.content ?? "";

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
      const fallback =
        message.content ??
        (language === "zh"
          ? "抱歉，处理您的请求时遇到问题，请稍后再试或联系人工客服。"
          : "Sorry, I encountered an issue processing your request. Please try again or contact support.");
      return { reply: fallback, needsEscalation: false, toolsUsed };
    }

    // Add assistant message with tool_calls to history
    currentMessages.push({
      role: "assistant",
      content: message.content ?? null,
      tool_calls: message.tool_calls,
    });

    // Execute each tool call and append results
    for (const toolCall of message.tool_calls) {
      toolsUsed.push(toolCall.function.name);
      const toolInput = JSON.parse(toolCall.function.arguments) as Record<string, string>;
      const result = await executeTool(toolCall.function.name, toolInput);
      currentMessages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: result,
      });
    }
  }
}
