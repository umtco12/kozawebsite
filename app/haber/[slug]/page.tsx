import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getArticleBySlug, listCategories, listPreviousCategoryArticles, type ArticleRecord } from "../../../db";
import { slugify } from "../../../db/article-model.mjs";
import { redirectIfMapped } from "../../legacy-redirect";
import { SiteFooter, SiteHeader } from "../../site-chrome";
import { ArticleBlocks, ArticleVideoPlayer } from "./article-blocks";
import { ShareButtons } from "./share-buttons";
import { displaySpot, displayTitle } from "../../../db/title-model.mjs";
import { renderAgencyDisclaimer } from "../../../db/agency-model.mjs";
import { AdSlot } from "../../ad-slot";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

function fullUrl(path: string) { return new URL(path, "https://www.kozatv.com.tr").toString(); }

function publishedLabel(value: number | null) {
  return value ? new Intl.DateTimeFormat("tr-TR", { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Istanbul" }).format(value) : "";
}

function ContinuousArticle({ article, index, total }: { article: ArticleRecord; index: number; total: number }) {
  const articleHref = `/haber/${article.slug}`;
  const categoryHref = `/kategori/${slugify(article.category)}`;
  const agencyNotice = article.agencySourceId ? renderAgencyDisclaimer(article.agencyDisclaimer, article.sourceName) : "";
  return <div className="continuous-entry">
    <article className="continuous-article" aria-posinset={index + 1} aria-setsize={total}>
      <header>
        <div className="continuous-kicker"><span>SIRADAKİ HABER</span><small>{String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}</small></div>
        <a className="continuous-category" href={categoryHref}>{article.category}</a>
        <h2><a href={articleHref}>{displayTitle(article.title)}</a></h2>
        {displaySpot(article.spot, article.title) ? <p>{displaySpot(article.spot, article.title)}</p> : null}
        <div className="continuous-meta"><a href={`/yazar/${slugify(article.author)}`}>{article.author}</a><time>{publishedLabel(article.publishedAt)}</time></div>
      </header>
      <figure><div>{article.isBreaking ? <b className="breaking-ribbon">SON DAKİKA</b> : null}<img src={article.heroImage} alt={article.imageAlt} loading="lazy" /></div><figcaption>{article.imageAlt}{article.agencyCredit || article.sourceName ? ` · Fotoğraf: ${article.agencyCredit || article.sourceName}` : ""}</figcaption></figure>
      {article.videoUrl ? <section className="article-primary-video" aria-label="Haber videosu"><div><span>HABER VİDEOSU</span><small>Koza TV video</small></div><ArticleVideoPlayer src={article.videoUrl} title={`${displayTitle(article.title)} videosu`} preload="none" /></section> : null}
      <div className="continuous-body"><ArticleBlocks blocks={article.blocks} excludeVideoUrl={article.videoUrl} lazyImages />{article.agencySourceId ? <aside className="agency-disclaimer"><div><b>AJANS HABERİ</b>{article.sourceName ? <strong>{article.sourceName}</strong> : null}</div>{agencyNotice ? <p>{agencyNotice}</p> : null}{article.agencyExternalId ? <small>Ajans kayıt no: {article.agencyExternalId}</small> : null}</aside> : null}{article.sourceName ? <div className="source-box"><span>KAYNAK</span><strong>{article.sourceName}</strong>{article.sourceUrl ? <a href={article.sourceUrl} target="_blank" rel="noreferrer nofollow">Orijinal kaynağı görüntüle →</a> : null}</div> : null}</div>
      <footer><a href={articleHref}>Haberi ayrı sayfada aç <span aria-hidden="true">→</span></a></footer>
    </article>
    <AdSlot placement="section_inline" className="ad-article-inline" />
  </div>;
}

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

  const continuousArticles = listPreviousCategoryArticles(article, 5);
  const categoryHref = `/kategori/${slugify(article.category)}`;
  const authorHref = `/yazar/${slugify(article.author)}`;
  const shareUrl = fullUrl(`/haber/${article.slug}`);
  const published = publishedLabel(article.publishedAt);
  const agencyNotice = article.agencySourceId ? renderAgencyDisclaimer(article.agencyDisclaimer, article.sourceName) : "";
  const jsonLd = { "@context": "https://schema.org", "@type": "NewsArticle", headline: displayTitle(article.title), description: article.spot, image: article.heroImage ? [fullUrl(article.heroImage)] : [], datePublished: article.publishedAt ? new Date(article.publishedAt).toISOString() : undefined, dateModified: new Date(article.updatedAt).toISOString(), author: [{ "@type": "Organization", name: article.author }], publisher: { "@type": "Organization", name: "Koza TV", logo: { "@type": "ImageObject", url: fullUrl("/koza-logo.png") } }, mainEntityOfPage: fullUrl(`/haber/${article.slug}`) };
  const breadcrumbLd = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Koza TV", item: fullUrl("/") }, { "@type": "ListItem", position: 2, name: article.category, item: fullUrl(categoryHref) }, { "@type": "ListItem", position: 3, name: displayTitle(article.title), item: shareUrl }] };

  return <main className="article-page">
    <SiteHeader categories={navItems} active={`kategori/${slugify(article.category)}`} />
    {article.isBreaking ? <div className="article-breaking"><div className="wrap"><b>SON DAKİKA</b><a href="/son-dakika">Koza TV Haber Merkezi gelişmeleri anlık olarak doğruluyor ve aktarıyor.</a></div></div> : null}
    <article className="article-container">
      <div className="article-breadcrumb"><a href="/">Koza TV</a><span>›</span><a href={categoryHref}>{article.category}</a></div>
      <span className="article-category">{article.category}</span><h1>{displayTitle(article.title)}</h1>{displaySpot(article.spot, article.title) && <p className="article-spot">{displaySpot(article.spot, article.title)}</p>}
      <div className="article-meta"><div className="author-badge">{article.author.split(" ").map((word) => word[0]).join("").slice(0, 2)}</div><div><a className="article-author" href={authorHref}>{article.author}</a><time>{published}</time></div><ShareButtons url={shareUrl} title={article.title} variant="inline" /></div>
      <figure className="article-figure"><div>{article.isBreaking ? <b className="breaking-ribbon">SON DAKİKA</b> : null}<img src={article.heroImage} alt={article.imageAlt} /></div><figcaption>{article.imageAlt}{article.agencyCredit || article.sourceName ? ` · Fotoğraf: ${article.agencyCredit || article.sourceName}` : ""}</figcaption></figure>
      {article.videoUrl ? <section className="article-primary-video" aria-label="Haber videosu"><div><span>HABER VİDEOSU</span><small>Koza TV video</small></div><ArticleVideoPlayer src={article.videoUrl} title={`${displayTitle(article.title)} videosu`} /></section> : null}
      <div className="article-layout"><ShareButtons url={shareUrl} title={article.title} /><div className="article-body">{article.correctionNote && <div className="correction-note"><strong>DÜZELTME NOTU</strong><p>{article.correctionNote}</p></div>}<ArticleBlocks blocks={article.blocks} excludeVideoUrl={article.videoUrl} />{article.agencySourceId && <aside className="agency-disclaimer"><div><b>AJANS HABERİ</b>{article.sourceName ? <strong>{article.sourceName}</strong> : null}</div>{agencyNotice ? <p>{agencyNotice}</p> : null}{article.agencyExternalId || article.agencyReceivedAt ? <small>{article.agencyExternalId ? `Ajans kayıt no: ${article.agencyExternalId}` : ""}{article.agencyExternalId && article.agencyReceivedAt ? " · " : ""}{article.agencyReceivedAt ? `Sisteme alınma: ${new Intl.DateTimeFormat("tr-TR", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Istanbul" }).format(article.agencyReceivedAt)}` : ""}</small> : null}</aside>}{article.sourceName && <div className="source-box"><span>KAYNAK</span><strong>{article.sourceName}</strong>{article.sourceUrl && <a href={article.sourceUrl} target="_blank" rel="noreferrer nofollow">Orijinal kaynağı görüntüle →</a>}</div>}<div className="article-tags"><a href={categoryHref}>#{article.category}</a><a href={authorHref}>#{article.author}</a>{article.isBreaking ? <a href="/son-dakika">#SonDakika</a> : null}</div></div><AdSlot placement="article_sidebar" className="ad-article-sidebar" /></div>
    </article>
    <section className="continuous-reading" id="kesintisiz-okuma" aria-label={`${article.category} kategorisinde kesintisiz okuma`}>
      <div className="continuous-wrap">
        <AdSlot placement="section_inline" className="ad-article-inline" />
        {continuousArticles.length ? <div className="continuous-intro"><span>KESİNTİSİZ OKUMA</span><h2>{article.category} gündemi burada bitmiyor</h2><p>Bu haberden önce yayınlanan {continuousArticles.length} haberi sayfadan ayrılmadan okumaya devam edin.</p></div> : null}
        {continuousArticles.map((item, index) => <ContinuousArticle article={item} index={index} total={continuousArticles.length} key={item.id} />)}
        <a className="continuous-category-more" href={categoryHref}>{article.category} kategorisindeki tüm haberler <span aria-hidden="true">→</span></a>
      </div>
    </section>
    <SiteFooter categories={navItems} />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd).replace(/</g, "\\u003c") }} />
  </main>;
}
