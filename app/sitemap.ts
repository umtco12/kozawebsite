import type { MetadataRoute } from "next";
import { listAuthors, listCategories, listPhotoGalleries, listPublishedArticles } from "../db";
import { corporateSlugs } from "./site-config";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://www.kozatv.com.tr";
  const staticRoutes: MetadataRoute.Sitemap = ["", "/son-dakika", "/canli", "/foto-galeri", "/videolar", "/yazarlar"].map((path) => ({ url: `${base}${path}`, lastModified: new Date(), changeFrequency: path ? "daily" : "always", priority: path ? 0.8 : 1 }));
  const corporateRoutes = corporateSlugs.map((slug) => ({ url: `${base}/kurumsal/${slug}`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.4 }));
  const categoryRoutes = listCategories(true).map((category) => ({ url: `${base}/kategori/${category.slug}`, lastModified: new Date(category.updatedAt), changeFrequency: "hourly" as const, priority: 0.8 }));
  const authorRoutes = listAuthors().map((author) => ({ url: `${base}/yazar/${author.slug}`, lastModified: author.lastPublishedAt ? new Date(author.lastPublishedAt) : new Date(), changeFrequency: "daily" as const, priority: 0.6 }));
  const galleryRoutes = listPhotoGalleries(48).map((article) => ({ url: `${base}/foto-galeri/${article.slug}`, lastModified: new Date(article.updatedAt), changeFrequency: "daily" as const, priority: 0.7 }));
  return [...staticRoutes, ...corporateRoutes, ...categoryRoutes, ...authorRoutes, ...galleryRoutes, ...listPublishedArticles(100).map((article) => ({ url: `${base}/haber/${article.slug}`, lastModified: new Date(article.updatedAt), changeFrequency: "daily" as const, priority: article.isFeatured ? 0.9 : 0.7 }))];
}
