import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  PAID: ["SHIPPED"],
  SHIPPED: ["DELIVERED"],
  RETURN_REQUESTED: ["RETURN_APPROVED", "CANCELLED"],
  RETURN_APPROVED: ["RETURN_COMPLETED"],
};

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { status: newStatus } = await req.json();

  const order = await prisma.order.findUnique({
    where: { id },
    select: { id: true, status: true },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const allowed = ALLOWED_TRANSITIONS[order.status] ?? [];
  if (!allowed.includes(newStatus)) {
    return NextResponse.json(
      { error: `Cannot transition from ${order.status} to ${newStatus}` },
      { status: 409 }
    );
  }

  const updated = await prisma.order.update({
    where: { id },
    data: { status: newStatus },
    select: { id: true, status: true },
  });

  return NextResponse.json({ success: true, status: updated.status });
}
