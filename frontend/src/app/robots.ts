import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/*/admin",
          "/api/",
          "/*/pay/",
          "/*/payment",
          "/*/order",
        ],
      },
    ],
    sitemap: "https://www.daudtravel.com/sitemap.xml",
    host: "https://www.daudtravel.com",
  };
}
