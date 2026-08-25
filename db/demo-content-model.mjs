/* İlk prototipte kullanılan haberler üretim içeriği değildir. Bu sabit liste,
   var olan kurulumlarda yalnız bu bilinen kayıtların güvenle temizlenmesini sağlar. */
export const DEMO_ARTICLE_SLUGS = [
  "turkiyenin-gundemi-koza-tv-haber-merkezinde",
  "karar-merkezlerinde-yogun-trafik",
  "piyasalar-yeni-karara-odaklandi",
  "diplomasi-trafigi-hizlandi-kritik-zirve",
  "milli-takim-kadrosu-aciklandi",
  "meteorolojiden-kuvvetli-yagis-uyarisi",
  "editor-kontrolunde-yapay-zeka-haber-masasi",
];

export function shouldSeedDemoContent(value) {
  return value === "1";
}
