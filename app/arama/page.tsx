import type { Metadata } from "next";
import { listPublishedArticles, searchArticles } from "../../db";
import { SiteFooter, SiteHeader, navCategories } from "../site-chrome";
import { displaySpot, displayTitle } from "../../db/title-model.mjs";

export const dynamic = "force-dynamic";
type Props = { searchParams: Promise<{ q?: string | string[] }> };

export const metadata: Metadata = { title: "Haber arama", description: "Koza TV haber arşivinde başlık, spot, metin, kategori ve yazar üzerinden arama yapın.", robots: { index: false } };

function readQuery(value?: string | string[]) { return (Array.isArray(value) ? value[0] : value ?? "").trim().slice(0, 120); }

export default async function SearchPage({ searchParams }: Props) {
  const query = readQuery((await searchParams).q);
  const categories = navCategories();
  const results = query.length >= 2 ? searchArticles(query, 40) : [];
  const popular = listPublishedArticles(6);
  const tooShort = query.length > 0 && query.length < 2;

  return (
    <main className="category-page">
      <SiteHeader categories={categories} />
      <section className="category-hero search-hero">
        <div className="wrap">
          <span>KOZA TV ARŞİV</span>
          <h1>{query ? `“${query}” için sonuçlar` : "Haber arama"}</h1>
          <form action="/arama" method="get" role="search" className="search-page-form">
            <input type="search" name="q" defaultValue={query} placeholder="Örn. ekonomi, seçim, deprem…" aria-label="Arama terimi" minLength={2} />
            <button type="submit">Ara</button>
          </form>
          <small>{tooShort ? "En az 2 karakter yazın." : query ? `${results.length} sonuç bulundu` : "Başlık, spot, haber metni, kategori ve yazar alanlarında arama yapılır."}</small>
        </div>
      </section>
      <div className="wrap category-list">
        {results.length ? results.map((article) => (
          <a href={`/haber/${article.slug}`} className="category-card" key={article.id}>
            <img src={article.heroImage} alt={article.imageAlt} />
            <div>
              <span>{article.category}</span>
              <h2>{displayTitle(article.title)}</h2>
              {displaySpot(article.spot, article.title) && <p>{displaySpot(article.spot, article.title)}</p>}
              <time>{article.publishedAt ? new Date(article.publishedAt).toLocaleString("tr-TR") : ""}</time>
            </div>
          </a>
        )) : (
          <div className="category-empty">
            <h2>{query && !tooShort ? "Bu arama için haber bulunamadı." : "Aramaya başlayın."}</h2>
            <p>Farklı bir kelime deneyebilir veya güncel haberlerden devam edebilirsiniz.</p>
            <div className="search-suggestions">
              {popular.map((article) => <a href={`/haber/${article.slug}`} key={article.id}>{displayTitle(article.title)}</a>)}
            </div>
            <a href="/">Ana sayfaya dön →</a>
          </div>
        )}
      </div>
      <SiteFooter categories={categories} />
    </main>
  );
}
