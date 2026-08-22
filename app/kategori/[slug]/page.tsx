import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategoryBySlug, listArticles, listCategories } from "../../../db";
import { redirectIfMapped } from "../../legacy-redirect";
import { SiteFooter, SiteHeader } from "../../site-chrome";

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
  const navItems = listCategories(true).map(({ id, name, slug: categorySlug }) => ({ id, name, slug: categorySlug }));
  const category = getCategoryBySlug(slug);

  if (!category) { redirectIfMapped(`/kategori/${slug}`); notFound(); }

  const articles = listArticles({ status: "published", category: category.name, limit: 30 });

  return (
    <main className="category-page">
      <SiteHeader categories={navItems} active={`kategori/${category.slug}`} />
      <section className="category-hero" style={{ borderColor: category.color }}>
        <div className="wrap">
          <span>KOZA TV HABER</span>
          <h1>{category.name}</h1>
          <p>{category.description}</p>
          <small>{category.articleCount} haber</small>
        </div>
      </section>
      <div className="wrap category-list">
        {articles.length ? articles.map((article, index) => (
          <a href={`/haber/${article.slug}`} className={index === 0 ? "category-card lead-category" : "category-card"} key={article.id}>
            <img src={article.heroImage} alt={article.imageAlt} />
            <div>
              <span style={{ color: category.color }}>{article.category}</span>
              <h2>{article.title}</h2>
              <p>{article.spot}</p>
              <time>{article.publishedAt ? new Date(article.publishedAt).toLocaleString("tr-TR") : ""}</time>
            </div>
          </a>
        )) : (
          <div className="category-empty">
            <h2>Bu kategoride henüz yayınlanmış haber yok.</h2>
            <p>Diğer kategorilerden veya son dakika akışından devam edebilirsiniz.</p>
            <div className="search-suggestions">{navItems.filter((item) => item.slug !== category.slug).slice(0, 6).map((item) => <a href={`/kategori/${item.slug}`} key={item.id}>{item.name}</a>)}</div>
            <a href="/son-dakika">Son dakika akışı →</a>
          </div>
        )}
      </div>
      <SiteFooter categories={navItems} />
    </main>
  );
}
