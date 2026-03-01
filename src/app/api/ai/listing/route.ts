import { NextRequest, NextResponse } from "next/server";
import { runListingChain, ListingInput } from "@/lib/chains/listing-chain";
import { checkCompliance } from "@/lib/chains/compliance-check";
import { prisma } from "@/lib/prisma";

// Request body schema
interface ListingRequestBody {
  productName: string;
  category: string;
  keyFeatures: string[];
  targetMarket: "zh" | "en" | "both";
  priceHint?: string;
  saveAsDraft?: boolean;  // If true, save to AiContent table as PENDING_REVIEW
}

// Validate request body
function validateBody(body: unknown): body is ListingRequestBody {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.productName === "string" &&
    b.productName.length > 0 &&
    typeof b.category === "string" &&
    b.category.length > 0 &&
    Array.isArray(b.keyFeatures) &&
    b.keyFeatures.length > 0 &&
    (b.targetMarket === "zh" || b.targetMarket === "en" || b.targetMarket === "both")
  );
}

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    if (!validateBody(body)) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          required: ["productName", "category", "keyFeatures (array)", "targetMarket (zh|en|both)"],
        },
        { status: 400 }
      );
    }

    const input: ListingInput = {
      productName: body.productName,
      category: body.category,
      keyFeatures: body.keyFeatures,
      targetMarket: body.targetMarket,
      priceHint: body.priceHint,
    };

    // Generate listing content
    const listing = await runListingChain(input);

    // Run compliance check
    const compliance = checkCompliance({
      zh: listing.zh ? `${listing.zh.title} ${listing.zh.description}` : undefined,
      en: listing.en ? `${listing.en.title} ${listing.en.description}` : undefined,
    });

    // Optionally save as draft for human review
    let savedId: string | undefined;
    if (body.saveAsDraft) {
      const saved = await prisma.aiContent.create({
        data: {
          type: "PRODUCT_LISTING",
          market:
            body.targetMarket === "both"
              ? "BOTH"
              : body.targetMarket === "zh"
              ? "DOMESTIC"
              : "CROSSBORDER",
          content: JSON.parse(JSON.stringify(listing)),
          status: "PENDING_REVIEW",
        },
      });
      savedId = saved.id;
    }

    return NextResponse.json({
      success: true,
      listing,
      compliance,
      ...(savedId && { savedId, status: "PENDING_REVIEW" }),
    });
  } catch (error) {
    console.error("[POST /api/ai/listing] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate listing",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Only allow POST
export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed. Use POST." },
    { status: 405 }
  );
}
