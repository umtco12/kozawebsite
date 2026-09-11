import { listAuthors, listHomepageArticles, listLatestArticles, listPhotoGalleries, listVideoArticles } from "../db";
import { displaySpot, displayTitle } from "../db/title-model.mjs";
import { LeadSlider } from "./site-client";
import { SiteFooter, SiteHeader, navCategories } from "./site-chrome";
import { AdSlot } from "./ad-slot";

export const dynamic = "force-dynamic";

function clock(value: number | null) {
  if (!value) return "Şimdi";
  return new Intl.DateTimeFormat("tr-TR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Istanbul" }).format(value);
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
  /* İlk kart foto galeri vitriniyle yan yana durur; ardından 12 kart dörderli üç sıra oluşturur. */
  const grid = listHomepageArticles("latest", 13);
  const photoGalleries = listPhotoGalleries(8).filter((gallery) => gallery.id !== grid[0]?.id).slice(0, 3);
  const flow = latest.slice(0, 6);
  const leads = leadPool.map((article) => ({
    category: article.category,
    title: displayTitle(article.title),
    image: article.heroImage,
    imageAlt: article.imageAlt,
    href: `/haber/${article.slug}`,
    isBreaking: Boolean(article.isBreaking),
    headlinePosition: article.headlinePosition,
  }));

  const breakingPool = latest.filter((article) => article.isBreaking);
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
                <div><span>{article.category}</span><h2>{displayTitle(article.title)}</h2></div>
              </a>
            ))}
          </section>
        )}

        <AdSlot placement="home_billboard" className="ad-home-billboard" />

        <section className="main-columns latest-news-section" id="gundem">
          <div>
            <div className="section-head"><div><span>GÜNCEL</span><h2>Son Haberler</h2></div><a href={gundemHref}>Tümünü Gör →</a></div>
            <div className={`latest-lead-layout${photoGalleries.length ? "" : " no-gallery"}`}>
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
              {photoGalleries.length ? (
                <aside className={`home-photo-gallery${photoGalleries.length === 1 ? " home-photo-gallery-single" : photoGalleries.length === 2 ? " home-photo-gallery-duo" : ""}`} aria-label="Foto Galeri">
                  <header><div><span>GÖRSEL HABER</span><h2>Foto Galeri</h2></div><a href="/foto-galeri">Tümünü gör <i aria-hidden="true">→</i></a></header>
                  <a className="home-photo-gallery-lead" href={`/foto-galeri/${photoGalleries[0].slug}`}>
                    <img src={photoGalleries[0].galleryImages[0].src} alt={photoGalleries[0].galleryImages[0].caption || photoGalleries[0].imageAlt} loading="lazy" />
                    <div><small>{photoGalleries[0].category}</small><h3>{displayTitle(photoGalleries[0].title)}</h3><b>Galeriyi aç <i aria-hidden="true">↗</i></b></div>
                  </a>
                  {photoGalleries.length > 1 ? <div className="home-photo-gallery-list">{photoGalleries.slice(1).map((gallery) => (
                    <a href={`/foto-galeri/${gallery.slug}`} key={gallery.id}>
                      <img src={gallery.galleryImages[0].src} alt={gallery.galleryImages[0].caption || gallery.imageAlt} loading="lazy" />
                      <div><small>{gallery.category}</small><h3>{displayTitle(gallery.title)}</h3></div>
                    </a>
                  ))}</div> : null}
                </aside>
              ) : null}
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
