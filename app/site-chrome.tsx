import { getBroadcastSchedule, getSiteSettings, listCategories } from "../db";
import { LiveData, MobileMenu, SearchBox } from "./site-client";
import { corporateTitles, liveStream, socialLinks } from "./site-config";
import { AdSlot } from "./ad-slot";
import { BroadcastFlow } from "./broadcast-flow";
import { SocialIcon } from "./social-icon";

/* Ziyaretçi sitesinin ortak başlık ve alt bölümü. Bütün sayfalar aynı çalışan menüyü kullanır. */

export type NavCategory = { id: number; name: string; slug: string };

const primaryNavCategories = (categories: NavCategory[]) => categories.filter((category) => category.slug !== "video");

export function navCategories(): NavCategory[] {
  return primaryNavCategories(
    listCategories(true).map((category) => ({ id: category.id, name: category.name, slug: category.slug })),
  );
}

function istanbulDate() {
  return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", year: "numeric", weekday: "long", timeZone: "Europe/Istanbul" }).format(new Date());
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
  /* Bazı ayrıntı sayfaları görünür kategorileri doğrudan veritabanından gönderebilir.
     Ortak başlık son savunma olarak ana navbar sözleşmesini her rotada aynı tutar. */
  const primaryCategories = primaryNavCategories(categories);
  // eslint-disable-next-line react-hooks/purity -- Sunucu isteğinin saat anlık görüntüsü; istemcinin ilk renderı da aynı değerle başlar.
  const broadcastNow = Date.now();
  return (
    <>
      <div className="topbar">
        <div className="wrap topbar-inner">
          <span>{istanbulDate()}</span>
          <LiveData />
          <div className="top-links">
            <a href="/canli">Yayın Akışı</a>
            <SocialCluster />
          </div>
        </div>
      </div>

      <header className="site-header">
        <div className="wrap masthead">
          {/* Logo görselinin içinde marka mottosu zaten yazılı; başlıkta ikinci kez tekrarlanmaz.
              Canlı yayın düğmesi logonun altında durur; kalan genişliğin tamamı yayın akışına kalır. */}
          <div className="masthead-brand">
            <a className="brand" href="/" aria-label={`Koza TV ana sayfa — ${settings.siteMotto}`}><img src="/koza-logo-temiz.svg" alt="Koza TV — Konuşma Zamanı" width={411} height={164} /></a>
            <a className="live-button" href="/canli"><i /> CANLI YAYIN</a>
          </div>
          <BroadcastFlow schedule={getBroadcastSchedule()} initialNow={broadcastNow} />
          <MobileMenu categories={primaryCategories.map(({ name, slug }) => ({ name, slug }))} />
        </div>
        <nav className="nav" aria-label="Ana menü">
          <div className="wrap nav-inner">
            <div className="nav-links">
            <a href="/" aria-current={active === "home" ? "page" : undefined}>Ana Sayfa</a>
            <a href="/son-dakika" aria-current={active === "son-dakika" ? "page" : undefined}>Son Dakika</a>
            {primaryCategories.map((category) => (
              <a href={`/kategori/${category.slug}`} key={category.id} aria-current={active === `kategori/${category.slug}` ? "page" : undefined}>{category.name}</a>
            ))}
            </div>
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
            <a className="brand footer-brand" href="/" aria-label="Koza TV ana sayfa"><img src="/koza-logo-temiz.svg" alt="Koza TV" width={411} height={164} /></a>
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
