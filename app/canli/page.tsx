import type { Metadata } from "next";
import { getBroadcastSchedule, getSiteSettings, listPublishedArticles } from "../../db";
import { SiteFooter, SiteHeader, navCategories } from "../site-chrome";
import { liveStream } from "../site-config";
import { parseLiveSource } from "../../db/settings-model.mjs";
import { selectDailySchedule } from "../../db/broadcast-schedule.mjs";
import type { DailyFlow } from "../broadcast-flow";
import { LivePlayer, type LiveSource } from "./live-player";

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
  const broadcast = liveStream(getSiteSettings());
  /* Sayfa her istekte yeniden üretildiği için akış durumu açılış anına göre hesaplanır. */
  // eslint-disable-next-line react-hooks/purity -- Dinamik sunucu isteğinin saat anlık görüntüsü; istemcide yeniden render edilmez.
  const flow = selectDailySchedule(getBroadcastSchedule(), Date.now()) as DailyFlow;

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
          <LivePlayer source={parseLiveSource(broadcast.hlsUrl) as LiveSource} backup={parseLiveSource(broadcast.backupUrl) as LiveSource} poster={broadcast.posterImage} />
          <div className="live-channels">
            <div><strong>Uydu</strong><span>{broadcast.satellite || "Tanımlanacak"}</span></div>
            <div><strong>Platform</strong><span>{broadcast.platforms || "Tanımlanacak"}</span></div>
            <div><strong>Yayın merkezi</strong><span>Koza TV Haber Merkezi</span></div>
          </div>
        </section>
        <aside className="live-flow" id="yayin-akisi">
          <div className="live-flow-head"><span>{flow.dayLabel || "BUGÜN"}</span><strong>Yayın Akışı</strong></div>
          {flow.items.map((item) => (
            <div className={`live-flow-row live-flow-${item.state}`} key={`${item.days}-${item.time}`}>
              <time dateTime={item.time}>{item.time}<em>–{item.end}</em></time>
              {item.image ? <img src={item.image} alt="" loading="lazy" decoding="async" /> : null}
              <div>
                <strong>{item.title}</strong>
                <small>{item.host || "Koza TV"}</small>
              </div>
              {item.state === "live" ? <b>YAYINDA</b> : null}
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
