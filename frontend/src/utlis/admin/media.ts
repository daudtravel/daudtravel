/**
 * Uploads are served by the API at `/uploads/...`. Absolute URLs and data URLs
 * are returned untouched.
 */
export function imageUrl(path: string | null | undefined): string {
  if (!path) return "";
  if (/^(https?:)?\/\//.test(path) || path.startsWith("data:")) return path;
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "";
  return `${base}${path.startsWith("/") ? "" : "/"}${path}`;
}
