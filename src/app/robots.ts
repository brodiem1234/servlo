import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://servlo.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/legal/", "/docs/", "/book/", "/track/", "/q/", "/refer/", "/portal/"],
        disallow: [
          "/dashboard/",
          "/api/",
          "/admin/",
          "/auth/",
          "/onboarding/",
          "/invite/",
          "/offline",
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
