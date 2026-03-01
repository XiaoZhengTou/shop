import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // ============================================================
  // Users
  // ============================================================
  const adminPassword = await bcrypt.hash("admin123", 10);
  const demoPassword = await bcrypt.hash("demo123", 10);

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@styleai.shop" },
    update: { password: adminPassword },
    create: {
      email: "admin@styleai.shop",
      name: "StyleAI Admin",
      role: "ADMIN",
      password: adminPassword,
    },
  });

  const demoUser = await prisma.user.upsert({
    where: { email: "demo@styleai.shop" },
    update: { password: demoPassword },
    create: {
      email: "demo@styleai.shop",
      name: "Demo Customer",
      role: "CUSTOMER",
      password: demoPassword,
    },
  });

  console.log(`✅ Users seeded: ${adminUser.email}, ${demoUser.email}`);

  // ============================================================
  // Products
  // ============================================================
  const products = [
    {
      sku: "SA-DRESS-001",
      titleZh: "优雅纯色A字裙 春夏新款",
      titleEn: "Elegant Solid A-Line Dress",
      descriptionZh:
        "精选高品质面料，垂感极佳。经典A字版型，修身显瘦，适合多种场合。颜色纯粹，设计简洁，展现都市女性优雅气质。",
      descriptionEn:
        "Crafted from premium fabric with excellent drape. Classic A-line silhouette that flatters the figure, perfect for multiple occasions. Pure colors and clean design reflect the elegance of modern women.",
      price: 299,
      stock: 50,
      category: "dress",
      images: ["/images/products/dress-001.svg"],
      tags: ["dress", "elegant", "a-line", "spring", "minimal"],
      status: "ACTIVE" as const,
      targetMarket: "BOTH" as const,
    },
    {
      sku: "SA-TOP-001",
      titleZh: "宽松棉质圆领T恤 多色可选",
      titleEn: "Relaxed Cotton Crew Neck Tee",
      descriptionZh:
        "100%有机棉材质，亲肤舒适。宽松版型，不挑身材，百搭实用。多色可选，满足日常穿搭需求。",
      descriptionEn:
        "100% organic cotton, soft and skin-friendly. Relaxed fit that flatters all body types. Available in multiple colors for versatile everyday styling.",
      price: 149,
      stock: 120,
      category: "tops",
      images: ["/images/products/tee-001.svg"],
      tags: ["tee", "organic", "cotton", "casual", "unisex"],
      status: "ACTIVE" as const,
      targetMarket: "BOTH" as const,
    },
    {
      sku: "SA-JACKET-001",
      titleZh: "经典黑色西装外套 商务休闲两用",
      titleEn: "Classic Black Blazer",
      descriptionZh:
        "精裁西装外套，商务休闲两用。优质混纺面料，挺括有型，穿着舒适。搭配休闲裤或正装均可，提升整体气质。",
      descriptionEn:
        "A precisely tailored blazer for both business and casual wear. Premium blended fabric that holds its shape while remaining comfortable. Pairs with casual trousers or formal attire to elevate any look.",
      price: 599,
      stock: 30,
      category: "outerwear",
      images: ["/images/products/blazer-001.svg"],
      tags: ["blazer", "black", "formal", "versatile", "tailored"],
      status: "ACTIVE" as const,
      targetMarket: "BOTH" as const,
    },
    {
      sku: "SA-PANTS-001",
      titleZh: "高腰直筒阔腿裤 显腿长款",
      titleEn: "High-Waist Wide-Leg Trousers",
      descriptionZh:
        "高腰设计拉长腿部比例，直筒阔腿版型显腿细长。垂感面料，优雅大方，上班通勤或休闲出行均适合。",
      descriptionEn:
        "High-waist design elongates the leg line. Straight wide-leg silhouette creates a slimming effect. Flowing fabric with elegant drape, suitable for work commute or casual outings.",
      price: 349,
      stock: 45,
      category: "pants",
      images: ["/images/products/pants-001.svg"],
      tags: ["wide-leg", "trousers", "high-waist", "elegant", "office"],
      status: "ACTIVE" as const,
      targetMarket: "BOTH" as const,
    },
    {
      sku: "SA-SCARF-001",
      titleZh: "真丝印花围巾 百搭小方巾",
      titleEn: "Silk Print Scarf",
      descriptionZh:
        "100%真丝材质，触感柔滑。精美印花设计，颜色丰富。可作围巾、发带或包带装饰，一物多用。",
      descriptionEn:
        "100% silk with a silky smooth feel. Beautiful print design with rich colors. Wear as a neck scarf, hair band, or bag accessory — versatile and stylish.",
      price: 199,
      stock: 80,
      category: "accessories",
      images: ["/images/products/scarf-001.svg"],
      tags: ["silk", "scarf", "print", "accessories", "gift"],
      status: "ACTIVE" as const,
      targetMarket: "BOTH" as const,
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { sku: product.sku },
      update: { images: product.images },
      create: product,
    });
  }
  console.log(`✅ Products seeded: ${products.length} items`);

  // ============================================================
  // Knowledge Base (for RAG customer service)
  // ============================================================
  const knowledgeItems = [
    // FAQ
    {
      category: "faq",
      titleZh: "如何追踪我的订单？",
      titleEn: "How do I track my order?",
      contentZh:
        "您可以在「我的订单」页面查看订单状态。订单发货后，您会收到包含快递单号的邮件通知。通常国内订单3-5个工作日送达，跨境订单7-15个工作日。如有疑问请联系客服。",
      contentEn:
        "You can check your order status on the 'My Orders' page. Once your order ships, you'll receive an email with the tracking number. Domestic orders typically arrive in 3-5 business days, and international orders in 7-15 business days. Contact support if you have any questions.",
      tags: ["tracking", "order", "shipping", "delivery"],
    },
    {
      category: "faq",
      titleZh: "如何退换货？",
      titleEn: "What is the return and exchange policy?",
      contentZh:
        "我们支持7天无理由退货（国内）和30天退货（跨境）。商品需保持原样、未使用、标签完好。请通过客服发起退货申请，我们会提供退货标签。退款将在收到退货后3-5个工作日内处理。",
      contentEn:
        "We offer 7-day no-questions-asked returns (domestic) and 30-day returns (international). Items must be in original condition, unworn, and with tags attached. Please contact support to initiate a return. Refunds are processed within 3-5 business days of receiving the returned item.",
      tags: ["return", "exchange", "refund", "policy"],
    },
    {
      category: "faq",
      titleZh: "支持哪些支付方式？",
      titleEn: "What payment methods are accepted?",
      contentZh:
        "我们支持：支付宝、微信支付、银联（国内）；Visa、Mastercard、PayPal（国际）。所有支付均通过安全加密处理，保障您的资金安全。",
      contentEn:
        "We accept: Alipay, WeChat Pay, UnionPay (domestic); Visa, Mastercard, PayPal (international). All payments are processed with secure encryption.",
      tags: ["payment", "alipay", "wechat", "visa", "paypal"],
    },
    // Policies
    {
      category: "policy",
      titleZh: "隐私政策",
      titleEn: "Privacy Policy",
      contentZh:
        "StyleAI 重视您的隐私。我们仅收集提供服务所必需的信息。您的个人信息不会出售给第三方。您有权查看、更正和删除您的数据。如有疑问请联系 privacy@styleai.shop。",
      contentEn:
        "StyleAI values your privacy. We only collect information necessary to provide our service. Your personal information will not be sold to third parties. You have the right to access, correct, and delete your data. Contact privacy@styleai.shop with questions.",
      tags: ["privacy", "data", "gdpr", "policy"],
    },
    {
      category: "policy",
      titleZh: "运费政策",
      titleEn: "Shipping Policy",
      contentZh:
        "国内订单：满299元包邮，否则收取10元运费。跨境订单：满$60免运费，否则按重量计算（约$8-15）。偏远地区可能有额外费用。",
      contentEn:
        "Domestic orders: Free shipping on orders over ¥299, otherwise ¥10 flat rate. International orders: Free shipping on orders over $60, otherwise weight-based ($8-15). Remote areas may incur additional fees.",
      tags: ["shipping", "free shipping", "international", "cost"],
    },
    // Size Guides
    {
      category: "size_guide",
      titleZh: "女装尺码表",
      titleEn: "Women's Size Guide",
      contentZh:
        "XS: 胸围80-84cm，腰围60-64cm，臀围84-88cm\nS: 胸围84-88cm，腰围64-68cm，臀围88-92cm\nM: 胸围88-92cm，腰围68-72cm，臀围92-96cm\nL: 胸围92-96cm，腰围72-76cm，臀围96-100cm\nXL: 胸围96-100cm，腰围76-80cm，臀围100-104cm\n建议测量后对照选购，不确定时选大一码。",
      contentEn:
        "XS: Bust 80-84cm, Waist 60-64cm, Hip 84-88cm\nS: Bust 84-88cm, Waist 64-68cm, Hip 88-92cm\nM: Bust 88-92cm, Waist 68-72cm, Hip 92-96cm\nL: Bust 92-96cm, Waist 72-76cm, Hip 96-100cm\nXL: Bust 96-100cm, Waist 76-80cm, Hip 100-104cm\nWe recommend measuring first and sizing up when between sizes.",
      tags: ["size", "sizing", "measurement", "women", "fit"],
    },
    {
      category: "size_guide",
      titleZh: "洗涤保养说明",
      titleEn: "Care Instructions",
      contentZh:
        "真丝制品：手洗或干洗，水温30℃以下，不可漂白，阴干。棉质制品：机洗40℃，可翻面洗涤减少褪色。西装类：建议干洗或专业护理。一般建议反面低温熨烫。",
      contentEn:
        "Silk items: Hand wash or dry clean, max 30°C, no bleach, air dry in shade. Cotton items: Machine wash at 40°C, inside-out to reduce fading. Blazers/suits: Dry clean or professional care recommended. Iron inside-out on low heat.",
      tags: ["care", "washing", "silk", "cotton", "maintenance"],
    },
  ];

  for (const item of knowledgeItems) {
    // Check if exists by titleEn (unique enough for seeding)
    const existing = await prisma.knowledgeBase.findFirst({
      where: { titleEn: item.titleEn },
    });
    if (!existing) {
      await prisma.knowledgeBase.create({ data: item });
    }
  }
  console.log(`✅ Knowledge base seeded: ${knowledgeItems.length} items`);

  console.log("🎉 Seed complete!");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
