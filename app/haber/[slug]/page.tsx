import type { Metadata } from "next";
import Link from "next/link";
import { getArticleBySlug, listPublishedArticles } from "../../../db";
import { slugify } from "../../../db/article-model.mjs";
import { ArticleBlocks } from "./article-blocks";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

function fullUrl(path: string) { return new URL(path, "https://www.kozatv.com.tr").toString(); }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params; const article = getArticleBySlug(slug);
  if (!article) return { title: "Haber bulunamadı" };
  const title = article.seoTitle || article.title; const description = article.seoDescription || article.spot; const image = article.heroImage ? fullUrl(article.heroImage) : undefined;
  return { title, description, alternates: { canonical: `/haber/${article.slug}` }, openGraph: { type: "article", title, description, url: `/haber/${article.slug}`, publishedTime: article.publishedAt ? new Date(article.publishedAt).toISOString() : undefined, modifiedTime: new Date(article.updatedAt).toISOString(), authors: [article.author], images: image ? [{ url: image, alt: article.imageAlt }] : [] }, twitter: { card: image ? "summary_large_image" : "summary", title, description, images: image ? [image] : [] } };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params; const article = getArticleBySlug(slug);
  if (!article) return <main className="article-not-found"><Link href="/">← Koza TV</Link><h1>Haber bulunamadı</h1><p>Aradığınız içerik kaldırılmış veya adresi değişmiş olabilir.</p></main>;
  const related = listPublishedArticles(12).filter((item) => item.id !== article.id && item.category === article.category).slice(0, 3);
  const categoryHref = `/kategori/${slugify(article.category)}`;
  const published = article.publishedAt ? new Intl.DateTimeFormat("tr-TR", { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Istanbul" }).format(article.publishedAt) : "";
  const jsonLd = { "@context": "https://schema.org", "@type": "NewsArticle", headline: article.title, description: article.spot, image: article.heroImage ? [fullUrl(article.heroImage)] : [], datePublished: article.publishedAt ? new Date(article.publishedAt).toISOString() : undefined, dateModified: new Date(article.updatedAt).toISOString(), author: [{ "@type": "Organization", name: article.author }], publisher: { "@type": "Organization", name: "Koza TV", logo: { "@type": "ImageObject", url: fullUrl("/koza-logo.png") } }, mainEntityOfPage: fullUrl(`/haber/${article.slug}`) };

  return <main className="article-page">
    <header className="article-header"><div className="wrap"><Link className="article-brand" href="/"><img src="/koza-logo.png" alt="Koza TV" /></Link><nav><Link href="/">Ana Sayfa</Link><Link href={categoryHref}>{article.category}</Link><Link href="/canli" className="mini-live"><i /> Canlı Yayın</Link></nav></div></header>
    <div className="article-breaking"><div className="wrap"><b>SON DAKİKA</b><span>Koza TV Haber Merkezi gelişmeleri anlık olarak doğruluyor ve aktarıyor.</span></div></div>
    <article className="article-container">
      <div className="article-breadcrumb"><Link href="/">Koza TV</Link><span>›</span><Link href={categoryHref}>{article.category}</Link></div>
      <span className="article-category">{article.category}</span><h1>{article.title}</h1><p className="article-spot">{article.spot}</p>
      <div className="article-meta"><div className="author-badge">{article.author.split(" ").map((word) => word[0]).join("").slice(0, 2)}</div><div><strong>{article.author}</strong><time>{published}</time></div><div className="share-buttons"><button aria-label="Haberi paylaş">↗</button><button aria-label="Haberi kaydet">☆</button></div></div>
      <figure><img src={article.heroImage} alt={article.imageAlt} /><figcaption>{article.imageAlt} · Fotoğraf: {article.sourceName}</figcaption></figure>
      <div className="article-layout"><aside className="article-share"><span>PAYLAŞ</span><button>f</button><button>𝕏</button><button>◎</button></aside><div className="article-body">{article.correctionNote && <div className="correction-note"><strong>DÜZELTME NOTU</strong><p>{article.correctionNote}</p></div>}<ArticleBlocks blocks={article.blocks} />{article.sourceName && <div className="source-box"><span>KAYNAK</span><strong>{article.sourceName}</strong>{article.sourceUrl && <a href={article.sourceUrl} target="_blank" rel="noreferrer nofollow">Orijinal kaynağı görüntüle →</a>}</div>}</div><aside className="article-ad"><span>REKLAM</span><strong>300 × 250</strong></aside></div>
      {related.length > 0 && <section className="related"><div className="section-head"><div><span>DEVAMINI OKU</span><h2>İlgili Haberler</h2></div></div><div>{related.map((item) => <Link href={`/haber/${item.slug}`} key={item.id}><img src={item.heroImage} alt={item.imageAlt} /><span>{item.category}</span><h3>{item.title}</h3></Link>)}</div></section>}
    </article>
    <footer className="article-footer"><div className="wrap"><img src="/koza-logo.png" alt="Koza TV" /><p>Doğru haber. Güçlü yorum. Konuşma zamanı.</p><Link href="/">Ana sayfaya dön →</Link></div></footer>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
  </main>;
}
