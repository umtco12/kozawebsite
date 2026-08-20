import Link from "next/link";
import { LiveData, LeadSlider, MobileMenu } from "./site-client";

const leads = [
  { category: "Gündem", title: "Türkiye'nin gündemi Koza TV'de: Günün öne çıkan gelişmeleri", summary: "Ankara'dan dünyaya, günün tüm gelişmeleri doğrulanmış bilgi ve güçlü analizlerle Koza TV'de.", image: "/news/gundem.jpg" },
  { category: "Siyaset", title: "Siyasetin nabzı: Kritik görüşmenin tüm ayrıntıları", summary: "Karar merkezlerindeki son gelişmeler, kulisler ve uzman değerlendirmeleri anbean aktarılıyor.", image: "/news/politika.jpg" },
  { category: "Dünya", title: "Dünyadan sıcak gelişme: Liderler olağanüstü toplandı", summary: "Diplomasi trafiğinin perde arkası ve bölgesel etkileri Koza TV muhabirlerinin anlatımıyla.", image: "/news/dunya.jpg" },
];

const news = [
  ["Ekonomi", "Piyasaların gözü yeni kararda: Uzmanlar ne bekliyor?", "/news/ekonomi.jpg"],
  ["Dünya", "Diplomasi trafiği hızlandı: Kritik zirve başladı", "/news/dunya.jpg"],
  ["Gündem", "Yeni düzenlemenin ayrıntıları belli oldu", "/news/gundem.jpg"],
  ["Spor", "Şampiyonluk yarışında haftanın programı açıklandı", "/news/studio.jpg"],
];

const writers = [
  ["Mehmet Ali Güller", "Yeni dünyanın güç dengeleri"],
  ["Esmehan Güneri", "Ekonomide haftanın kritik başlıkları"],
  ["Kemal Deniz", "Siyasette yeni dönemin işaretleri"],
  ["Enes Arınç", "Sahanın içinden: Futbolun değişen yüzü"],
];

export default function Home() {
  return (
    <main>
      <div className="topbar"><div className="wrap topbar-inner"><span>20 Ağustos 2026, Perşembe</span><LiveData /><div className="social">f&nbsp;&nbsp;𝕏&nbsp;&nbsp;▶&nbsp;&nbsp;◎</div></div></div>
      <header>
        <div className="wrap masthead">
          <Link className="brand" href="/"><img src="/koza-logo.png" alt="Koza TV — Konuşma Zamanı" /></Link>
          <div className="ad-space"><span>REKLAM</span><strong>970 × 90</strong></div>
          <Link className="live-button" href="/canli"><i /> CANLI YAYIN</Link>
          <MobileMenu />
        </div>
        <nav className="nav"><div className="wrap nav-inner"><Link href="/">Ana Sayfa</Link><Link href="#sondakika">Son Dakika</Link><Link href="#gundem">Gündem</Link><Link href="#siyaset">Siyaset</Link><Link href="#ekonomi">Ekonomi</Link><Link href="#spor">Spor</Link><Link href="#dunya">Dünya</Link><Link href="#kultur">Kültür-Sanat</Link><Link href="#magazin">Magazin</Link><Link href="#video">Video</Link><Link href="/yazarlar">Yazarlar</Link><button aria-label="Ara">⌕</button></div></nav>
      </header>

      <section className="breaking" id="sondakika"><div className="wrap breaking-inner"><strong>SON DAKİKA</strong><span>•</span><p>Ekonomiye ilişkin yeni düzenleme Resmî Gazete'de yayımlandı</p><time>14:32</time></div></section>

      <div className="wrap content">
        <section className="hero-grid">
          <LeadSlider items={leads} />
          <div className="side-news">
            {news.slice(0,2).map(([cat,title,img]) => <article className="side-card" key={title}><img src={img} alt=""/><div><span>{cat}</span><h2>{title}</h2><time>12 dk önce</time></div></article>)}
          </div>
        </section>

        <section className="writers-strip">
          <div className="section-title vertical"><span>KÖŞE</span><strong>YAZARLARI</strong></div>
          <div className="writer-list">{writers.map(([name,title], i) => <Link href="/yazarlar" className="writer" key={name}><div className={`avatar avatar-${i+1}`}>{name.split(" ").map(x=>x[0]).join("").slice(0,2)}</div><div><strong>{name}</strong><p>{title}</p></div></Link>)}</div>
          <Link href="/yazarlar" className="round-arrow">→</Link>
        </section>

        <section className="main-columns" id="gundem">
          <div>
            <div className="section-head"><div><span>GÜNCEL</span><h2>Gündem</h2></div><Link href="#">Tümünü Gör →</Link></div>
            <div className="news-grid">{news.map(([cat,title,img],i) => <article className={i===0?"news-card featured":"news-card"} key={title}><img src={img} alt=""/><div className="card-body"><span>{cat}</span><h3>{title}</h3><p>Gelişmenin tüm ayrıntıları ve uzmanların ilk değerlendirmeleri Koza TV'de.</p><time>• {12+i*8} dk önce</time></div></article>)}</div>
          </div>
          <aside className="latest"><div className="latest-title"><i/> SON DAKİKA</div>{["Bakanlıktan yeni düzenlemeye ilişkin açıklama","Meclis'te kritik oturum başladı","Piyasalarda günün ilk rakamları","Milli takım kadrosu açıklandı","Meteoroloji'den kuvvetli yağış uyarısı","Dışişleri Bakanı mevkidaşıyla görüştü"].map((t,i)=><Link href="#" key={t}><time>{["14:32","14:18","13:55","13:41","13:20","12:58"][i]}</time><p>{t}</p></Link>)}<button>Daha Fazla Haber</button></aside>
        </section>
      </div>

      <section className="video-section" id="video"><div className="wrap"><div className="section-head light"><div><span>KOZA TV</span><h2>Video</h2></div><Link href="#">Tüm Videolar →</Link></div><div className="video-grid"><article className="video-main"><img src="/news/studio.jpg" alt="Koza TV stüdyosu"/><button aria-label="Videoyu oynat">▶</button><div><span>ÖZEL HABER</span><h3>Günün öne çıkan gelişmeleri Koza TV Ana Haber'de</h3></div></article><div className="video-list">{news.slice(0,3).map(([cat,title,img])=><article key={title}><div><img src={img} alt=""/><i>▶</i></div><p><span>{cat}</span>{title}</p></article>)}</div></div></div></section>

      <footer><div className="wrap footer-grid"><div><Link className="brand footer-brand" href="/"><img src="/koza-logo.png" alt="Koza TV — Konuşma Zamanı" /></Link><p>Türkiye'nin gündemi, güvenilir haber ve güçlü yorumla Koza TV'de.</p></div><div><strong>Kategoriler</strong><a>Gündem</a><a>Siyaset</a><a>Ekonomi</a><a>Spor</a></div><div><strong>Koza TV</strong><a>Hakkımızda</a><a>Künye</a><a>Yayın İlkeleri</a><a>İletişim</a></div><div><strong>Yayın Bilgileri</strong><p>Türksat 3A • 12685 V<br/>Digitürk 614 • D-Smart 108</p></div></div><div className="wrap copyright">© 2026 Koza TV. Tüm hakları saklıdır. <span>KVKK · Gizlilik · Çerez Politikası</span></div></footer>
    </main>
  );
}
