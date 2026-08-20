export const defaultContent = {
  leads: [
    {
      category: "Gündem",
      title: "Türkiye'nin gündemi Koza TV'de: Günün öne çıkan gelişmeleri",
      summary:
        "Ankara'dan dünyaya, günün tüm gelişmeleri doğrulanmış bilgi ve güçlü analizlerle Koza TV'de.",
      image: "/news/gundem.jpg",
    },
    {
      category: "Siyaset",
      title: "Siyasetin nabzı: Kritik görüşmenin tüm ayrıntıları",
      summary:
        "Karar merkezlerindeki son gelişmeler, kulisler ve uzman değerlendirmeleri anbean aktarılıyor.",
      image: "/news/politika.jpg",
    },
    {
      category: "Dünya",
      title: "Dünyadan sıcak gelişme: Liderler olağanüstü toplandı",
      summary:
        "Diplomasi trafiğinin perde arkası ve bölgesel etkileri Koza TV muhabirlerinin anlatımıyla.",
      image: "/news/dunya.jpg",
    },
  ],
  writers: [
    { name: "Mehmet Ali Güller", title: "Yeni dünyanın güç dengeleri" },
    { name: "Esmehan Güneri", title: "Ekonomide haftanın kritik başlıkları" },
    { name: "Kemal Deniz", title: "Siyasette yeni dönemin işaretleri" },
    { name: "Enes Arınç", title: "Sahanın içinden: Futbolun değişen yüzü" },
  ],
};

export function isContentKey(key) {
  return key === "leads" || key === "writers";
}

export function isValidContentUpdate(payload) {
  return Boolean(
    payload && isContentKey(payload.key) && Array.isArray(payload.value),
  );
}

export function mergeContentRows(rows) {
  const content = structuredClone(defaultContent);

  for (const row of rows) {
    if (!isContentKey(row.key)) continue;

    const value = JSON.parse(row.value);
    if (Array.isArray(value)) content[row.key] = value;
  }

  return content;
}
