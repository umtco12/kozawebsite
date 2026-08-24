import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategoryBySlug, listCategories, listCategoryPage, listLatestArticles } from "../../../db";
import { redirectIfMapped } from "../../legacy-redirect";
import { SiteFooter, SiteHeader } from "../../site-chrome";
import { displaySpot, displayTitle } from "../../../db/title-model.mjs";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ sayfa?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) return { title: "Kategori bulunamadı", robots: { index: false } };
  return { title: category.seoTitle || `${category.name} Haberleri`, description: category.seoDescription || category.description, alternates: { canonical: `/kategori/${category.slug}` }, openGraph: { title: category.seoTitle, description: category.seoDescription, url: `/kategori/${category.slug}` } };
}

function stamp(value: number | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Istanbul" }).format(value);
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const navItems = listCategories(true).map(({ id, name, slug: categorySlug }) => ({ id, name, slug: categorySlug }));
  const category = getCategoryBySlug(slug);

  if (!category) { redirectIfMapped(`/kategori/${slug}`); notFound(); }

  const page = Math.max(Number((await searchParams).sayfa ?? 1) || 1, 1);
  const { articles, total, pageCount } = listCategoryPage(category.name, page, 18);
  const [lead, ...others] = articles;
  const sidebar = listLatestArticles(20).filter((article) => article.category !== category.name).slice(0, 6);
  const siblings = navItems.filter((item) => item.slug !== category.slug).slice(0, 8);

  return (
    <main className="category-page section-page">
      <SiteHeader categories={navItems} active={`kategori/${category.slug}`} />

      <section className="section-hero" style={{ borderColor: category.color }}>
        <div className="wrap">
          <span style={{ color: category.color }}>KOZA TV HABER</span>
          <h1>{category.name}</h1>
          {category.description && <p>{category.description}</p>}
          <small>{total} haber{pageCount > 1 ? ` · sayfa ${page}/${pageCount}` : ""}</small>
        </div>
      </section>

      {articles.length === 0 ? (
        <div className="wrap category-empty">
          <h2>Bu kategoride henüz yayınlanmış haber yok.</h2>
          <p>Diğer kategorilerden veya son dakika akışından devam edebilirsiniz.</p>
          <div className="search-suggestions">{siblings.map((item) => <a href={`/kategori/${item.slug}`} key={item.id}>{item.name}</a>)}</div>
          <a href="/son-dakika">Son dakika akışı →</a>
        </div>
      ) : (
        <div className="wrap section-layout">
          <div>
            {page === 1 && lead && (
              <a className="section-lead" href={`/haber/${lead.slug}`}>
                <div className="section-lead-thumb"><img src={lead.heroImage} alt={lead.imageAlt} /></div>
                <div>
                  <span style={{ background: category.color }}>{lead.category}</span>
                  <h2>{displayTitle(lead.title)}</h2>
                  {displaySpot(lead.spot, lead.title) && <p>{displaySpot(lead.spot, lead.title)}</p>}
                  <time>{stamp(lead.publishedAt)}</time>
                </div>
              </a>
            )}

            <div className="section-grid">
              {(page === 1 ? others : articles).map((article) => (
                <a className="section-card" href={`/haber/${article.slug}`} key={article.id}>
                  <div className="section-card-thumb"><img src={article.heroImage} alt={article.imageAlt} loading="lazy" /></div>
                  <span style={{ color: category.color }}>{article.category}</span>
                  <h3>{displayTitle(article.title)}</h3>
                  <time>{stamp(article.publishedAt)}</time>
                </a>
              ))}
            </div>

            {pageCount > 1 && (
              <nav className="pager" aria-label="Sayfalama">
                {page > 1 && <a href={`/kategori/${category.slug}${page - 1 > 1 ? `?sayfa=${page - 1}` : ""}`}>← Önceki</a>}
                <span>Sayfa {page} / {pageCount}</span>
                {page < pageCount && <a href={`/kategori/${category.slug}?sayfa=${page + 1}`}>Sonraki →</a>}
              </nav>
            )}
          </div>

          <aside className="section-aside">
            <div className="aside-block">
              <strong>Diğer kategoriler</strong>
              <div className="aside-chips">{siblings.map((item) => <a href={`/kategori/${item.slug}`} key={item.id}>{item.name}</a>)}</div>
            </div>
            <div className="aside-block">
              <strong>Sitede son dakika</strong>
              {sidebar.map((article) => (
                <a className="aside-row" href={`/haber/${article.slug}`} key={article.id}>
                  <img src={article.heroImage} alt="" loading="lazy" />
                  <span><b>{article.category}</b>{displayTitle(article.title)}</span>
                </a>
              ))}
              <a className="aside-more" href="/son-dakika">Tüm son dakika →</a>
            </div>
          </aside>
        </div>
      )}
      <SiteFooter categories={navItems} />
    </main>
  );
}
