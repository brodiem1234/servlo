import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://servlo.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/terms",
          "/privacy",
          "/refund",
          "/guarantee",
          "/compare",
          "/contact",
          "/status",
          "/docs/",
          "/book/",
          "/track/",
          "/q/",
          "/refer/",
          "/portal/",
        ],
        disallow: [
          "/dashboard/",
          "/api/",
          "/admin/",
          "/auth/",
          "/onboarding/",
          "/invite/",
          "/offline",
          "/legal/", // redirected — no need to crawl
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
