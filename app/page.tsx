import Link from "next/link";
import { listPublishedArticles } from "../db";
import { LiveData, LeadSlider, MobileMenu } from "./site-client";

export const dynamic = "force-dynamic";

const writers = [
  ["Mehmet Ali Güller", "Yeni dünyanın güç dengeleri"],
  ["Esmehan Güneri", "Ekonomide haftanın kritik başlıkları"],
  ["Kemal Deniz", "Siyasette yeni dönemin işaretleri"],
  ["Enes Arınç", "Sahanın içinden: Futbolun değişen yüzü"],
];

function articleTime(value: number | null) {
  if (!value) return "Şimdi";
  return new Intl.DateTimeFormat("tr-TR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Istanbul" }).format(value);
}

export default async function Home() {
  const currentDate = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", year: "numeric", weekday: "long", timeZone: "Europe/Istanbul" }).format(new Date());
  const articles = listPublishedArticles(20);
  const featured = articles.filter((article) => article.isFeatured).slice(0, 3);
  const leads = (featured.length >= 3 ? featured : articles.slice(0, 3)).map((article) => ({ category: article.category, title: article.title, summary: article.spot, image: article.heroImage, href: `/haber/${article.slug}` }));
  const latest = articles.slice(0, 6);
  const news = articles.slice(1, 5);
  const breaking = articles.find((article) => article.isBreaking) ?? articles[0];

  return (
    <main>
      <div className="topbar"><div className="wrap topbar-inner"><span>{currentDate}</span><LiveData /><div className="top-links"><Link href="/yazarlar">Yazarlar</Link><Link href="/canli">Yayın Akışı</Link><span className="social">f&nbsp;&nbsp;𝕏&nbsp;&nbsp;▶&nbsp;&nbsp;◎</span></div></div></div>

      <header className="site-header">
        <div className="wrap masthead">
          <Link className="brand" href="/" aria-label="Koza TV ana sayfa"><img src="/koza-logo.png" alt="Koza TV — Konuşma Zamanı" /></Link>
          <div className="masthead-claim"><span>TÜRKİYE&apos;NİN HABER MERKEZİ</span><strong>Doğru haber. Güçlü yorum.</strong></div>
          <div className="ad-space"><span>REKLAM</span><strong>970 × 90</strong></div>
          <Link className="live-button" href="/canli"><i /> CANLI YAYIN</Link><MobileMenu />
        </div>
        <nav className="nav" aria-label="Ana menü"><div className="wrap nav-inner"><Link href="/">Ana Sayfa</Link><Link href="#sondakika">Son Dakika</Link><Link href="#gundem">Gündem</Link><Link href="#siyaset">Siyaset</Link><Link href="#ekonomi">Ekonomi</Link><Link href="#spor">Spor</Link><Link href="#dunya">Dünya</Link><Link href="#kultur">Kültür-Sanat</Link><Link href="#video">Video</Link><Link href="/yazarlar">Yazarlar</Link><button aria-label="Haberlerde ara">⌕</button></div></nav>
      </header>

      <section className="breaking" id="sondakika" aria-label="Son dakika"><div className="wrap breaking-inner"><strong><i /> SON DAKİKA</strong><time>{articleTime(breaking?.publishedAt ?? null)}</time><p>{breaking?.title}</p><Link href={breaking ? `/haber/${breaking.slug}` : "#gundem"}>Habere git <span>→</span></Link></div></section>

      <div className="wrap content">
        <section className="hero-grid" aria-label="Öne çıkan haberler">
          <LeadSlider items={leads} />
          <aside className="hero-flow">
            <div className="hero-flow-head"><span>CANLI</span><strong>Günün Akışı</strong><small>Son güncelleme 14:32</small></div>
            {latest.slice(0, 5).map((article, index) => <Link href={`/haber/${article.slug}`} className={index === 0 ? "flow-item active" : "flow-item"} key={article.id}><time>{articleTime(article.publishedAt)}</time><div><span>{article.isBreaking ? "SON DAKİKA" : article.category.toLocaleUpperCase("tr-TR")}</span><h2>{article.title}</h2></div></Link>)}
            <Link className="flow-more" href="#gundem">Tüm gelişmeleri gör <span>→</span></Link>
          </aside>
        </section>

        <section className="spotlight" aria-label="Öne çıkan başlıklar">
          <div className="spotlight-label"><span>ŞİMDİ</span><strong>Öne Çıkanlar</strong></div>
          {news.slice(0, 3).map((article) => <Link className="spotlight-card" href={`/haber/${article.slug}`} key={article.id}><img src={article.heroImage} alt={article.imageAlt} /><div><span>{article.category}</span><h2>{article.title}</h2><time>{articleTime(article.publishedAt)}</time></div></Link>)}
        </section>

        <section className="writers-strip">
          <div className="section-title vertical"><span>KÖŞE</span><strong>YAZARLARI</strong></div>
          <div className="writer-list">{writers.map(([name, title], index) => <Link href="/yazarlar" className="writer" key={name}><div className={`avatar avatar-${index + 1}`}>{name.split(" ").map((part) => part[0]).join("").slice(0, 2)}</div><div><strong>{name}</strong><p>{title}</p></div></Link>)}</div>
          <Link href="/yazarlar" className="round-arrow" aria-label="Tüm yazarlar">→</Link>
        </section>

        <section className="main-columns" id="gundem">
          <div><div className="section-head"><div><span>GÜNCEL</span><h2>Gündem</h2></div><Link href="#gundem">Tümünü Gör →</Link></div><div className="news-grid">{news.map((article, index) => <Link href={`/haber/${article.slug}`} className={index === 0 ? "news-card featured" : "news-card"} key={article.id}><img src={article.heroImage} alt={article.imageAlt} /><div className="card-body"><span>{article.category}</span><h3>{article.title}</h3><p>{article.spot}</p><time>• {articleTime(article.publishedAt)}</time></div></Link>)}</div></div>
          <aside className="latest"><div className="latest-title"><i /> SON DAKİKA</div>{latest.map((article) => <Link href={`/haber/${article.slug}`} key={article.id}><time>{articleTime(article.publishedAt)}</time><p>{article.title}</p></Link>)}<button>Daha Fazla Haber</button></aside>
        </section>
      </div>

      <section className="video-section" id="video"><div className="wrap"><div className="section-head light"><div><span>KOZA TV</span><h2>İzle</h2></div><Link href="#video">Tüm Videolar →</Link></div><div className="video-grid"><article className="video-main"><img src="/news/studio.jpg" alt="Koza TV stüdyosu" /><button aria-label="Videoyu oynat">▶</button><div><span>ANA HABER</span><h3>Günün öne çıkan gelişmeleri Koza TV Ana Haber&apos;de</h3></div></article><div className="video-list">{news.slice(0, 3).map((article) => <article key={article.id}><div><img src={article.heroImage} alt={article.imageAlt} /><i>▶</i></div><p><span>{article.category}</span>{article.title}</p></article>)}</div></div></div></section>

      <footer><div className="wrap footer-grid"><div><Link className="brand footer-brand" href="/"><img src="/koza-logo.png" alt="Koza TV — Konuşma Zamanı" /></Link><p>Türkiye&apos;nin gündemi, güvenilir haber ve güçlü yorumla Koza TV&apos;de.</p></div><div><strong>Kategoriler</strong><Link href="#gundem">Gündem</Link><Link href="#siyaset">Siyaset</Link><Link href="#ekonomi">Ekonomi</Link><Link href="#spor">Spor</Link></div><div><strong>Koza TV</strong><span>Hakkımızda</span><span>Künye</span><span>Yayın İlkeleri</span><span>İletişim</span></div><div><strong>Yayın Bilgileri</strong><p>Türksat 3A • 12685 V<br />Digitürk 614 • D-Smart 108</p></div></div><div className="wrap copyright">© 2026 Koza TV. Tüm hakları saklıdır. <span>KVKK · Gizlilik · Çerez Politikası</span></div></footer>
    </main>
  );
}
