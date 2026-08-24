import type { Metadata } from "next";
import { listPublishedArticles, listVideoArticles } from "../../db";
import { SiteFooter, SiteHeader, navCategories } from "../site-chrome";
import { displayTitle } from "../../db/title-model.mjs";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Video Merkezi",
  description: "Koza TV haber videoları, program bölümleri ve canlı yayın kayıtları.",
  alternates: { canonical: "/videolar" },
  openGraph: { title: "Koza TV Video Merkezi", description: "Haber videoları ve program bölümleri.", url: "/videolar" },
};

function stamp(value: number | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Istanbul" }).format(value);
}

export default async function VideoCenter() {
  const categories = navCategories();
  const videos = listVideoArticles(30);
  const fallback = videos.length ? [] : listPublishedArticles(6);

  return (
    <main className="category-page video-page">
      <SiteHeader categories={categories} active="videolar" />
      <section className="category-hero video-hero">
        <div className="wrap">
          <span>KOZA TV İZLE</span>
          <h1>Video Merkezi</h1>
          <p>Haber videoları, program bölümleri ve stüdyo yayınları. Canlı yayın için üst menüdeki canlı yayın bağlantısını kullanabilirsiniz.</p>
          <small>{videos.length} video içerik</small>
        </div>
      </section>

      <div className="wrap video-center-grid">
        {videos.length ? videos.map((article) => (
          <a href={`/haber/${article.slug}`} className="video-card" key={article.id}>
            <div className="video-thumb"><img src={article.heroImage} alt={article.imageAlt} /><i aria-hidden="true">▶</i></div>
            <span>{article.category}</span>
            <h2>{displayTitle(article.title)}</h2>
            <time>{stamp(article.publishedAt)}</time>
          </a>
        )) : (
          <div className="category-empty video-empty">
            <h2>Henüz video eklenmiş haber yok.</h2>
            <p>Yönetim panelindeki haber editöründe <strong>Video URL</strong> alanı doldurulan haberler bu sayfada listelenir.</p>
            <div className="search-suggestions">{fallback.map((article) => <a href={`/haber/${article.slug}`} key={article.id}>{displayTitle(article.title)}</a>)}</div>
            <a href="/canli">Canlı yayına git →</a>
          </div>
        )}
      </div>
      <SiteFooter categories={categories} />
    </main>
  );
}
