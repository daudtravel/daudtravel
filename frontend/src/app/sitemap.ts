import type { MetadataRoute } from "next";

const BASE_URL = "https://www.daudtravel.com";
const locales = ["ka", "en", "ru", "ar", "tr"] as const;
const API_BASE = "https://api.daudtravel.com/api";

interface Tour {
  id: string;
  updatedAt: string;
}

interface Transfer {
  id: string;
  updatedAt: string;
}

interface ToursApiResponse {
  data: Tour[];
  meta?: { totalPages: number };
}

interface TransfersApiResponse {
  data: Transfer[];
}

async function fetchAllTours(): Promise<Tour[]> {
  try {
    const res = await fetch(`${API_BASE}/tours?limit=500&locale=en`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const json: ToursApiResponse = await res.json();
    return json.data ?? [];
  } catch {
    return [];
  }
}

async function fetchAllTransfers(): Promise<Transfer[]> {
  try {
    const res = await fetch(`${API_BASE}/transfers/public?limit=500`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const json: TransfersApiResponse = await res.json();
    return json.data ?? [];
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date().toISOString();

  // ── Static pages ──────────────────────────────────────────────────────────
  const staticPages = [
    { path: "", priority: 1.0, changeFrequency: "weekly" as const },
    { path: "/tours", priority: 0.9, changeFrequency: "daily" as const },
    { path: "/transfers", priority: 0.9, changeFrequency: "daily" as const },
    { path: "/insurance", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/about", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/contact", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/privacy", priority: 0.3, changeFrequency: "yearly" as const },
    { path: "/terms", priority: 0.3, changeFrequency: "yearly" as const },
  ];

  const staticEntries: MetadataRoute.Sitemap = staticPages.flatMap(
    ({ path, priority, changeFrequency }) =>
      locales.map((locale) => ({
        url: `${BASE_URL}/${locale}${path}`,
        lastModified: now,
        changeFrequency,
        priority,
        alternates: {
          languages: Object.fromEntries(
            locales.map((l) => [l, `${BASE_URL}/${l}${path}`])
          ),
        },
      }))
  );

  // ── Tour detail pages ──────────────────────────────────────────────────────
  const tours = await fetchAllTours();
  const tourEntries: MetadataRoute.Sitemap = tours.flatMap((tour) =>
    locales.map((locale) => ({
      url: `${BASE_URL}/${locale}/tours/${tour.id}`,
      lastModified: tour.updatedAt ?? now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
      alternates: {
        languages: Object.fromEntries(
          locales.map((l) => [l, `${BASE_URL}/${l}/tours/${tour.id}`])
        ),
      },
    }))
  );

  // ── Transfer detail pages ──────────────────────────────────────────────────
  const transfers = await fetchAllTransfers();
  const transferEntries: MetadataRoute.Sitemap = transfers.flatMap((transfer) =>
    locales.map((locale) => ({
      url: `${BASE_URL}/${locale}/transfers/${transfer.id}`,
      lastModified: transfer.updatedAt ?? now,
      changeFrequency: "weekly" as const,
      priority: 0.75,
      alternates: {
        languages: Object.fromEntries(
          locales.map((l) => [l, `${BASE_URL}/${l}/transfers/${transfer.id}`])
        ),
      },
    }))
  );

  return [...staticEntries, ...tourEntries, ...transferEntries];
}
