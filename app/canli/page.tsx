import type { Metadata } from "next";
import { listPublishedArticles } from "../../db";
import { SiteFooter, SiteHeader, navCategories } from "../site-chrome";
import { broadcastSchedule, liveStream } from "../site-config";
import { LivePlayer } from "./live-player";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Canlı Yayın ve Yayın Akışı",
  description: "Koza TV canlı yayını, günün yayın akışı ve uydu/platform frekans bilgileri.",
  alternates: { canonical: "/canli" },
  openGraph: { title: "Koza TV Canlı Yayın", description: "Kesintisiz canlı yayın ve günün yayın akışı.", url: "/canli" },
};

export default async function Live() {
  const categories = navCategories();
  const articles = listPublishedArticles(5);

  return (
    <main className="category-page live-view">
      <SiteHeader categories={categories} />
      <section className="category-hero live-hero">
        <div className="wrap">
          <span><i className="pulse" /> CANLI</span>
          <h1>Koza TV Canlı Yayın</h1>
          <p>Konuşma Zamanı — kesintisiz haber ve program yayını.</p>
        </div>
      </section>

      <div className="wrap live-layout">
        <section>
          <LivePlayer src={liveStream.hlsUrl} poster={liveStream.posterImage} />
          <div className="live-channels">
            <div><strong>Uydu</strong><span>{liveStream.satellite}</span></div>
            <div><strong>Platform</strong><span>{liveStream.platforms}</span></div>
            <div><strong>Yayın merkezi</strong><span>Koza TV Haber Merkezi</span></div>
          </div>
        </section>
        <aside className="live-flow">
          <div className="live-flow-head"><span>BUGÜN</span><strong>Yayın Akışı</strong></div>
          {broadcastSchedule.map((item) => (
            <div className="live-flow-row" key={item.time}>
              <time>{item.time}</time>
              <div><strong>{item.title}</strong><small>{item.host}</small></div>
            </div>
          ))}
        </aside>
      </div>

      <div className="wrap live-news">
        <div className="section-head"><div><span>YAYINDA KONUŞULAN</span><h2>Günün haberleri</h2></div><a href="/son-dakika">Son dakika →</a></div>
        <div className="live-news-list">
          {articles.map((article) => (
            <a href={`/haber/${article.slug}`} key={article.id}>
              <img src={article.heroImage} alt={article.imageAlt} />
              <div><span>{article.category}</span><h3>{article.title}</h3></div>
            </a>
          ))}
        </div>
      </div>
      <SiteFooter categories={categories} />
    </main>
  );
}
