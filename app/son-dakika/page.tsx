import type { Metadata } from "next";
import { listBreakingArticles } from "../../db";
import { SiteFooter, SiteHeader, navCategories } from "../site-chrome";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Son Dakika Haberleri",
  description: "Koza TV Haber Merkezi'nin doğruladığı son dakika gelişmeleri, dakika dakika güncel haber akışı.",
  alternates: { canonical: "/son-dakika" },
  openGraph: { title: "Son Dakika Haberleri", description: "Koza TV son dakika haber akışı.", url: "/son-dakika" },
};

function stamp(value: number | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Istanbul" }).format(value);
}

export default async function BreakingPage() {
  const categories = navCategories();
  const articles = listBreakingArticles(40);
  const flagged = articles.filter((article) => article.isBreaking);
  const lead = flagged[0] ?? articles[0];

  return (
    <main className="category-page">
      <SiteHeader categories={categories} active="son-dakika" />
      <section className="category-hero breaking-hero">
        <div className="wrap">
          <span><i className="pulse" /> KOZA TV CANLI AKIŞ</span>
          <h1>Son Dakika</h1>
          <p>Haber Merkezi tarafından doğrulanan gelişmeler yayına alındıkça bu akışa eklenir.</p>
          <small>{flagged.length} son dakika · toplam {articles.length} güncel haber</small>
        </div>
      </section>

      {lead && (
        <div className="wrap">
          <a className="breaking-lead" href={`/haber/${lead.slug}`}>
            <img src={lead.heroImage} alt={lead.imageAlt} />
            <div>
              <span>{lead.isBreaking ? "SON DAKİKA" : lead.category.toLocaleUpperCase("tr-TR")}</span>
              <h2>{lead.title}</h2>
              <p>{lead.spot}</p>
              <time>{stamp(lead.publishedAt)}</time>
            </div>
          </a>
        </div>
      )}

      <div className="wrap breaking-timeline">
        {articles.length ? articles.map((article) => (
          <a href={`/haber/${article.slug}`} key={article.id} className={article.isBreaking ? "timeline-row urgent" : "timeline-row"}>
            <time>{stamp(article.publishedAt)}</time>
            <div>
              <span>{article.isBreaking ? "SON DAKİKA" : article.category}</span>
              <h3>{article.title}</h3>
              <p>{article.spot}</p>
            </div>
            <i aria-hidden="true">→</i>
          </a>
        )) : (
          <div className="category-empty"><h2>Şu anda yayınlanmış haber yok.</h2><a href="/">Ana sayfaya dön →</a></div>
        )}
      </div>
      <SiteFooter categories={categories} />
    </main>
  );
}
