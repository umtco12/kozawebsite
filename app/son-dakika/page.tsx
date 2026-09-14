import type { Metadata } from "next";
import { listBreakingArticles, listCategories } from "../../db";
import { SiteFooter, SiteHeader, navCategories } from "../site-chrome";
import { displaySpot, displayTitle } from "../../db/title-model.mjs";
import { AdSlot } from "../ad-slot";

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

function clock(value: number | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("tr-TR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Istanbul" }).format(value);
}

function dayLabel(value: number | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", weekday: "long", timeZone: "Europe/Istanbul" }).format(value);
}

export default async function BreakingPage() {
  const categories = navCategories();
  const articles = listBreakingArticles(40);
  const flagged = articles.filter((article) => article.isBreaking);
  const lead = flagged[0] ?? articles[0];
  const rest = articles.filter((article) => article.id !== lead?.id);
  const highlights = rest.slice(0, 3);
  const timeline = rest.slice(3);
  const siblings = listCategories(true).slice(0, 8);

  /* Akış gün başlıklarıyla gruplanır; uzun listede okur nerede olduğunu görür. */
  const groups: { day: string; items: typeof timeline }[] = [];
  for (const article of timeline) {
    const day = dayLabel(article.publishedAt);
    const current = groups[groups.length - 1];
    if (current && current.day === day) current.items.push(article);
    else groups.push({ day, items: [article] });
  }

  return (
    <main className="category-page section-page">
      <SiteHeader categories={categories} active="son-dakika" />

      <section className="section-hero breaking-hero">
        <div className="wrap">
          <span><i className="pulse" /> KOZA TV CANLI AKIŞ</span>
          <h1>Son Dakika</h1>
          <p>Haber Merkezi tarafından doğrulanan gelişmeler yayına alındıkça bu akışa eklenir.</p>
          <small>{flagged.length} son dakika · toplam {articles.length} güncel haber</small>
        </div>
      </section>

      {articles.length === 0 ? (
        <div className="wrap category-empty"><h2>Şu anda yayınlanmış haber yok.</h2><a href="/">Ana sayfaya dön →</a></div>
      ) : (
        <div className="wrap section-layout">
          <div>
            {lead && (
              <a className="section-lead" href={`/haber/${lead.slug}`}>
                <div className="section-lead-thumb">
                  <img src={lead.heroImage} alt={lead.imageAlt} />
                  {lead.isBreaking && <b className="breaking-ribbon">SON DAKİKA</b>}
                </div>
                <div>
                  <span style={{ background: "var(--red)" }}>{lead.isBreaking ? "SON DAKİKA" : lead.category}</span>
                  <h2>{displayTitle(lead.title)}</h2>
                  {displaySpot(lead.spot, lead.title) && <p>{displaySpot(lead.spot, lead.title)}</p>}
                  <time>{stamp(lead.publishedAt)}</time>
                </div>
              </a>
            )}

            {highlights.length > 0 && (
              <div className="section-grid">
                {highlights.map((article) => (
                  <a className="section-card" href={`/haber/${article.slug}`} key={article.id}>
                    <div className="section-card-thumb">
                      <img src={article.heroImage} alt={article.imageAlt} loading="lazy" />
                      {article.isBreaking && <b className="breaking-ribbon">SON DAKİKA</b>}
                    </div>
                    <span>{article.category}</span>
                    <h3>{displayTitle(article.title)}</h3>
                    <time>{stamp(article.publishedAt)}</time>
                  </a>
                ))}
              </div>
            )}

            <AdSlot placement="section_inline" className="ad-section-inline" />

            {groups.length > 0 && (
              <div className="feed">
                <div className="feed-head"><span>DAKİKA DAKİKA</span><strong>Gelişmeler</strong></div>
                {groups.map((group) => (
                  <section key={group.day}>
                    <h2 className="feed-day">{group.day}</h2>
                    {group.items.map((article) => (
                      <a className={article.isBreaking ? "feed-row urgent" : "feed-row"} href={`/haber/${article.slug}`} key={article.id}>
                        <time>{clock(article.publishedAt)}</time>
                        <div>
                          <span>{article.isBreaking ? "SON DAKİKA" : article.category}</span>
                          <h3>{displayTitle(article.title)}</h3>
                        </div>
                        <img src={article.heroImage} alt="" loading="lazy" />
                      </a>
                    ))}
                  </section>
                ))}
              </div>
            )}
          </div>

          <aside className="section-aside">
            <div className="aside-block">
              <strong>Kategoriler</strong>
              <div className="aside-chips">{siblings.map((item) => <a href={`/kategori/${item.slug}`} key={item.id}>{item.name}</a>)}</div>
            </div>
            <div className="aside-block">
              <strong>Son dakika işaretliler</strong>
              {flagged.length ? flagged.slice(0, 6).map((article) => (
                <a className="aside-row" href={`/haber/${article.slug}`} key={article.id}>
                  <img src={article.heroImage} alt="" loading="lazy" />
                  <span><b>{clock(article.publishedAt)}</b>{displayTitle(article.title)}</span>
                </a>
              )) : <p className="aside-empty">Şu anda son dakika olarak işaretlenmiş haber yok. Editör, haber düzenleme ekranındaki <b>Son dakika</b> kutusuyla bu listeyi yönetir.</p>}
            </div>
          </aside>
        </div>
      )}
      <SiteFooter categories={categories} />
    </main>
  );
}
