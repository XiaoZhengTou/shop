import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateRecoveryContent } from "@/lib/services/abandoned-cart-service";

// POST /api/cron/process-marketing-jobs
// Called by a cron scheduler (e.g. Vercel Cron, external cron) every 5-15 minutes
// Processes PENDING jobs whose scheduledAt <= now
export async function POST(request: NextRequest) {
  // Simple secret check to prevent unauthorized calls
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();

    // Fetch due pending jobs (max 20 per run to avoid timeout)
    const jobs = await prisma.marketingJob.findMany({
      where: {
        status: "PENDING",
        scheduledAt: { lte: now },
        type: { in: ["ABANDONED_CART_1", "ABANDONED_CART_2", "ABANDONED_CART_3"] },
      },
      orderBy: { scheduledAt: "asc" },
      take: 20,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    if (jobs.length === 0) {
      return NextResponse.json({ processed: 0, message: "No jobs due" });
    }

    const results: { jobId: string; status: string; error?: string }[] = [];

    for (const job of jobs) {
      try {
        const payload = job.payload as {
          touchNumber: number;
          cartItems: {
            productId: string; titleZh: string; titleEn: string;
            price: number; category: string; stock: number; quantity: number;
          }[];
        };

        // Get user order count for segmentation
        const orderCount = await prisma.order.count({
          where: { userId: job.userId, status: { in: ["PAID", "SHIPPED", "DELIVERED"] } },
        });

        // Generate AI recovery content
        const content = await generateRecoveryContent(
          { name: job.user.name, email: job.user.email, orderCount },
          payload.cartItems,
          payload.touchNumber
        );

        // If coupon needed and doesn't need approval, generate a simple code
        let couponCode: string | null = null;
        if (content.couponDiscount > 0 && !content.needsApproval) {
          couponCode = `BACK${content.couponDiscount}-${job.userId.slice(-6).toUpperCase()}`;
        }

        // Update job with generated content + mark SENT
        // (In production: actually send email via Resend here)
        await prisma.marketingJob.update({
          where: { id: job.id },
          data: {
            status: content.needsApproval ? "PENDING" : "SENT",
            sentAt: content.needsApproval ? null : now,
            payload: JSON.parse(JSON.stringify({
              ...payload,
              generatedContent: content,
              couponCode,
              needsApproval: content.needsApproval,
            })),
          },
        });

        results.push({
          jobId: job.id,
          status: content.needsApproval ? "pending_approval" : "sent",
        });
      } catch (err) {
        console.error(`[cron] Failed to process job ${job.id}:`, err);
        await prisma.marketingJob.update({
          where: { id: job.id },
          data: { status: "FAILED" },
        });
        results.push({ jobId: job.id, status: "failed", error: String(err) });
      }
    }

    return NextResponse.json({ processed: jobs.length, results });
  } catch (error) {
    console.error("[POST /api/cron/process-marketing-jobs]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
