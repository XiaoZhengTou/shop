import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

interface ReviewBody {
  action: "approve" | "reject";
  reviewNote?: string;
}

interface ListingContent {
  zh?: { title: string; description: string; tags: string[] };
  en?: { title: string; description: string; tags: string[] };
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { action, reviewNote }: ReviewBody = await req.json();

  const aiContent = await prisma.aiContent.findUnique({
    where: { id },
    select: { id: true, productId: true, content: true, status: true },
  });

  if (!aiContent) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (aiContent.status !== "PENDING_REVIEW") {
    return NextResponse.json({ error: "Already reviewed" }, { status: 409 });
  }

  const newStatus = action === "approve" ? "APPROVED" : "REJECTED";

  // Update ai_content record
  await prisma.aiContent.update({
    where: { id },
    data: {
      status: newStatus,
      reviewNote: reviewNote || null,
      reviewedAt: new Date(),
      reviewedBy: session.user.id,
    },
  });

  // If approved and linked to a product, update product descriptions
  if (action === "approve" && aiContent.productId) {
    const content = aiContent.content as ListingContent;
    const updateData: Record<string, unknown> = {};

    if (content.zh?.description) {
      updateData.descriptionZh = content.zh.description;
      if (content.zh.title) updateData.titleZh = content.zh.title;
      if (content.zh.tags?.length) updateData.tags = content.zh.tags;
    }
    if (content.en?.description) {
      updateData.descriptionEn = content.en.description;
      if (content.en.title) updateData.titleEn = content.en.title;
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.product.update({
        where: { id: aiContent.productId },
        data: updateData,
      });
    }
  }

  return NextResponse.json({ status: newStatus });
}
