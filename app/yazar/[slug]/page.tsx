import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAuthorBySlug, listArticlesByAuthor } from "../../../db";
import { redirectIfMapped } from "../../legacy-redirect";
import { SiteFooter, SiteHeader, navCategories } from "../../site-chrome";
import { displaySpot, displayTitle } from "../../../db/title-model.mjs";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const author = getAuthorBySlug(slug);
  if (!author) return { title: "Yazar bulunamadı", robots: { index: false } };
  return {
    title: author.name,
    description: `${author.name} imzasıyla yayımlanan Koza TV haberleri ve yazıları.`,
    alternates: { canonical: `/yazar/${author.slug}` },
    openGraph: { title: author.name, description: `${author.name} imzalı haberler.`, url: `/yazar/${author.slug}` },
  };
}

export default async function AuthorPage({ params }: Props) {
  const { slug } = await params;
  const categories = navCategories();
  const author = getAuthorBySlug(slug);

  if (!author) { redirectIfMapped(`/yazar/${slug}`); notFound(); }

  const articles = listArticlesByAuthor(author.name, 40);
  const jsonLd = { "@context": "https://schema.org", "@type": "Person", name: author.name, url: `https://www.kozatv.com.tr/yazar/${author.slug}`, worksFor: { "@type": "Organization", name: "Koza TV" } };

  return (
    <main className="category-page">
      <SiteHeader categories={categories} active="yazarlar" />
      <section className="category-hero author-hero">
        <div className="wrap">
          <div className="author-hero-badge">{author.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}</div>
          <div>
            <span>KOZA TV İMZA</span>
            <h1>{author.name}</h1>
            <p>{author.articleCount} yayınlanmış haber · Ağırlıklı alan: {author.topCategory || "Haber"}</p>
          </div>
        </div>
      </section>
      <div className="wrap category-list">
        {articles.map((article, index) => (
          <a href={`/haber/${article.slug}`} className={index === 0 ? "category-card lead-category" : "category-card"} key={article.id}>
            <img src={article.heroImage} alt={article.imageAlt} />
            <div>
              <span>{article.category}</span>
              <h2>{displayTitle(article.title)}</h2>
              {displaySpot(article.spot, article.title) && <p>{displaySpot(article.spot, article.title)}</p>}
              <time>{article.publishedAt ? new Date(article.publishedAt).toLocaleString("tr-TR") : ""}</time>
            </div>
          </a>
        ))}
      </div>
      <div className="wrap author-back"><a href="/yazarlar">← Tüm yazarlar ve servisler</a></div>
      <SiteFooter categories={categories} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </main>
  );
}
