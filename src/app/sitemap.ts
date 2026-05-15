import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://servlo.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // Public marketing pages
  const marketing: MetadataRoute.Sitemap = [
    "",
    "/contact",
    "/status",
    "/auth/signup",
    "/auth/login",
  ].map((path) => ({
    url: `${BASE_URL}${path}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: path === "" ? 1.0 : 0.8,
  }));

  // Legal pages (canonical URLs — /legal/* redirect here)
  const legal: MetadataRoute.Sitemap = [
    "/terms",
    "/privacy",
    "/refund",
  ].map((path) => ({
    url: `${BASE_URL}${path}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  // Public documentation pages
  const docs: MetadataRoute.Sitemap = [
    "/docs",
    "/docs/onboarding",
    "/docs/clients",
    "/docs/invoices",
    "/docs/grow-overview",
    "/docs/local-seo",
    "/docs/email-marketing",
    "/docs/email-setup",
    "/docs/client-portal",
    "/docs/compliance",
  ].map((path) => ({
    url: `${BASE_URL}${path}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  // Comparison pages (high SEO value)
  const compare: MetadataRoute.Sitemap = [
    "/compare",
    "/compare/servicem8",
    "/compare/tradify",
    "/guarantee",
  ].map((path) => ({
    url: `${BASE_URL}${path}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...marketing, ...legal, ...docs, ...compare];
}
