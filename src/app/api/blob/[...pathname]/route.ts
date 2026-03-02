import { get } from "@vercel/blob";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ pathname: string[] }> }
) {
  const { pathname: segments } = await params;
  const pathname = (segments ?? []).join("/");

  if (!pathname || pathname.includes("..")) {
    return new Response("Bad Request", { status: 400 });
  }

  // Only allow serving from our upload prefix (defense-in-depth).
  if (!pathname.startsWith("uploads/")) {
    return new Response("Forbidden", { status: 403 });
  }

  const result = await get(pathname, { access: "private" });
  if (!result) return new Response("Not Found", { status: 404 });

  // Conditional responses supported by the SDK
  if (result.statusCode === 304) {
    return new Response(null, { status: 304, headers: result.headers });
  }

  const filename = pathname.split("/").pop() || "file";
  const headers = new Headers(result.headers);

  headers.set("Content-Type", result.blob.contentType || "application/octet-stream");
  // Force inline rendering for images
  headers.set("Content-Disposition", `inline; filename="${filename}"`);
  // Immutable because we upload with random UUID names
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  headers.set("X-Content-Type-Options", "nosniff");

  return new Response(result.stream, { status: 200, headers });
}

