import { listAuthors, listPublishedArticles, listVideoArticles } from "../db";
import { LeadSlider } from "./site-client";
import { SiteFooter, SiteHeader, navCategories } from "./site-chrome";

export const dynamic = "force-dynamic";

function articleTime(value: number | null) {
  if (!value) return "Şimdi";
  return new Intl.DateTimeFormat("tr-TR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Istanbul" }).format(value);
}

function articleDateTime(value: number | null) {
  if (!value) return "Koza TV Haber Merkezi";
  return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Istanbul" }).format(value);
}

export default async function Home() {
  const articles = listPublishedArticles(20);
  const categories = navCategories();
  const authors = listAuthors().slice(0, 4);
  const videos = listVideoArticles(6);
  const featured = articles.filter((article) => article.isFeatured).slice(0, 3);
  const leads = (featured.length >= 3 ? featured : articles.slice(0, 3)).map((article) => ({ category: article.category, title: article.title, summary: article.spot, image: article.heroImage, href: `/haber/${article.slug}`, published: articleDateTime(article.publishedAt) }));
  const latest = articles.slice(0, 6);
  const news = articles.slice(1, 5);
  const breaking = articles.find((article) => article.isBreaking) ?? articles[0];
  const gundemHref = categories.find((category) => category.slug === "gundem") ? "/kategori/gundem" : "/son-dakika";
  const videoLead = videos[0] ?? news[0];

  return (
    <main>
      <SiteHeader categories={categories} active="home" />

      <section className="breaking" id="sondakika" aria-label="Son dakika"><div className="wrap breaking-inner"><strong><i /> SON DAKİKA</strong><time>{articleTime(breaking?.publishedAt ?? null)}</time><p>{breaking?.title ?? "Koza TV Haber Merkezi gelişmeleri aktarıyor."}</p><a href={breaking ? `/haber/${breaking.slug}` : "/son-dakika"}>Habere git <span>→</span></a></div></section>

      <div className="wrap content">
        <section className="hero-grid" aria-label="Öne çıkan haberler">
          <LeadSlider items={leads} />
          <aside className="hero-flow">
            <div className="hero-flow-head"><span>CANLI</span><strong>Günün Akışı</strong><small>Son güncelleme {articleTime(articles[0]?.publishedAt ?? null)}</small></div>
            {latest.slice(0, 5).map((article, index) => <a href={`/haber/${article.slug}`} className={index === 0 ? "flow-item active" : "flow-item"} key={article.id}><time>{articleTime(article.publishedAt)}</time><div><span>{article.isBreaking ? "SON DAKİKA" : article.category.toLocaleUpperCase("tr-TR")}</span><h2>{article.title}</h2></div></a>)}
            <a className="flow-more" href="/son-dakika">Tüm gelişmeleri gör <span>→</span></a>
          </aside>
        </section>

        <section className="spotlight" aria-label="Öne çıkan başlıklar">
          <div className="spotlight-label"><span>ŞİMDİ</span><strong>Öne Çıkanlar</strong></div>
          {news.slice(0, 3).map((article) => <a className="spotlight-card" href={`/haber/${article.slug}`} key={article.id}><img src={article.heroImage} alt={article.imageAlt} /><div><span>{article.category}</span><h2>{article.title}</h2><time>{articleTime(article.publishedAt)}</time></div></a>)}
        </section>

        {authors.length > 0 && <section className="writers-strip">
          <div className="section-title vertical"><span>KÖŞE</span><strong>YAZARLARI</strong></div>
          <div className="writer-list">{authors.map((author, index) => <a href={`/yazar/${author.slug}`} className="writer" key={author.slug}><div className={`avatar avatar-${index + 1}`}>{author.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}</div><div><strong>{author.name}</strong><p>{author.latestTitle}</p></div></a>)}</div>
          <a href="/yazarlar" className="round-arrow" aria-label="Tüm yazarlar">→</a>
        </section>}

        <section className="main-columns" id="gundem">
          <div><div className="section-head"><div><span>GÜNCEL</span><h2>Gündem</h2></div><a href={gundemHref}>Tümünü Gör →</a></div><div className="news-grid">{news.map((article, index) => <a href={`/haber/${article.slug}`} className={index === 0 ? "news-card featured" : "news-card"} key={article.id}><img src={article.heroImage} alt={article.imageAlt} /><div className="card-body"><span>{article.category}</span><h3>{article.title}</h3><p>{article.spot}</p><time>• {articleTime(article.publishedAt)}</time></div></a>)}</div></div>
          <aside className="latest"><div className="latest-title"><i /> SON DAKİKA</div>{latest.map((article) => <a href={`/haber/${article.slug}`} key={article.id}><time>{articleTime(article.publishedAt)}</time><p>{article.title}</p></a>)}<a className="latest-more" href="/son-dakika">Daha Fazla Haber</a></aside>
        </section>
      </div>

      <section className="video-section" id="video"><div className="wrap"><div className="section-head light"><div><span>KOZA TV</span><h2>İzle</h2></div><a href="/videolar">Tüm Videolar →</a></div><div className="video-grid">{videoLead ? <a className="video-main" href={`/haber/${videoLead.slug}`}><img src={videoLead.heroImage} alt={videoLead.imageAlt} /><i aria-hidden="true">▶</i><div><span>{videoLead.category.toLocaleUpperCase("tr-TR")}</span><h3>{videoLead.title}</h3></div></a> : <a className="video-main" href="/canli"><img src="/news/studio.jpg" alt="Koza TV stüdyosu" /><i aria-hidden="true">▶</i><div><span>CANLI</span><h3>Koza TV canlı yayınını izleyin</h3></div></a>}<div className="video-list">{(videos.length > 1 ? videos.slice(1, 4) : news.slice(0, 3)).map((article) => <a href={`/haber/${article.slug}`} key={article.id}><div><img src={article.heroImage} alt={article.imageAlt} /><i>▶</i></div><p><span>{article.category}</span>{article.title}</p></a>)}</div></div></div></section>

      <SiteFooter categories={categories} />
    </main>
  );
}
