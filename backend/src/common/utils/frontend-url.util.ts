/**
 * Get the primary frontend URL (first URL in the list)
 * Use this for redirects, email links, etc.
 */
export function getPrimaryFrontendUrl(): string {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

  // Get the first URL from comma-separated list
  const primaryUrl = frontendUrl.split(',')[0].trim();

  // Remove trailing slash
  return primaryUrl.replace(/\/$/, '');
}

/**
 * Get all allowed frontend URLs for CORS
 * Use this for CORS configuration
 */
export function getAllFrontendUrls(): string[] {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

  return frontendUrl
    .split(',')
    .map((url) => url.trim())
    .filter((url) => url.length > 0);
}

/**
 * Check if a URL is an allowed frontend URL
 */
export function isAllowedFrontendUrl(url: string): boolean {
  const allowedUrls = getAllFrontendUrls();
  return allowedUrls.includes(url);
}
