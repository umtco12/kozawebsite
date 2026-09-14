import { listHomepageArticles, listBreakingArticles } from "../db";
import { displaySpot, displayTitle } from "../db/title-model.mjs";
import { LeadSlider } from "./site-client";
import { SiteFooter, SiteHeader, navCategories } from "./site-chrome";
import { AdSlot } from "./ad-slot";
import { HomeVideos } from "./home-videos";
import { HomeBreakingNews } from "./home-breaking-news";
import { toBreakingItems } from "../db/breaking-feed-model.mjs";
import "./home-breaking-news.css";

export const dynamic = "force-dynamic";

function clock(value: number | null) {
  if (!value) return "Şimdi";
  return new Intl.DateTimeFormat("tr-TR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Istanbul" }).format(value);
}

export default async function Home() {
  const categories = navCategories();

  /* Haber yalnız editörün yayın sırasında seçtiği ana sayfa bölgesine gider.
     Konum seçilmeyen kayıtlar slidera taşınmaz; Son Haberler havuzunda kalır. */
  const leadPool = listHomepageArticles("slider", 5);
  const sideNews = listHomepageArticles("side", 2);
  const belowNews = listHomepageArticles("below", 4);
  /* İlk kart son dakika akışıyla yan yana durur; ardından 12 kart dörderli üç sıra oluşturur. */
  const grid = listHomepageArticles("latest", 13);
  const leads = leadPool.map((article) => ({
    category: article.category,
    title: displayTitle(article.title),
    image: article.heroImage,
    imageAlt: article.imageAlt,
    href: `/haber/${article.slug}`,
    isBreaking: Boolean(article.isBreaking),
    headlinePosition: article.headlinePosition,
  }));

  const breakingPool = listBreakingArticles(5, true);
  const breaking = breakingPool[0];
  const gundemHref = categories.find((category) => category.slug === "gundem") ? "/kategori/gundem" : "/son-dakika";

  return (
    <main className="home">
      <SiteHeader categories={categories} active="home" />

      {/* Şeridin tamamı bağlantıdır: okur habere gitmek için "Habere git" yazısını aramaz. */}
      {breaking && (
        <section className="breaking" id="sondakika" aria-label="Son dakika">
          <a className="wrap breaking-inner" href={`/haber/${breaking.slug}`}>
            <strong><i /> SON DAKİKA</strong>
            <time>{clock(breaking.publishedAt)}</time>
            <p>{displayTitle(breaking.title)}</p>
            <b className="breaking-go">Habere git <span aria-hidden="true">→</span></b>
          </a>
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

        <section className={`hero-grid${sideNews.length ? "" : " hero-grid-no-side"}`} aria-label="Öne çıkan haberler">
          <div className="hero-main">
            <LeadSlider items={leads} />
          </div>
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
                <div><span>{article.category}</span><h2>{displayTitle(article.title)}</h2></div>
              </a>
            ))}
          </section>
        )}

        <AdSlot placement="home_billboard" className="ad-home-billboard" />

        <section className="main-columns latest-news-section" id="gundem">
          <div>
            <div className="section-head"><div><span>GÜNCEL</span><h2>Son Haberler</h2></div><a href={gundemHref}>Tümünü Gör →</a></div>
            <div className={`latest-lead-layout latest-with-breaking${grid[0] ? "" : " latest-no-lead"}`}>
              {grid[0] ? (
                <a href={`/haber/${grid[0].slug}`} className="news-card featured" key={grid[0].id}>
                  <div className="news-thumb"><img src={grid[0].heroImage} alt={grid[0].imageAlt} loading="lazy" />{grid[0].isBreaking ? <b className="breaking-ribbon">SON DAKİKA</b> : null}</div>
                  <div className="card-body">
                    <span>{grid[0].category}</span>
                    <h3>{displayTitle(grid[0].title)}</h3>
                    <p>{displaySpot(grid[0].spot, grid[0].title)}</p>
                  </div>
                </a>
              ) : null}
              <HomeBreakingNews initialItems={toBreakingItems(breakingPool)} />
            </div>
            <div className="news-grid latest-news-grid">
              {grid.slice(1).map((article) => (
                <a href={`/haber/${article.slug}`} className="news-card" key={article.id}>
                  <div className="news-thumb"><img src={article.heroImage} alt={article.imageAlt} loading="lazy" />{article.isBreaking ? <b className="breaking-ribbon">SON DAKİKA</b> : null}</div>
                  <div className="card-body">
                    <span>{article.category}</span>
                    <h3>{displayTitle(article.title)}</h3>
                    <p>{displaySpot(article.spot, article.title)}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>

      </div>

      <HomeVideos />

      <SiteFooter categories={categories} />
    </main>
  );
}
