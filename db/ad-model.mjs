/* Reklam envanterinin sabit konum sözleşmesi. Konum kodları değişmez; kreatifler,
   tarihler ve kampanya bilgileri yönetim panelinden değiştirilebilir. */

export const adPlacements = [
  { key: "site_top", label: "Site üstü lider alan", scope: "Tüm ziyaretçi sayfaları", format: "970×90 · mobil 320×100", shape: "leaderboard" },
  { key: "home_billboard", label: "Ana sayfa marka panosu", scope: "Ana sayfa · manşet sonrası", format: "970×250 · responsive", shape: "billboard" },
  { key: "section_inline", label: "Bölüm içi reklam", scope: "Kategori ve Son Dakika akışı", format: "728×90 · mobil 320×100", shape: "inline" },
  { key: "article_sidebar", label: "Haber sağ sütun", scope: "Haber detay sayfası", format: "300×250", shape: "rectangle" },
];

export const adThemes = ["red", "dark", "light"];
export const adKinds = ["house", "direct", "programmatic"];

export const houseAdSeeds = [
  {
    placement: "site_top", advertiser: "Koza TV", campaignName: "Şimdi Konuşma Zamanı", title: "Gündemin nabzı Koza TV’de",
    description: "Son dakika, canlı yayın ve güçlü yorum tek ekranda.", imageUrl: "/koza-logo.png", targetUrl: "/canli", ctaLabel: "Canlı yayını izle", theme: "dark", kind: "house", priority: 100,
  },
  {
    placement: "home_billboard", advertiser: "Koza TV", campaignName: "Koza TV Dijital", title: "Haberin merkezinde, hayatın içinde",
    description: "Türkiye ve dünyadan doğrulanmış gelişmeleri Koza TV’nin dijital yayınlarında takip edin.", imageUrl: "/koza-logo.png", targetUrl: "/kurumsal/hakkimizda", ctaLabel: "Koza TV’yi keşfet", theme: "red", kind: "house", priority: 100,
  },
  {
    placement: "section_inline", advertiser: "Koza TV", campaignName: "Koza TV Haber Merkezi", title: "Doğru haber. Şimdi konuşma zamanı.",
    description: "Günün gelişmeleri, özel yayınlar ve kesintisiz canlı akış Koza TV’de.", imageUrl: "/koza-logo.png", targetUrl: "/son-dakika", ctaLabel: "Gelişmeleri takip et", theme: "light", kind: "house", priority: 100,
  },
  {
    placement: "article_sidebar", advertiser: "Koza TV", campaignName: "Koza TV Canlı", title: "Yayın her an yanınızda",
    description: "Koza TV canlı yayınını web’den kesintisiz izleyin.", imageUrl: "/koza-logo.png", targetUrl: "/canli", ctaLabel: "Şimdi izle", theme: "dark", kind: "house", priority: 100,
  },
];

export function adPlacement(key) {
  return adPlacements.find((placement) => placement.key === key) ?? null;
}

