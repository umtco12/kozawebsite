import { listAuthors, listLatestArticles, listPublishedArticles, listVideoArticles } from "../db";
import { selectHomepageLeads } from "../db/homepage-model.mjs";
import { displaySpot, displayTitle } from "../db/title-model.mjs";
import { LeadSlider } from "./site-client";
import { SiteFooter, SiteHeader, navCategories } from "./site-chrome";

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

export default async function Home() {
  const categories = navCategories();
  const featured = listPublishedArticles(20).filter((article) => article.isFeatured);
  const latest = listLatestArticles(50);
  const authors = listAuthors().slice(0, 4);
  const videos = listVideoArticles(6);

  /* Yalnız güncel havuzdaki editör seçimleri öne alınır; eski demo manşetleri
     binlerce gerçek haber aktarıldıktan sonra vitrini işgal etmez. */
  const leadPool = selectHomepageLeads({ featured, latest, limit: 5, recentWindow: 40 });
  const leads = leadPool.map((article) => ({
    category: article.category,
    title: displayTitle(article.title),
    summary: displaySpot(article.spot, article.title),
    image: article.heroImage,
    imageAlt: article.imageAlt,
    href: `/haber/${article.slug}`,
    published: stamp(article.publishedAt),
  }));

  /* Bölümler sırayla doldurulur. Yeni kurulumda ya da az haber varken havuz tükenirse
     bölüm boş bırakılmaz; en güncel haberlerle tamamlanır. */
  const used = new Set(leadPool.map((article) => article.id));
  function take(count: number) {
    const picked = latest.filter((article) => !used.has(article.id)).slice(0, count);
    picked.forEach((article) => used.add(article.id));
    if (picked.length >= count) return picked;
    const chosen = new Set(picked.map((article) => article.id));
    return [...picked, ...latest.filter((article) => !chosen.has(article.id)).slice(0, count - picked.length)];
  }

  /* Eski vitrindeki büyük manşet + dört güncel haber ritmi korunur; kartlarda aktif
     manşet tekrar edilmez ve tasarım yeni sitenin premium diliyle sunulur. */
  const spotlight = leadPool.slice(1, 5);
  if (spotlight.length < 4) spotlight.push(...take(4 - spotlight.length));
  const flow = take(6);
  const grid = take(8);
  const sidebar = take(8);
  const breaking = latest.find((article) => article.isBreaking) ?? latest[0];
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
          <aside className="hero-flow">
            <div className="hero-flow-head"><span>CANLI</span><strong>Günün Akışı</strong><small>Son güncelleme {clock(latest[0]?.publishedAt ?? null)}</small></div>
            {flow.map((article, index) => (
              <a href={`/haber/${article.slug}`} className={index === 0 ? "flow-item active" : "flow-item"} key={article.id}>
                <time>{clock(article.publishedAt)}</time>
                <div>
                  <span>{article.isBreaking ? "SON DAKİKA" : article.category.toLocaleUpperCase("tr-TR")}</span>
                  <h2>{displayTitle(article.title)}</h2>
                </div>
              </a>
            ))}
            <a className="flow-more" href="/son-dakika">Tüm gelişmeleri gör <span>→</span></a>
          </aside>
        </section>

        {spotlight.length > 0 && (
          <section className="spotlight" aria-label="Öne çıkan başlıklar">
            <div className="spotlight-label"><span>ŞİMDİ</span><strong>Öne Çıkanlar</strong></div>
            {spotlight.map((article) => (
              <a className="spotlight-card" href={`/haber/${article.slug}`} key={article.id}>
                <img src={article.heroImage} alt={article.imageAlt} loading="lazy" />
                <div>
                  <span>{article.category}</span>
                  <h2>{displayTitle(article.title)}</h2>
                  <time>{clock(article.publishedAt)}</time>
                </div>
              </a>
            ))}
          </section>
        )}

        <section className="main-columns" id="gundem">
          <div>
            <div className="section-head"><div><span>GÜNCEL</span><h2>Son Haberler</h2></div><a href={gundemHref}>Tümünü Gör →</a></div>
            <div className="news-grid">
              {grid.map((article, index) => (
                <a href={`/haber/${article.slug}`} className={index === 0 ? "news-card featured" : "news-card"} key={article.id}>
                  <div className="news-thumb"><img src={article.heroImage} alt={article.imageAlt} loading="lazy" /></div>
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
          <aside className="latest">
            <div className="latest-title"><i /> SON DAKİKA</div>
            {sidebar.map((article) => (
              <a href={`/haber/${article.slug}`} key={article.id}>
                <time>{clock(article.publishedAt)}</time>
                <p>{displayTitle(article.title)}</p>
              </a>
            ))}
            <a className="latest-more" href="/son-dakika">Daha Fazla Haber</a>
          </aside>
        </section>

        {authors.length > 0 && (
          <section className="writers-strip">
            <div className="section-title vertical"><span>KÖŞE</span><strong>YAZARLARI</strong></div>
            <div className="writer-list">
              {authors.map((author, index) => (
                <a href={`/yazar/${author.slug}`} className="writer" key={author.slug}>
                  <div className={`avatar avatar-${index + 1}`}>{author.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}</div>
                  <div><strong>{author.name}</strong><p>{displayTitle(author.latestTitle)}</p></div>
                </a>
              ))}
            </div>
            <a href="/yazarlar" className="round-arrow" aria-label="Tüm yazarlar">→</a>
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
              {(videos.length > 1 ? videos.slice(1, 4) : spotlight.slice(0, 3)).map((article) => (
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
