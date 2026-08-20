import Link from "next/link";

const writers = [
  ["Mehmet Ali Güller", "Yeni dünyanın güç dengeleri"],
  ["Esmehan Güneri", "Ekonomide haftanın kritik başlıkları"],
  ["Kemal Deniz", "Siyasette yeni dönemin işaretleri"],
  ["Enes Arınç", "Sahanın içinden: Futbolun değişen yüzü"],
  ["Gülşah İnce", "Toplum ve değişen yaşam"],
  ["E. Kaptanoğlu", "Dünyanın işi"],
];

export default function Writers() {
  return (
    <main className="subpage">
      <div className="subpage-inner">
        <Link className="back" href="/">
          ← KOZA TV ANA SAYFA
        </Link>
        <h1>Köşe Yazarları</h1>
        <div className="author-grid">
          {writers.map(([name, title]) => (
            <article className="author-card" key={name}>
              <div className="avatar">
                {name
                  .split(" ")
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2)}
              </div>
              <div>
                <h2>{name}</h2>
                <p>{title}</p>
                <span className="back">Yazıyı oku →</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
