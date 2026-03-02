export function toDisplayImageUrl(input: string): string {
  if (!input) return input;

  // Already proxied
  if (input.startsWith("/api/blob/")) return input;

  // Local dev uploads or static assets
  if (input.startsWith("/uploads/") || input.startsWith("/images/") || input.startsWith("/")) {
    return input;
  }

  // Convert Vercel Blob URLs (public/private) to our proxy endpoint so images can be rendered
  // and Next/Image won't require remotePatterns.
  try {
    const u = new URL(input);
    if (u.hostname.endsWith(".blob.vercel-storage.com")) {
      const pathname = u.pathname.replace(/^\/+/, ""); // e.g. uploads/xxx.png
      return `/api/blob/${pathname}`;
    }
  } catch {
    // ignore invalid URL
  }

  return input;
}

