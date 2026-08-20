import Link from "next/link";
import { listArticles } from "../../../db";

export const dynamic = "force-dynamic";
const categoryMap: Record<string, string> = { gundem: "Gündem", siyaset: "Siyaset", ekonomi: "Ekonomi", dunya: "Dünya", spor: "Spor", yasam: "Yaşam", teknoloji: "Teknoloji", video: "Video" };

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const category = categoryMap[slug] ?? slug.charAt(0).toLocaleUpperCase("tr-TR") + slug.slice(1); const articles = listArticles({ status: "published", category, limit: 30 });
  return <main className="category-page"><header className="article-header"><div className="wrap"><Link className="article-brand" href="/"><img src="/koza-logo.png" alt="Koza TV" /></Link><nav><Link href="/">Ana Sayfa</Link><Link href="/canli" className="mini-live"><i /> Canlı Yayın</Link></nav></div></header><section className="category-hero"><div className="wrap"><span>KOZA TV HABER</span><h1>{category}</h1><p>{category} kategorisindeki son gelişmeler, özel haberler ve uzman değerlendirmeleri.</p></div></section><div className="wrap category-list">{articles.length ? articles.map((article, index) => <Link href={`/haber/${article.slug}`} className={index === 0 ? "category-card lead-category" : "category-card"} key={article.id}><img src={article.heroImage} alt={article.imageAlt} /><div><span>{article.category}</span><h2>{article.title}</h2><p>{article.spot}</p><time>{article.publishedAt ? new Date(article.publishedAt).toLocaleString("tr-TR") : ""}</time></div></Link>) : <div className="category-empty"><h2>Bu kategoride henüz yayınlanmış haber yok.</h2><Link href="/">Ana sayfaya dön →</Link></div>}</div></main>;
}
