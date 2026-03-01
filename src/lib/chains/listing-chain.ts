import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 2048;

// ============================================================
// Types
// ============================================================

export interface ListingInput {
  productName: string;
  category: string;
  keyFeatures: string[];   // e.g. ["soft fabric", "minimalist design", "unisex"]
  targetMarket: "zh" | "en" | "both";
  priceHint?: string;      // e.g. "¥299" or "$45"
  referenceImages?: string[]; // Image URLs for context
}

export interface ListingOutput {
  zh?: {
    title: string;         // 30 chars max (Taobao limit)
    description: string;   // 200-500 chars
    tags: string[];        // 5-10 tags
  };
  en?: {
    title: string;         // 60 chars max (Shopify/SEO limit)
    description: string;   // 150-300 words
    tags: string[];        // 5-10 tags
  };
  market: "zh" | "en" | "both";
}

// ============================================================
// Prompts
// ============================================================

const ZH_LISTING_PROMPT = `你是专业的中国电商文案师，擅长为时尚服装品牌撰写吸引人的商品标题和描述。
风格要求：简洁有力、突出卖点、符合小红书/淘宝用户习惯。

商品信息：
- 品名：{productName}
- 品类：{category}
- 核心卖点：{keyFeatures}
{priceHint}

请生成：
1. 商品标题（30字以内，含关键词，有吸引力）
2. 商品描述（200-500字，突出面料/设计/穿着场景，不含极限词如"最"/"第一"/"国家级"）
3. 标签（5-10个，用于搜索优化）

**必须以以下JSON格式回复（不要包含任何其他文字）：**
{
  "title": "标题",
  "description": "描述",
  "tags": ["标签1", "标签2"]
}`;

const EN_LISTING_PROMPT = `You are a professional e-commerce copywriter specializing in fashion brands for international markets (Shopify, Amazon, Instagram).
Style: Clean, aspirational, SEO-optimized, lifestyle-focused.

Product info:
- Name: {productName}
- Category: {category}
- Key features: {keyFeatures}
{priceHint}

Generate:
1. Product title (60 chars max, include key terms, compelling)
2. Product description (150-300 words, highlight fabric/design/occasions, avoid superlatives like "best" or "greatest")
3. Tags (5-10, for search/SEO)

**Reply ONLY in this exact JSON format (no other text):**
{
  "title": "title here",
  "description": "description here",
  "tags": ["tag1", "tag2"]
}`;

// ============================================================
// Helpers
// ============================================================

function fillPrompt(
  template: string,
  input: ListingInput
): string {
  return template
    .replace("{productName}", input.productName)
    .replace("{category}", input.category)
    .replace("{keyFeatures}", input.keyFeatures.join("、"))
    .replace(
      "{priceHint}",
      input.priceHint ? `- 价格参考/Price range: ${input.priceHint}` : ""
    );
}

function extractJson(text: string): Record<string, unknown> {
  // Try direct parse first
  try {
    return JSON.parse(text.trim());
  } catch {
    // Extract JSON from markdown code block
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) {
      return JSON.parse(match[1].trim());
    }
    // Extract raw JSON object
    const objMatch = text.match(/\{[\s\S]*\}/);
    if (objMatch) {
      return JSON.parse(objMatch[0]);
    }
    throw new Error(`Cannot extract JSON from response: ${text.slice(0, 200)}`);
  }
}

async function generateListing(
  prompt: string
): Promise<{ title: string; description: string; tags: string[] }> {
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Claude");
  }

  const parsed = extractJson(content.text);

  return {
    title: String(parsed.title ?? ""),
    description: String(parsed.description ?? ""),
    tags: Array.isArray(parsed.tags)
      ? parsed.tags.map(String)
      : [],
  };
}

// ============================================================
// Main Export
// ============================================================

export async function runListingChain(
  input: ListingInput
): Promise<ListingOutput> {
  const { targetMarket } = input;

  if (targetMarket === "zh") {
    const zh = await generateListing(fillPrompt(ZH_LISTING_PROMPT, input));
    return { zh, market: "zh" };
  }

  if (targetMarket === "en") {
    const en = await generateListing(fillPrompt(EN_LISTING_PROMPT, input));
    return { en, market: "en" };
  }

  // "both" — run in parallel
  const [zh, en] = await Promise.all([
    generateListing(fillPrompt(ZH_LISTING_PROMPT, input)),
    generateListing(fillPrompt(EN_LISTING_PROMPT, input)),
  ]);

  return { zh, en, market: "both" };
}