function cleanText(value) {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

function safeResourceUrl(value, allowInternal = true) {
  const input = String(value ?? "").trim();
  if (!input) return "";
  const hasUnsafeCharacter = [...input].some((character) => {
    const code = character.charCodeAt(0);
    return code <= 31 || code === 127 || /\s/.test(character);
  });
  if (hasUnsafeCharacter || input.includes("\\")) return "";
  if (allowInternal && input.startsWith("/") && input.length <= 600) {
    try {
      const resolved = new URL(input, "https://www.kozatv.com.tr");
      if (resolved.origin === "https://www.kozatv.com.tr") return input;
    } catch { /* Harici URL doğrulamasına devam et. */ }
  }
  try {
    const url = new URL(input);
    return url.protocol === "https:" && !url.username && !url.password && input.length <= 600 ? input : "";
  } catch {
    return "";
  }
}

function optionalDate(value) {
  if (value === null || value === undefined || value === "") return null;
  const text = String(value).trim();
  const numeric = typeof value === "number"
    ? value
    : /^\d+$/.test(text)
      ? Number(text)
      : /(?:Z|[+-]\d{2}:\d{2})$/i.test(text)
        ? Date.parse(text)
        : NaN;
  return Number.isFinite(numeric) && numeric > 0 ? Math.round(numeric) : NaN;
}

export function validateAdvertisement(payload) {
  const input = payload && typeof payload === "object" ? payload : {};
  const errors = {};
  const idNumber = Number(input.id);
  const id = Number.isSafeInteger(idNumber) && idNumber > 0 ? idNumber : undefined;
  const placement = cleanText(input.placement);
  const advertiser = cleanText(input.advertiser);
  const campaignName = cleanText(input.campaignName);
  const title = cleanText(input.title);
  const description = cleanText(input.description);
  const imageInput = String(input.imageUrl ?? "").trim();
  const targetInput = String(input.targetUrl ?? "").trim();
  const imageUrl = safeResourceUrl(imageInput);
  const targetUrl = safeResourceUrl(targetInput);
  const ctaLabel = cleanText(input.ctaLabel);
  const themeInput = input.theme == null || input.theme === "" ? "dark" : cleanText(input.theme);
  const kindInput = input.kind == null || input.kind === "" ? "direct" : cleanText(input.kind);
  const theme = adThemes.includes(themeInput) ? themeInput : "dark";
  const kind = adKinds.includes(kindInput) ? kindInput : "direct";
  const priorityInput = input.priority == null || input.priority === "" ? 100 : Number(input.priority);
  const priority = Number.isInteger(priorityInput) && priorityInput >= 1 && priorityInput <= 999 ? priorityInput : 100;
  const activeValues = new Map([[true, 1], [false, 0], [1, 1], [0, 0], ["1", 1], ["0", 0]]);
  const active = input.active == null ? 1 : (activeValues.get(input.active) ?? 1);
  const startsAt = optionalDate(input.startsAt);
  const endsAt = optionalDate(input.endsAt);

  if (!adPlacement(placement)) errors.placement = "Geçerli bir reklam konumu seçin.";
  if (input.id != null && id === undefined) errors.id = "Geçerli bir reklam kaydı seçin.";
  if (advertiser.length < 2) errors.advertiser = "Reklamveren adı en az 2 karakter olmalıdır.";
  if (advertiser.length > 100) errors.advertiser = "Reklamveren adı en fazla 100 karakter olabilir.";
  if (campaignName.length > 120) errors.campaignName = "Kampanya adı en fazla 120 karakter olabilir.";
  if (title.length < 3) errors.title = "Reklam başlığı en az 3 karakter olmalıdır.";
  if (title.length > 110) errors.title = "Reklam başlığı en fazla 110 karakter olabilir.";
  if (description.length > 260) errors.description = "Açıklama en fazla 260 karakter olabilir.";
  if (ctaLabel.length > 30) errors.ctaLabel = "Buton metni en fazla 30 karakter olabilir.";
  if (imageInput && !imageUrl) errors.imageUrl = "Görsel adresi site içi bir yol veya güvenli https bağlantısı olmalıdır.";
  if (targetInput && !targetUrl) errors.targetUrl = "Hedef adres site içi bir yol veya güvenli https bağlantısı olmalıdır.";
  if (ctaLabel && !targetUrl) errors.targetUrl = "Buton metni kullanıyorsanız bir hedef bağlantı da girmelisiniz.";
  if (!adThemes.includes(themeInput)) errors.theme = "Geçerli bir görsel tema seçin.";
  if (!adKinds.includes(kindInput)) errors.kind = "Geçerli bir yayın türü seçin.";
  if (kindInput === "programmatic") errors.kind = "Reklam ağı entegrasyonu henüz bağlı değil. Şimdilik doğrudan reklam veya Koza TV tanıtımı seçin.";
  if (!Number.isInteger(priorityInput) || priorityInput < 1 || priorityInput > 999) errors.priority = "Gösterim önceliği 1 ile 999 arasında tam sayı olmalıdır.";
  if (input.active != null && !activeValues.has(input.active)) errors.active = "Reklam durumu açık veya kapalı olmalıdır.";
  if (Number.isNaN(startsAt)) errors.startsAt = "Başlangıç tarihi okunamadı.";
  if (Number.isNaN(endsAt)) errors.endsAt = "Bitiş tarihi okunamadı.";
  if (Number.isFinite(startsAt) && Number.isFinite(endsAt) && startsAt >= endsAt) errors.endsAt = "Bitiş tarihi başlangıçtan sonra olmalıdır.";

  return {
    value: { id, placement, advertiser, campaignName, title, description, imageUrl, targetUrl, ctaLabel, theme, kind, priority, active, startsAt, endsAt },
    errors,
    valid: Object.keys(errors).length === 0,
  };
}

export function advertisementState(advertisement, now = Date.now()) {
  if (!advertisement.active) return "paused";
  if (advertisement.startsAt && advertisement.startsAt > now) return "scheduled";
  if (advertisement.endsAt && advertisement.endsAt <= now) return "expired";
  return "live";
}
