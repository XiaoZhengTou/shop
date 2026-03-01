import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

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

    // Production: use Vercel Blob
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const { put } = await import("@vercel/blob");
      const blob = await put(`uploads/${filename}`, file, { access: "public" });
      return NextResponse.json({ url: blob.url });
    }

    // Development: write to local public/uploads
    const { writeFile, mkdir } = await import("fs/promises");
    const { join } = await import("path");
    const uploadDir = join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });
    const bytes = await file.arrayBuffer();
    await writeFile(join(uploadDir, filename), Buffer.from(bytes));
    return NextResponse.json({ url: `/uploads/${filename}` });

  } catch (error) {
    console.error("[POST /api/admin/upload]", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
