import type { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots { return { rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api/", "/arama"] }, sitemap: ["https://www.kozatv.com.tr/sitemap.xml", "https://www.kozatv.com.tr/googlenews.xml"], host: "https://www.kozatv.com.tr" }; }
