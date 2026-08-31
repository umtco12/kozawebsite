import { getSiteSettings, listCategories } from "../db";
import { LiveData, MobileMenu, SearchBox } from "./site-client";
import { corporateTitles, liveStream, socialLinks } from "./site-config";
import { AdSlot } from "./ad-slot";

/* Ziyaretçi sitesinin ortak başlık ve alt bölümü. Bütün sayfalar aynı çalışan menüyü kullanır. */

export type NavCategory = { id: number; name: string; slug: string };

export function navCategories(): NavCategory[] {
  return listCategories(true).map((category) => ({ id: category.id, name: category.name, slug: category.slug }));
}

function istanbulDate() {
  return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", year: "numeric", weekday: "long", timeZone: "Europe/Istanbul" }).format(new Date());
}

function SocialIcon({ label }: { label: string }) {
  if (label === "Facebook") {
    return <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M13.5 22v-8.2h2.75l.41-3.2H13.5V8.55c0-.93.26-1.56 1.61-1.56h1.72V4.13c-.3-.04-1.32-.13-2.51-.13-2.49 0-4.2 1.52-4.2 4.31v2.29H7.3v3.2h2.82V22h3.38Z" /></svg>;
  }
  if (label === "X") {
    return <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M18.9 2H22l-6.77 7.73L23.2 22h-6.24l-4.89-6.39L6.48 22H3.36l7.27-8.31L3 2h6.4l4.42 5.84L18.9 2Zm-1.09 17.84h1.72L8.46 4.05H6.61l11.2 15.79Z" /></svg>;
  }
  if (label === "YouTube") {
    return <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.12C19.55 3.58 12 3.58 12 3.58s-7.55 0-9.4.5A3 3 0 0 0 .5 6.2 31.2 31.2 0 0 0 0 12a31.2 31.2 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.12c1.85.5 9.4.5 9.4.5s7.55 0 9.4-.5a3 3 0 0 0 2.1-2.12A31.2 31.2 0 0 0 24 12a31.2 31.2 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.27 3.6-6.27 3.6Z" /></svg>;
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7.2 2h9.6A5.2 5.2 0 0 1 22 7.2v9.6a5.2 5.2 0 0 1-5.2 5.2H7.2A5.2 5.2 0 0 1 2 16.8V7.2A5.2 5.2 0 0 1 7.2 2Zm-.18 2A3.02 3.02 0 0 0 4 7.02v9.96A3.02 3.02 0 0 0 7.02 20h9.96A3.02 3.02 0 0 0 20 16.98V7.02A3.02 3.02 0 0 0 16.98 4H7.02Zm10.73 1.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" /></svg>;
}

function SocialCluster({ labeled = false }: { labeled?: boolean } = {}) {
  const settings = getSiteSettings();
  const accounts = socialLinks(settings).filter((item) => item.href);
  if (accounts.length === 0) return null;

  return (
    <div className={`social${labeled ? " footer-social" : ""}`} role="group" aria-label="Koza TV sosyal medya hesapları">
      {accounts.map((item) => (
        <a className={`social-link${labeled ? " footer-social-link" : ""}`} href={item.href} key={item.label} target="_blank" rel="noopener noreferrer" aria-label={labeled ? `Koza TV ${item.label} hesabını yeni sekmede aç` : `Koza TV ${item.label}`}>
          <SocialIcon label={item.label} />
          {labeled ? <span>{item.label}</span> : null}
        </a>
      ))}
    </div>
  );
}

function DesktopAdRails() {
  return (
    <div className="desktop-ad-rails" aria-label="Geniş ekran reklam alanları">
      <AdSlot placement="site_left_rail" className="ad-desktop-rail ad-desktop-rail-left" />
      <AdSlot placement="site_right_rail" className="ad-desktop-rail ad-desktop-rail-right" />
    </div>
  );
}

export function SiteHeader({ categories, active = "" }: { categories: NavCategory[]; active?: string }) {
  const settings = getSiteSettings();
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
          <div className="masthead-claim"><span>TÜRKİYE&apos;NİN HABER MERKEZİ</span><strong>{settings.siteMotto}</strong></div>
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
      <div className="site-ad-stage">
        <AdSlot placement="site_top" className="wrap ad-site-top" />
        <DesktopAdRails />
      </div>
    </>
  );
}

