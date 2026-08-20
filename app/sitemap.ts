import type { MetadataRoute } from "next";
import { listPublishedArticles } from "../db";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://www.kozatv.com.tr";
  const staticRoutes: MetadataRoute.Sitemap = ["", "/canli", "/yazarlar"].map((path) => ({ url: `${base}${path}`, lastModified: new Date(), changeFrequency: path ? "daily" : "always", priority: path ? 0.8 : 1 }));
  return [...staticRoutes, ...listPublishedArticles(100).map((article) => ({ url: `${base}/haber/${article.slug}`, lastModified: new Date(article.updatedAt), changeFrequency: "daily" as const, priority: article.isFeatured ? 0.9 : 0.7 }))];
}
