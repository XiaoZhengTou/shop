import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { put } from "@vercel/blob";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Only JPEG, PNG, WebP, GIF allowed" }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const filename = `${randomUUID()}.${ext}`;

    // Check if we're in production (Vercel)
    // Vercel automatically sets VERCEL=1, and BLOB_READ_WRITE_TOKEN should be set in Vercel dashboard
    const hasBlobToken = !!process.env.BLOB_READ_WRITE_TOKEN;
    const isVercel = process.env.VERCEL === "1";
    const isProduction = isVercel || hasBlobToken;

    // Log environment info for debugging (only in development or when error occurs)
    if (process.env.NODE_ENV === "development" || !isProduction) {
      console.log("[POST /api/admin/upload] Environment check:", {
        isVercel,
        hasBlobToken,
        isProduction,
        nodeEnv: process.env.NODE_ENV,
      });
    }
    
    if (isProduction) {
      // Use Vercel Blob Storage
      try {
        if (!hasBlobToken) {
          throw new Error("BLOB_READ_WRITE_TOKEN is not set in environment variables");
        }

        // Convert File to Buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        // Upload to Vercel Blob
        // Note: BLOB_READ_WRITE_TOKEN must be set in Vercel project settings
        const blob = await put(`uploads/${filename}`, buffer, {
          access: "public",
          contentType: file.type,
        });
        
        return NextResponse.json({ url: blob.url });
      } catch (blobError: any) {
        console.error("[POST /api/admin/upload] Vercel Blob error:", blobError);
        console.error("Error details:", {
          message: blobError?.message,
          name: blobError?.name,
          code: blobError?.code,
          statusCode: blobError?.statusCode,
          stack: blobError?.stack,
          hasToken: hasBlobToken,
          tokenLength: process.env.BLOB_READ_WRITE_TOKEN?.length || 0,
          isVercel,
        });
        
        return NextResponse.json(
          { 
            error: "Upload failed", 
            details: blobError?.message || "Unknown blob error",
            hint: hasBlobToken 
              ? "Token is set but upload failed. Check Vercel function logs for details."
              : "Please ensure BLOB_READ_WRITE_TOKEN is set in Vercel project settings (Settings → Environment Variables) and redeploy.",
            debug: process.env.NODE_ENV === "development" ? {
              hasToken: hasBlobToken,
              isVercel,
              errorName: blobError?.name,
            } : undefined,
          },
          { status: 500 }
        );
      }
    }

    // Development: write to local public/uploads
    const { writeFile, mkdir } = await import("fs/promises");
    const { join } = await import("path");
    const uploadDir = join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });
    const bytes = await file.arrayBuffer();
    await writeFile(join(uploadDir, filename), Buffer.from(bytes));
    return NextResponse.json({ url: `/uploads/${filename}` });

  } catch (error: any) {
    console.error("[POST /api/admin/upload] Unexpected error:", error);
    console.error("Error stack:", error?.stack);
    return NextResponse.json(
      { 
        error: "Upload failed",
        details: error?.message || "Unknown error",
        stack: process.env.NODE_ENV === "development" ? error?.stack : undefined
      },
      { status: 500 }
    );
  }
}