export function SiteFooter({ categories }: { categories: NavCategory[] }) {
  const settings = getSiteSettings();
  const broadcast = liveStream(settings);
  const legal = ["kvkk", "gizlilik", "cerez-politikasi"];
  const institutional = ["hakkimizda", "kunye", "yayin-ilkeleri", "iletisim"];
  const year = new Intl.DateTimeFormat("tr-TR", { year: "numeric", timeZone: "Europe/Istanbul" }).format(new Date());

  return (
    <footer id="site-footer" className="site-footer">
      <div className="wrap footer-shell">
        <section className="footer-intro" aria-labelledby="footer-intro-title">
          <div className="footer-intro-copy">
            <span>KOZA TV DİJİTAL</span>
            <h2 id="footer-intro-title">{settings.siteMotto}</h2>
            <p>Gündemin nabzı, son dakika gelişmeleri ve güçlü yorum günün her anında Koza TV&apos;de.</p>
          </div>
          <div className="footer-intro-actions">
            <a className="footer-live-link" href="/canli"><i aria-hidden="true" />Canlı yayını izle <span aria-hidden="true">→</span></a>
            <a className="footer-rss-link" href="/rss.xml">RSS akışı <span aria-hidden="true">↗</span></a>
          </div>
        </section>

        <div className="footer-grid">
          <section className="footer-identity" aria-labelledby="footer-brand-title">
            <h2 id="footer-brand-title" className="visually-hidden">Koza TV</h2>
            <a className="brand footer-brand" href="/" aria-label="Koza TV ana sayfa"><img src="/koza-logo.png" alt="Koza TV" /></a>
            <p>Türkiye&apos;nin gündemi, güvenilir haber ve güçlü yorumla Koza TV&apos;de.</p>
            <SocialCluster labeled />
          </section>

          <nav className="footer-nav" aria-labelledby="footer-categories-title">
            <h2 id="footer-categories-title">Kategoriler</h2>
            <div className="footer-link-list">
              {categories.slice(0, 6).map((category) => <a href={`/kategori/${category.slug}`} key={category.id}>{category.name}</a>)}
              <a href="/son-dakika">Son Dakika</a>
            </div>
          </nav>

          <nav className="footer-nav" aria-labelledby="footer-corporate-title">
            <h2 id="footer-corporate-title">Koza TV</h2>
            <div className="footer-link-list">
              {institutional.map((slug) => <a href={`/kurumsal/${slug}`} key={slug}>{corporateTitles[slug]}</a>)}
              <a href="/canli">Canlı Yayın</a>
            </div>
          </nav>

          <section className="footer-broadcast" aria-labelledby="footer-broadcast-title">
            <div className="footer-broadcast-title"><i aria-hidden="true" /><h2 id="footer-broadcast-title">Yayın Bilgileri</h2></div>
            <dl>
              <div><dt>Uydu</dt><dd>{broadcast.satellite || "Uydu bilgisi tanımlanacak"}</dd></div>
              <div><dt>Platformlar</dt><dd>{broadcast.platforms || "Platform bilgisi tanımlanacak"}</dd></div>
            </dl>
            <a href="/canli">Yayın akışını görüntüle <span aria-hidden="true">→</span></a>
          </section>
        </div>

        <div className="footer-bottom">
          <p>© {year} Koza TV. Tüm hakları saklıdır.</p>
          <nav aria-label="Yasal bağlantılar">
            {legal.map((slug) => <a href={`/kurumsal/${slug}`} key={slug}>{corporateTitles[slug].replace(" Aydınlatma Metni", "").replace(" Politikası", "")}</a>)}
          </nav>
        </div>
      </div>
    </footer>
  );
}
