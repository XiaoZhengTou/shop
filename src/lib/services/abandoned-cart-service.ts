import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

interface CartProduct {
  productId: string;
  titleZh: string;
  titleEn: string;
  price: number;
  category: string;
  stock: number;
  quantity: number;
}

interface UserProfile {
  name: string | null;
  email: string;
  orderCount: number; // determines segment
}

export type UserSegment = "new" | "active" | "vip" | "at_risk";

function getSegment(orderCount: number): UserSegment {
  if (orderCount === 0) return "new";
  if (orderCount >= 5) return "vip";
  if (orderCount >= 2) return "active";
  return "at_risk";
}

function getCouponDiscount(segment: UserSegment, touchNumber: number): number {
  // touch3 always max discount
  if (touchNumber === 3) return segment === "vip" ? 15 : 20;
  if (segment === "new") return touchNumber === 1 ? 10 : 15;
  if (segment === "vip") return 0; // VIP gets perks, not discounts
  return touchNumber === 1 ? 0 : 10;
}

export interface RecoveryContent {
  subjectZh: string;
  subjectEn: string;
  bodyZh: string;
  bodyEn: string;
  couponDiscount: number; // 0 = no coupon
  needsApproval: boolean; // discount > 20%
  segment: UserSegment;
}

export async function generateRecoveryContent(
  user: UserProfile,
  cartItems: CartProduct[],
  touchNumber: number
): Promise<RecoveryContent> {
  const segment = getSegment(user.orderCount);
  const couponDiscount = getCouponDiscount(segment, touchNumber);
  const needsApproval = couponDiscount > 20;

  const productList = cartItems
    .map((p) => `- ${p.titleZh} (${p.titleEn}), ¥${p.price}, 库存${p.stock}件`)
    .join("\n");

  const segmentHints: Record<UserSegment, string> = {
    new: "新客户，首次购物，强调首单保障和折扣",
    active: "活跃老客，强调库存紧张和会员权益",
    vip: "VIP客户，强调专属优惠和个性化推荐，不要显得廉价",
    at_risk: "流失风险用户，温和挽留，强调品牌价值",
  };

  const prompt = `你是StyleAI时尚电商的营销文案专家。请为以下弃购用户生成挽留邮件文案。

用户信息:
- 姓名: ${user.name ?? "亲爱的顾客"}
- 用户类型: ${segmentHints[segment]}
- 第${touchNumber}次触达

购物车商品:
${productList}

${couponDiscount > 0 ? `优惠券折扣: ${couponDiscount}% off` : "无优惠券"}

要求:
1. 生成邮件主题（中英文各一条，简洁有力，不超过50字符）
2. 生成邮件正文（中英文各一条，2-3段，自然亲切，不要过于推销）
3. 中文面向国内市场，英文面向跨境市场
4. 语气要符合高端时尚品牌调性

请严格按以下JSON格式返回，不要有其他内容:
{
  "subjectZh": "邮件主题（中文）",
  "subjectEn": "Email subject (English)",
  "bodyZh": "邮件正文（中文，用\\n分段）",
  "bodyEn": "Email body (English, use \\n for paragraphs)"
}`;

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";

  let parsed: { subjectZh: string; subjectEn: string; bodyZh: string; bodyEn: string };
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(jsonMatch?.[0] ?? "{}");
  } catch {
    parsed = {
      subjectZh: "您的购物车还在等您",
      subjectEn: "Your cart is waiting for you",
      bodyZh: `亲爱的${user.name ?? "顾客"}，\n\n您购物车中的商品还在等您。\n\n立即完成购买，享受专属优惠。`,
      bodyEn: `Dear ${user.name ?? "Customer"},\n\nYour cart items are waiting for you.\n\nComplete your purchase now.`,
    };
  }

  return {
    subjectZh: parsed.subjectZh,
    subjectEn: parsed.subjectEn,
    bodyZh: parsed.bodyZh,
    bodyEn: parsed.bodyEn,
    couponDiscount,
    needsApproval,
    segment,
  };
}
