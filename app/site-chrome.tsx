import { listCategories } from "../db";
import { LiveData, MobileMenu, SearchBox } from "./site-client";
import { corporatePages, liveStream, socialLinks } from "./site-config";

/* Ziyaretçi sitesinin ortak başlık ve alt bölümü. Bütün sayfalar aynı çalışan menüyü kullanır. */

export type NavCategory = { id: number; name: string; slug: string };

export function navCategories(): NavCategory[] {
  return listCategories(true).map((category) => ({ id: category.id, name: category.name, slug: category.slug }));
}

function istanbulDate() {
  return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", year: "numeric", weekday: "long", timeZone: "Europe/Istanbul" }).format(new Date());
}

function SocialCluster() {
  return (
    <span className="social">
      {socialLinks.map((item) =>
        item.href
          ? <a href={item.href} key={item.label} target="_blank" rel="noreferrer" aria-label={`Koza TV ${item.label}`}>{item.short}</a>
          : <span key={item.label} aria-hidden="true">{item.short}</span>,
      )}
    </span>
  );
}

export function SiteHeader({ categories, active = "" }: { categories: NavCategory[]; active?: string }) {
  return (
    <>
      <div className="topbar">
        <div className="wrap topbar-inner">
          <span>{istanbulDate()}</span>
          <LiveData />
          <div className="top-links">
            <a href="/yazarlar">Yazarlar</a>
            <a href="/canli">Yayın Akışı</a>
            <SocialCluster />
          </div>
        </div>
      </div>

      <header className="site-header">
        <div className="wrap masthead">
          <a className="brand" href="/" aria-label="Koza TV ana sayfa"><img src="/koza-logo.png" alt="Koza TV — Konuşma Zamanı" /></a>
          <div className="masthead-claim"><span>TÜRKİYE&apos;NİN HABER MERKEZİ</span><strong>Doğru haber. Güçlü yorum.</strong></div>
          <div className="ad-space"><span>REKLAM</span><strong>970 × 90</strong></div>
          <a className="live-button" href="/canli"><i /> CANLI YAYIN</a>
          <MobileMenu categories={categories.map(({ name, slug }) => ({ name, slug }))} />
        </div>
        <nav className="nav" aria-label="Ana menü">
          <div className="wrap nav-inner">
            <a href="/" aria-current={active === "home" ? "page" : undefined}>Ana Sayfa</a>
            <a href="/son-dakika" aria-current={active === "son-dakika" ? "page" : undefined}>Son Dakika</a>
            {categories.map((category) => (
              <a href={`/kategori/${category.slug}`} key={category.id} aria-current={active === `kategori/${category.slug}` ? "page" : undefined}>{category.name}</a>
            ))}
            <a href="/videolar" aria-current={active === "videolar" ? "page" : undefined}>Videolar</a>
            <a href="/yazarlar" aria-current={active === "yazarlar" ? "page" : undefined}>Yazarlar</a>
            <SearchBox />
          </div>
        </nav>
      </header>
    </>
  );
}

export function SiteFooter({ categories }: { categories: NavCategory[] }) {
  const legal = corporatePages.filter((page) => ["kvkk", "gizlilik", "cerez-politikasi"].includes(page.slug));
  const institutional = corporatePages.filter((page) => ["hakkimizda", "kunye", "yayin-ilkeleri", "iletisim"].includes(page.slug));

  return (
    <footer>
      <div className="wrap footer-grid">
        <div>
          <a className="brand footer-brand" href="/"><img src="/koza-logo.png" alt="Koza TV — Konuşma Zamanı" /></a>
          <p>Türkiye&apos;nin gündemi, güvenilir haber ve güçlü yorumla Koza TV&apos;de.</p>
          <SocialCluster />
        </div>
        <div>
          <strong>Kategoriler</strong>
          {categories.slice(0, 6).map((category) => <a href={`/kategori/${category.slug}`} key={category.id}>{category.name}</a>)}
          <a href="/son-dakika">Son Dakika</a>
        </div>
        <div>
          <strong>Koza TV</strong>
          {institutional.map((page) => <a href={`/kurumsal/${page.slug}`} key={page.slug}>{page.title}</a>)}
          <a href="/canli">Canlı Yayın</a>
        </div>
        <div>
          <strong>Yayın Bilgileri</strong>
          <p>{liveStream.satellite}<br />{liveStream.platforms}</p>
          <a href="/rss.xml">RSS akışı</a>
        </div>
      </div>
      <div className="wrap copyright">
        © 2026 Koza TV. Tüm hakları saklıdır.
        <span>{legal.map((page) => <a href={`/kurumsal/${page.slug}`} key={page.slug}>{page.title.replace(" Aydınlatma Metni", "").replace(" Politikası", "")}</a>)}</span>
      </div>
    </footer>
  );
}
