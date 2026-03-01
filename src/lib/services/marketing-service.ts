import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export type MarketingPlatform = "tiktok" | "xiaohongshu" | "instagram";

export interface MarketingInput {
  titleZh: string;
  titleEn: string;
  descriptionZh: string;
  descriptionEn: string;
  category: string;
  price: number;
  tags: string[];
  platform: MarketingPlatform;
  tone?: "trendy" | "elegant" | "casual" | "professional";
}

export interface MarketingContent {
  platform: MarketingPlatform;
  title: string;
  body: string;
  hashtags: string[];
  callToAction: string;
  tips: string; // platform-specific tips
}

const PLATFORM_PROMPTS: Record<MarketingPlatform, string> = {
  tiktok: `你是TikTok时尚内容创作专家。生成一个15-60秒短视频脚本。
要求：
- 开头3秒必须有强烈钩子（hook），抓住注意力
- 口语化、有节奏感，适合配音
- 包含视觉动作指导（如"镜头推近"、"转身展示"）
- 结尾有明确CTA
- 语言：中文为主，可适当加英文词汇增加潮流感
- 字数：150-250字`,

  xiaohongshu: `你是小红书时尚博主。生成一篇种草笔记。
要求：
- 标题要有爆款感，可用emoji，不超过20字
- 正文分段清晰，用emoji点缀
- 真实感强，像朋友推荐而非广告
- 包含穿搭建议或使用场景
- 语言：中文
- 字数：200-350字`,

  instagram: `You are a fashion Instagram content creator. Generate an Instagram post.
Requirements:
- Caption should be engaging and authentic
- Mix of English with occasional Chinese/aesthetic words for global appeal
- Include lifestyle context (where to wear, occasion)
- Conversational but aspirational tone
- Word count: 100-180 words`,
};

export async function generateMarketingContent(
  input: MarketingInput
): Promise<MarketingContent> {
  const platformPrompt = PLATFORM_PROMPTS[input.platform];
  const toneHint = input.tone
    ? `语气风格：${input.tone}`
    : "";

  const productInfo = `
商品信息：
- 中文名：${input.titleZh}
- 英文名：${input.titleEn}
- 分类：${input.category}
- 价格：¥${input.price}
- 标签：${input.tags.join("、")}
- 中文描述：${input.descriptionZh || "无"}
- 英文描述：${input.descriptionEn || "无"}
${toneHint}`;

  const prompt = `${platformPrompt}

${productInfo}

请严格按以下JSON格式返回，不要有其他内容：
{
  "title": "标题或视频标题",
  "body": "正文内容（保留换行符用\\n表示）",
  "hashtags": ["标签1", "标签2", "标签3", "标签4", "标签5"],
  "callToAction": "行动号召语",
  "tips": "一句话平台发布建议"
}`;

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";

  let parsed: { title: string; body: string; hashtags: string[]; callToAction: string; tips: string };
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(jsonMatch?.[0] ?? "{}");
  } catch {
    parsed = {
      title: input.titleZh,
      body: input.descriptionZh || input.descriptionEn || "",
      hashtags: input.tags.slice(0, 5),
      callToAction: "立即购买",
      tips: "发布时选择最佳时间段",
    };
  }

  return {
    platform: input.platform,
    title: parsed.title ?? "",
    body: parsed.body ?? "",
    hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags : [],
    callToAction: parsed.callToAction ?? "",
    tips: parsed.tips ?? "",
  };
}
