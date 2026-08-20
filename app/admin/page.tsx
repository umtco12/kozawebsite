import Link from "next/link";
import { AdminPanel } from "./panel";

export const dynamic = "force-dynamic";

const adminSections = [
  "▦ Genel Bakış",
  "▤ Haberler",
  "▣ Manşet Slider",
  "✎ Köşe Yazıları",
  "▶ Videolar",
  "▦ Yayın Akışı",
  "⌁ Reklamlar",
  "⚙ Ayarlar",
];

export default function Admin() {
  return (
    <main className="admin-shell">
      <aside className="admin-side">
        <Link className="admin-logo" href="/">
          <img src="/koza-logo.png" alt="Koza TV" />
        </Link>
        <nav aria-label="Yönetim bölümleri">
          {adminSections.map((section, index) => (
            <button
              className={index === 0 ? "active" : undefined}
              type="button"
              key={section}
            >
              {section}
            </button>
          ))}
        </nav>
        <Link href="/">← Siteye dön</Link>
      </aside>
      <section className="admin-main">
        <header>
          <div>
            <span>YÖNETİM PANELİ</span>
            <h1>İçerik Merkezi</h1>
          </div>
          <div className="admin-user">
            KD
            <span>
              Kemal Deniz
              <br />
              <small>Yayın Yönetmeni</small>
            </span>
          </div>
        </header>
        <AdminPanel />
      </section>
    </main>
  );
}
