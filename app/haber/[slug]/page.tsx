import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getArticleBySlug, listCategories, listPublishedArticles } from "../../../db";
import { slugify } from "../../../db/article-model.mjs";
import { redirectIfMapped } from "../../legacy-redirect";
import { SiteFooter, SiteHeader } from "../../site-chrome";
import { ArticleBlocks } from "./article-blocks";
import { ShareButtons } from "./share-buttons";
import { displaySpot, displayTitle } from "../../../db/title-model.mjs";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

function fullUrl(path: string) { return new URL(path, "https://www.kozatv.com.tr").toString(); }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params; const article = getArticleBySlug(slug);
  if (!article) return { title: "Haber bulunamadı", robots: { index: false } };
  const title = displayTitle(article.seoTitle || article.title); const description = article.seoDescription || article.spot; const image = article.heroImage ? fullUrl(article.heroImage) : undefined;
  return { title, description, alternates: { canonical: `/haber/${article.slug}` }, openGraph: { type: "article", title, description, url: `/haber/${article.slug}`, publishedTime: article.publishedAt ? new Date(article.publishedAt).toISOString() : undefined, modifiedTime: new Date(article.updatedAt).toISOString(), authors: [article.author], images: image ? [{ url: image, alt: article.imageAlt }] : [] }, twitter: { card: image ? "summary_large_image" : "summary", title, description, images: image ? [image] : [] } };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params; const article = getArticleBySlug(slug);
  const navItems = listCategories(true).map(({ id, name, slug: categorySlug }) => ({ id, name, slug: categorySlug }));

  if (!article) { redirectIfMapped(`/haber/${slug}`); notFound(); }

  const related = listPublishedArticles(12).filter((item) => item.id !== article.id && item.category === article.category).slice(0, 3);
  const categoryHref = `/kategori/${slugify(article.category)}`;
  const authorHref = `/yazar/${slugify(article.author)}`;
  const shareUrl = fullUrl(`/haber/${article.slug}`);
  const published = article.publishedAt ? new Intl.DateTimeFormat("tr-TR", { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Istanbul" }).format(article.publishedAt) : "";
  const jsonLd = { "@context": "https://schema.org", "@type": "NewsArticle", headline: displayTitle(article.title), description: article.spot, image: article.heroImage ? [fullUrl(article.heroImage)] : [], datePublished: article.publishedAt ? new Date(article.publishedAt).toISOString() : undefined, dateModified: new Date(article.updatedAt).toISOString(), author: [{ "@type": "Organization", name: article.author }], publisher: { "@type": "Organization", name: "Koza TV", logo: { "@type": "ImageObject", url: fullUrl("/koza-logo.png") } }, mainEntityOfPage: fullUrl(`/haber/${article.slug}`) };
  const breadcrumbLd = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Koza TV", item: fullUrl("/") }, { "@type": "ListItem", position: 2, name: article.category, item: fullUrl(categoryHref) }, { "@type": "ListItem", position: 3, name: displayTitle(article.title), item: shareUrl }] };

  return <main className="article-page">
    <SiteHeader categories={navItems} active={`kategori/${slugify(article.category)}`} />
    <div className="article-breaking"><div className="wrap"><b>SON DAKİKA</b><a href="/son-dakika">Koza TV Haber Merkezi gelişmeleri anlık olarak doğruluyor ve aktarıyor.</a></div></div>
    <article className="article-container">
      <div className="article-breadcrumb"><a href="/">Koza TV</a><span>›</span><a href={categoryHref}>{article.category}</a></div>
      <span className="article-category">{article.category}</span><h1>{displayTitle(article.title)}</h1>{displaySpot(article.spot, article.title) && <p className="article-spot">{displaySpot(article.spot, article.title)}</p>}
      <div className="article-meta"><div className="author-badge">{article.author.split(" ").map((word) => word[0]).join("").slice(0, 2)}</div><div><a className="article-author" href={authorHref}>{article.author}</a><time>{published}</time></div><ShareButtons url={shareUrl} title={article.title} variant="inline" /></div>
      <figure><img src={article.heroImage} alt={article.imageAlt} /><figcaption>{article.imageAlt} · Fotoğraf: {article.sourceName}</figcaption></figure>
      <div className="article-layout"><ShareButtons url={shareUrl} title={article.title} /><div className="article-body">{article.correctionNote && <div className="correction-note"><strong>DÜZELTME NOTU</strong><p>{article.correctionNote}</p></div>}<ArticleBlocks blocks={article.blocks} />{article.videoUrl && <div className="article-video"><span>VİDEO</span><a href={article.videoUrl} target="_blank" rel="noreferrer">Haberin videosunu izle →</a></div>}{article.sourceName && <div className="source-box"><span>KAYNAK</span><strong>{article.sourceName}</strong>{article.sourceUrl && <a href={article.sourceUrl} target="_blank" rel="noreferrer nofollow">Orijinal kaynağı görüntüle →</a>}</div>}<div className="article-tags"><a href={categoryHref}>#{article.category}</a><a href={authorHref}>#{article.author}</a><a href="/son-dakika">#SonDakika</a></div></div><aside className="article-ad"><span>REKLAM</span><strong>300 × 250</strong></aside></div>
      {related.length > 0 && <section className="related"><div className="section-head"><div><span>DEVAMINI OKU</span><h2>İlgili Haberler</h2></div><a href={categoryHref}>Tümü →</a></div><div>{related.map((item) => <a href={`/haber/${item.slug}`} key={item.id}><img src={item.heroImage} alt={item.imageAlt} /><span>{item.category}</span><h3>{displayTitle(item.title)}</h3></a>)}</div></section>}
    </article>
    <SiteFooter categories={navItems} />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd).replace(/</g, "\\u003c") }} />
  </main>;
}
