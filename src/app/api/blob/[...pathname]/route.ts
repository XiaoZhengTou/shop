import { get } from "@vercel/blob";

function toHeadersInit(input: unknown): HeadersInit | undefined {
  if (!input) return undefined;

  // `@vercel/blob` may return a Headers-like object from `undici` (Node),
  // which is not assignable to the Web `Headers` type that Next.js expects.
  // Normalize to a plain entries array (valid `HeadersInit`).
  const maybeAny = input as any;
  if (typeof maybeAny?.entries === "function") {
    return Array.from(maybeAny.entries() as Iterable<[string, string]>);
  }

  if (typeof maybeAny?.[Symbol.iterator] === "function") {
    return Array.from(maybeAny as Iterable<[string, string]>);
  }

  if (typeof maybeAny === "object") {
    return Object.entries(maybeAny as Record<string, string>);
  }

  return undefined;
}

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

  const resultHeadersInit = toHeadersInit(result.headers);

  // Conditional responses supported by the SDK
  if (result.statusCode === 304) {
    return new Response(null, { status: 304, headers: resultHeadersInit });
  }

  const filename = pathname.split("/").pop() || "file";
  const headers = new Headers(resultHeadersInit);

  headers.set("Content-Type", result.blob.contentType || "application/octet-stream");
  // Force inline rendering for images
  headers.set("Content-Disposition", `inline; filename="${filename}"`);
  // Immutable because we upload with random UUID names
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  headers.set("X-Content-Type-Options", "nosniff");

  return new Response(result.stream, { status: 200, headers });
}

