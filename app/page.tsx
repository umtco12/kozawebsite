import { listAuthors, listHomepageArticles, listLatestArticles, listVideoArticles } from "../db";
import { displaySpot, displayTitle } from "../db/title-model.mjs";
import { LeadSlider } from "./site-client";
import { SiteFooter, SiteHeader, navCategories } from "./site-chrome";
import { AdSlot } from "./ad-slot";

export const dynamic = "force-dynamic";

function clock(value: number | null) {
  if (!value) return "Şimdi";
  return new Intl.DateTimeFormat("tr-TR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Istanbul" }).format(value);
}

function stamp(value: number | null) {
  if (!value) return "Koza TV Haber Merkezi";
  return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Istanbul" }).format(value);
}

function dayStamp(value: number | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Istanbul" }).format(value);
}

function authorName(value: string) {
  const normalized = value.trim();
  if (/^administrator administrator$/i.test(normalized)) return "Koza TV Editör Masası";
  if (/^koza\s*tv$/i.test(normalized)) return "Koza TV";
  return normalized;
}

function authorInitials(value: string) {
  return authorName(value).split(/\s+/).filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toLocaleUpperCase("tr-TR") || "KT";
}

function authorKind(value: string) {
  return /haber merkezi|koza\s*tv|administrator|haber servisi/i.test(value) ? "HABER SERVİSİ" : "KÖŞE YAZARI";
}
export default async function Home() {
  const categories = navCategories();
  const latest = listLatestArticles(100);
  const authors = listAuthors().slice(0, 4);
  const videos = listVideoArticles(6);

  /* Haber yalnız editörün yayın sırasında seçtiği ana sayfa bölgesine gider.
     Konum seçilmeyen kayıtlar slidera taşınmaz; Son Haberler havuzunda kalır. */
  const leadPool = listHomepageArticles("slider", 5);
  const sideNews = listHomepageArticles("side", 2);
  const belowNews = listHomepageArticles("below", 4);
  const grid = latest.filter((article) => article.homepagePlacement === "latest").slice(0, 8);
  const flow = latest.slice(0, 6);
  const leads = leadPool.map((article) => ({
    category: article.category,
    title: displayTitle(article.title),
    image: article.heroImage,
    imageAlt: article.imageAlt,
    href: `/haber/${article.slug}`,
    published: stamp(article.publishedAt),
    isBreaking: Boolean(article.isBreaking),
    headlinePosition: article.headlinePosition,
  }));

  const breakingPool = latest.filter((article) => article.isBreaking);
  const sidebar = [...breakingPool, ...latest.filter((article) => !article.isBreaking)].slice(0, 5);
  const breaking = breakingPool[0];
  const gundemHref = categories.find((category) => category.slug === "gundem") ? "/kategori/gundem" : "/son-dakika";
  const videoLead = videos[0];

  return (
    <main className="home">
      <SiteHeader categories={categories} active="home" />

      {breaking && (
        <section className="breaking" id="sondakika" aria-label="Son dakika">
          <div className="wrap breaking-inner">
            <strong><i /> SON DAKİKA</strong>
            <time>{clock(breaking.publishedAt)}</time>
            <p>{displayTitle(breaking.title)}</p>
            <a href={`/haber/${breaking.slug}`}>Habere git <span>→</span></a>
          </div>
        </section>
      )}

      <div className="wrap content">
        <header className="front-page-head">
          <div>
            <span>KOZA TV HABER</span>
            <strong>Günün Öne Çıkanları</strong>
          </div>
          <p>Türkiye ve dünyadan doğrulanmış gelişmeler, canlı akış ve güçlü yorum.</p>
        </header>

        <section className="hero-grid" aria-label="Öne çıkan haberler">
          <LeadSlider items={leads} />
          {sideNews.length > 0 && (
            <aside className="hero-side-news" aria-label="Manşet yanı haberleri">
              {sideNews.map((article, index) => (
                <a href={`/haber/${article.slug}`} className={`hero-side-card hero-side-card-${index + 1}`} key={article.id}>
                  <img src={article.heroImage} alt={article.imageAlt} loading={index === 0 ? "eager" : "lazy"} />
                  <div>
                    <h2>{displayTitle(article.title)}</h2>
                  </div>
                </a>
              ))}
            </aside>
          )}
        </section>

        {belowNews.length > 0 && (
          <section className="headline-below" aria-label="Manşet altı haberleri">
            {belowNews.map((article) => (
              <a href={`/haber/${article.slug}`} className="headline-below-card" key={article.id}>
                <div className="headline-below-image">
                  <img src={article.heroImage} alt={article.imageAlt} loading="lazy" />
                  {article.isBreaking ? <b className="breaking-ribbon">SON DAKİKA</b> : null}
                </div>
                <div><span>{article.category}</span><h2>{displayTitle(article.title)}</h2><time>{dayStamp(article.publishedAt)}</time></div>
              </a>
            ))}
          </section>
        )}

        <AdSlot placement="home_billboard" className="ad-home-billboard" />

        <section className="main-columns" id="gundem">
          <div>
            <div className="section-head"><div><span>GÜNCEL</span><h2>Son Haberler</h2></div><a href={gundemHref}>Tümünü Gör →</a></div>
            <div className="news-grid">
              {grid.map((article, index) => (
                <a href={`/haber/${article.slug}`} className={index === 0 ? "news-card featured" : "news-card"} key={article.id}>
                  <div className="news-thumb"><img src={article.heroImage} alt={article.imageAlt} loading="lazy" />{article.isBreaking ? <b className="breaking-ribbon">SON DAKİKA</b> : null}</div>
                  <div className="card-body">
                    <span>{article.category}</span>
                    <h3>{displayTitle(article.title)}</h3>
                    <p>{displaySpot(article.spot, article.title)}</p>
                    <time>{dayStamp(article.publishedAt)}</time>
                  </div>
                </a>
              ))}
            </div>
          </div>
          <aside className="latest" aria-label="Son dakika haber akışı">
            <div className="latest-title">
              <span><i /> CANLI AKIŞ</span>
              <strong>Son Dakika</strong>
              <small>{sidebar.length} güncel gelişme</small>
            </div>
            <div className="latest-list">
            {sidebar.map((article, index) => (
              <a className="latest-item" href={`/haber/${article.slug}`} key={article.id}>
                <time>{clock(article.publishedAt)}</time>
                <p><span>{article.isBreaking ? "SON DAKİKA" : article.category}</span>{displayTitle(article.title)}</p>
                <b aria-hidden="true">{String(index + 1).padStart(2, "0")}</b>
              </a>
            ))}
            </div>
            <a className="latest-more" href="/son-dakika"><span>Tüm son dakika haberleri</span><b aria-hidden="true">→</b></a>
          </aside>
        </section>

        <section className="home-flow-lower" aria-labelledby="home-flow-title">
          <header className="home-flow-lower-head">
            <div><span>CANLI</span><div><h2 id="home-flow-title">Günün Akışı</h2><small>Son güncelleme {clock(latest[0]?.publishedAt ?? null)}</small></div></div>
            <a href="/son-dakika">Tüm gelişmeleri gör <b aria-hidden="true">→</b></a>
          </header>
          <div className="home-flow-grid">
            {flow.map((article, index) => (
              <a href={`/haber/${article.slug}`} className={index === 0 ? "flow-item active" : "flow-item"} key={article.id}>
                <time>{clock(article.publishedAt)}</time>
                <div>
                  <span>{article.isBreaking ? "SON DAKİKA" : article.category.toLocaleUpperCase("tr-TR")}</span>
                  <h2>{displayTitle(article.title)}</h2>
                </div>
              </a>
            ))}
          </div>
        </section>

        {authors.length > 0 && (
          <section className="writers-showcase" aria-labelledby="writers-showcase-title">
            <header className="writers-showcase-head">
              <div>
                <span>KÖŞE YAZARLARI · HABER SERVİSLERİ</span>
                <h2 id="writers-showcase-title">Köşe Yazarları &amp; Haber Servisleri</h2>
                <p>Gündemi hazırlayan kalemler ve haber masalarının son çalışmaları.</p>
              </div>
              <a href="/yazarlar">Tüm imzaları gör <i aria-hidden="true">→</i></a>
            </header>
            <div className="writers-showcase-grid">
              {authors.map((author, index) => (
                <a href={`/yazar/${author.slug}`} className={`writer-profile writer-tone-${(index % 4) + 1}`} key={author.slug}>
                  <div className="writer-profile-top">
                    <div className="writer-monogram" aria-hidden="true">{authorInitials(author.name)}</div>
                    <div className="writer-profile-meta"><span>{authorKind(author.name)}</span><small>{author.articleCount} HABER</small></div>
                  </div>
                  <h3>{authorName(author.name)}</h3>
                  <p>{displayTitle(author.latestTitle) || "Yeni içerik hazırlanıyor."}</p>
                  <div className="writer-profile-foot"><span>{author.topCategory || "Koza TV"}</span><b>Arşivi gör <i aria-hidden="true">↗</i></b></div>
                </a>
              ))}
            </div>
          </section>
        )}
      </div>

      <section className="video-section" id="video">
        <div className="wrap">
          <div className="section-head light"><div><span>KOZA TV</span><h2>İzle</h2></div><a href="/videolar">Tüm Videolar →</a></div>
          <div className="video-grid">
            {videoLead ? (
              <a className="video-main" href={`/haber/${videoLead.slug}`}>
                <img src={videoLead.heroImage} alt={videoLead.imageAlt} loading="lazy" />
                <i aria-hidden="true">▶</i>
                <div><span>{videoLead.category.toLocaleUpperCase("tr-TR")}</span><h3>{displayTitle(videoLead.title)}</h3></div>
              </a>
            ) : (
              <a className="video-main" href="/canli">
                <img src="/news/studio.jpg" alt="Koza TV stüdyosu" loading="lazy" />
                <i aria-hidden="true">▶</i>
                <div><span>CANLI</span><h3>Koza TV canlı yayınını izleyin</h3></div>
              </a>
            )}
            <div className="video-list">
              {(videos.length > 1 ? videos.slice(1, 4) : latest.slice(0, 3)).map((article) => (
                <a href={`/haber/${article.slug}`} key={article.id}>
                  <div><img src={article.heroImage} alt={article.imageAlt} loading="lazy" /><i>▶</i></div>
                  <p><span>{article.category}</span>{displayTitle(article.title)}</p>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      <SiteFooter categories={categories} />
    </main>
  );
}
