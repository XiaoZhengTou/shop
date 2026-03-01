import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function checkAdmin() {
  const session = await auth();
  return session?.user?.id && (session.user as { role?: string }).role === "ADMIN";
}

export async function GET(req: NextRequest) {
  if (!await checkAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");

  const items = await prisma.knowledgeBase.findMany({
    where: category ? { category } : undefined,
    orderBy: { updatedAt: "desc" },
    select: { id: true, category: true, titleZh: true, titleEn: true, tags: true, updatedAt: true },
  });

  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  if (!await checkAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { category, titleZh, titleEn, contentZh, contentEn, tags } = body;

  if (!category || !titleZh || !contentZh) {
    return NextResponse.json({ error: "必填字段缺失" }, { status: 400 });
  }

  const item = await prisma.knowledgeBase.create({
    data: {
      category,
      titleZh,
      titleEn: titleEn || "",
      contentZh,
      contentEn: contentEn || "",
      tags: tags ?? [],
    },
  });

  return NextResponse.json({ item }, { status: 201 });
}
