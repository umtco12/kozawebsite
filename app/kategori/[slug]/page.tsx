import type { Metadata } from "next";
import Link from "next/link";
import { getCategoryBySlug, listArticles } from "../../../db";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) return { title: "Kategori bulunamadı", robots: { index: false } };
  return { title: category.seoTitle || `${category.name} Haberleri`, description: category.seoDescription || category.description, alternates: { canonical: `/kategori/${category.slug}` }, openGraph: { title: category.seoTitle, description: category.seoDescription, url: `/kategori/${category.slug}` } };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) return <main className="article-not-found"><Link href="/">← Koza TV</Link><h1>Kategori bulunamadı</h1><p>Bu kategori kaldırılmış veya yayından gizlenmiş olabilir.</p></main>;
  const articles = listArticles({ status: "published", category: category.name, limit: 30 });
  return <main className="category-page"><header className="article-header"><div className="wrap"><Link className="article-brand" href="/"><img src="/koza-logo.png" alt="Koza TV" /></Link><nav><Link href="/">Ana Sayfa</Link><Link href="/canli" className="mini-live"><i /> Canlı Yayın</Link></nav></div></header><section className="category-hero" style={{ borderColor: category.color }}><div className="wrap"><span>KOZA TV HABER</span><h1>{category.name}</h1><p>{category.description}</p><small>{category.articleCount} haber</small></div></section><div className="wrap category-list">{articles.length ? articles.map((article, index) => <Link href={`/haber/${article.slug}`} className={index === 0 ? "category-card lead-category" : "category-card"} key={article.id}><img src={article.heroImage} alt={article.imageAlt} /><div><span style={{ color: category.color }}>{article.category}</span><h2>{article.title}</h2><p>{article.spot}</p><time>{article.publishedAt ? new Date(article.publishedAt).toLocaleString("tr-TR") : ""}</time></div></Link>) : <div className="category-empty"><h2>Bu kategoride henüz yayınlanmış haber yok.</h2><Link href="/">Ana sayfaya dön →</Link></div>}</div></main>;
}
