import type { MetadataRoute } from "next";
import { listAuthors, listCategories, listPublishedArticles } from "../db";
import { corporatePages } from "./site-config";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://www.kozatv.com.tr";
  const staticRoutes: MetadataRoute.Sitemap = ["", "/son-dakika", "/canli", "/videolar", "/yazarlar"].map((path) => ({ url: `${base}${path}`, lastModified: new Date(), changeFrequency: path ? "daily" : "always", priority: path ? 0.8 : 1 }));
  const corporateRoutes = corporatePages.map((page) => ({ url: `${base}/kurumsal/${page.slug}`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.4 }));
  const categoryRoutes = listCategories(true).map((category) => ({ url: `${base}/kategori/${category.slug}`, lastModified: new Date(category.updatedAt), changeFrequency: "hourly" as const, priority: 0.8 }));
  const authorRoutes = listAuthors().map((author) => ({ url: `${base}/yazar/${author.slug}`, lastModified: author.lastPublishedAt ? new Date(author.lastPublishedAt) : new Date(), changeFrequency: "daily" as const, priority: 0.6 }));
  return [...staticRoutes, ...corporateRoutes, ...categoryRoutes, ...authorRoutes, ...listPublishedArticles(100).map((article) => ({ url: `${base}/haber/${article.slug}`, lastModified: new Date(article.updatedAt), changeFrequency: "daily" as const, priority: article.isFeatured ? 0.9 : 0.7 }))];
}
