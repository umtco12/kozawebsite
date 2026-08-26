import { getSiteSettings, listCategories } from "../db";
import { LiveData, MobileMenu, SearchBox } from "./site-client";
import { corporateTitles, liveStream, socialLinks } from "./site-config";

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

function SocialCluster() {
  const settings = getSiteSettings();
  const accounts = socialLinks(settings).filter((item) => item.href);
  if (accounts.length === 0) return null;

  return (
    <span className="social" role="group" aria-label="Koza TV sosyal medya hesapları">
      {accounts.map((item) => (
        <a className="social-link" href={item.href} key={item.label} target="_blank" rel="noreferrer" aria-label={`Koza TV ${item.label}`}>
          <SocialIcon label={item.label} />
        </a>
      ))}
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
  const settings = getSiteSettings();
  const broadcast = liveStream(settings);
  const legal = ["kvkk", "gizlilik", "cerez-politikasi"];
  const institutional = ["hakkimizda", "kunye", "yayin-ilkeleri", "iletisim"];

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
          {institutional.map((slug) => <a href={`/kurumsal/${slug}`} key={slug}>{corporateTitles[slug]}</a>)}
          <a href="/canli">Canlı Yayın</a>
        </div>
        <div>
          <strong>Yayın Bilgileri</strong>
          <p>{broadcast.satellite || "Uydu bilgisi tanımlanacak"}<br />{broadcast.platforms}</p>
          <a href="/rss.xml">RSS akışı</a>
        </div>
      </div>
      <div className="wrap copyright">
        © 2026 Koza TV. Tüm hakları saklıdır.
        <span>{legal.map((slug) => <a href={`/kurumsal/${slug}`} key={slug}>{corporateTitles[slug].replace(" Aydınlatma Metni", "").replace(" Politikası", "")}</a>)}</span>
      </div>
    </footer>
  );
}
