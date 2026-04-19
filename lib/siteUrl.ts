/**
 * Canonical public URL for CoverageAssist (not shared with other products).
 * Set NEXT_PUBLIC_COVERAGE_ASSIST_URL in .env — avoid copying NEXT_PUBLIC_APP_URL from other apps.
 */
export function getSiteUrl(): URL {
  const raw =
    process.env.NEXT_PUBLIC_COVERAGE_ASSIST_URL?.trim() ||
    "http://localhost:3000";
  try {
    return new URL(raw);
  } catch {
    return new URL("http://localhost:3000");
  }
}
