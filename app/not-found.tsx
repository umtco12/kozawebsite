
export const metadata = { title: "Sayfa bulunamadı", robots: { index: false } };

export default function NotFound() {
  return (
    <main className="error-page">
      <div className="wrap">
        <a className="brand" href="/" aria-label="Koza TV ana sayfa"><img src="/koza-logo.png" alt="Koza TV" /></a>
        <span>HATA 404</span>
        <h1>Aradığınız sayfa bulunamadı</h1>
        <p>Sayfa kaldırılmış, adresi değişmiş veya hiç var olmamış olabilir. Aşağıdaki bağlantılardan yayına devam edebilirsiniz.</p>
        <div className="error-links">
          <a href="/">Ana sayfa</a>
          <a href="/son-dakika">Son dakika</a>
          <a href="/videolar">Videolar</a>
          <a href="/yazarlar">Yazarlar</a>
          <a href="/canli">Canlı yayın</a>
          <a href="/arama">Haber ara</a>
          <a href="/kurumsal/iletisim">İletişim</a>
        </div>
      </div>
    </main>
  );
}
