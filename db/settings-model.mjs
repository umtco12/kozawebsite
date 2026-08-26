/* Site ayarlarının tek kaynağı. Alan tanımı, doğrulama ve varsayılanlar burada durur;
   yönetim paneli formu da ziyaretçi sitesi de aynı tanımı kullanır. */

export const settingGroups = [
  { id: "yayin", label: "Yayın ve canlı akış", description: "Canlı yayın kaynağı, yedek kaynak ve yayın bilgileri." },
  { id: "sosyal", label: "Sosyal medya hesapları", description: "Boş bırakılan hesap sitede bağlantı olarak gösterilmez." },
  { id: "kunye", label: "Künye ve iletişim", description: "Künye, iletişim ve KVKK sayfalarında yayımlanan resmî bilgiler." },
];

export const officialSocialAccounts = {
  socialFacebook: "https://www.facebook.com/kozatv/",
  socialX: "https://x.com/kozatv01",
  socialYoutube: "https://www.youtube.com/@KozaTv",
  socialInstagram: "https://www.instagram.com/kozatelevizyon/",
};

export const settingFields = [
  { key: "siteMotto", group: "yayin", type: "text", label: "Site mottosu", hint: "Koza TV logosunun yanında, sitenin üst bölümünde gösterilir.", placeholder: "Şimdi konuşma zamanı", minLength: 3, maxLength: 80, required: true, default: "Şimdi konuşma zamanı" },
  { key: "liveHlsUrl", group: "yayin", type: "url", label: "Canlı yayın kaynağı", hint: "YouTube canlı yayın bağlantısı veya HLS (.m3u8) adresi. YouTube kanal adresi verilirse o kanalın o anda açık olan yayını gösterilir. Boş bırakılırsa kesinti ekranı çıkar.", placeholder: "https://www.youtube.com/watch?v=... veya https://yayin.example.com/koza.m3u8", default: "" },
  { key: "liveBackupUrl", group: "yayin", type: "url", label: "Yedek yayın kaynağı", hint: "Ana kaynak açılmazsa izleyiciye bu adres sunulur. YouTube veya HLS olabilir.", placeholder: "https://www.youtube.com/watch?v=… veya https://yedek.example.com/koza.m3u8", default: "" },
  { key: "satelliteInfo", group: "yayin", type: "text", label: "Uydu bilgisi", maxLength: 120, default: "Türksat 3A • 12685 V" },
  { key: "platformInfo", group: "yayin", type: "text", label: "Platform bilgisi", maxLength: 120, default: "Digitürk 614 • D-Smart 108" },
  { key: "showMarketTicker", group: "yayin", type: "bool", label: "Üst bantta döviz ve hava durumu göster", hint: "Veri alınamazsa gösterge kendiliğinden gizlenir; sabit değer gösterilmez.", default: "1" },

  { key: "socialFacebook", group: "sosyal", type: "url", label: "Facebook", placeholder: officialSocialAccounts.socialFacebook, default: officialSocialAccounts.socialFacebook },
  { key: "socialX", group: "sosyal", type: "url", label: "X (Twitter)", placeholder: officialSocialAccounts.socialX, default: officialSocialAccounts.socialX },
  { key: "socialYoutube", group: "sosyal", type: "url", label: "YouTube", placeholder: officialSocialAccounts.socialYoutube, default: officialSocialAccounts.socialYoutube },
  { key: "socialInstagram", group: "sosyal", type: "url", label: "Instagram", placeholder: officialSocialAccounts.socialInstagram, default: officialSocialAccounts.socialInstagram },

  { key: "legalName", group: "kunye", type: "text", label: "Ticari unvan", maxLength: 200, default: "" },
  { key: "responsibleManager", group: "kunye", type: "text", label: "Sorumlu müdür", maxLength: 120, default: "" },
  { key: "newsDirector", group: "kunye", type: "text", label: "Haber koordinatörü", maxLength: 120, default: "" },
  { key: "address", group: "kunye", type: "textarea", label: "Yayın merkezi adresi", maxLength: 300, default: "" },
  { key: "phone", group: "kunye", type: "text", label: "Telefon", maxLength: 40, default: "" },
  { key: "newsEmail", group: "kunye", type: "email", label: "Haber merkezi e-postası", placeholder: "haber@kozatv.com.tr", default: "" },
  { key: "adsEmail", group: "kunye", type: "email", label: "Reklam e-postası", placeholder: "reklam@kozatv.com.tr", default: "" },
  { key: "contactEmail", group: "kunye", type: "email", label: "Kurumsal iletişim e-postası", placeholder: "iletisim@kozatv.com.tr", default: "" },
];

export const scheduleDefault = [
  { time: "07:00", title: "Koza TV Günaydın", host: "Sabah Yayın Ekibi" },
  { time: "10:00", title: "Gündem Özel", host: "Haber Merkezi" },
  { time: "12:30", title: "Öğle Bülteni", host: "Koza TV Haber" },
  { time: "16:00", title: "Piyasa Saati", host: "Ekonomi Servisi" },
  { time: "19:00", title: "Ana Haber Bülteni", host: "Koza TV Haber Merkezi" },
  { time: "21:00", title: "Konuşma Zamanı", host: "Stüdyo Yayını" },
];

export function defaultSettings() {
  const values = {};
  for (const field of settingFields) values[field.key] = field.default;
  values.broadcastSchedule = JSON.stringify(scheduleDefault);
  return values;
}

function isSafeUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

/* Yayın akışı satırları: HH:MM saat, program adı ve sunucu/servis. */
export function normalizeSchedule(input) {
  const rows = Array.isArray(input) ? input : [];
  const cleaned = [];
  for (const row of rows.slice(0, 24)) {
    const time = String(row?.time ?? "").trim();
    const title = String(row?.title ?? "").trim().slice(0, 120);
    const host = String(row?.host ?? "").trim().slice(0, 120);
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time) || title.length < 2) continue;
    cleaned.push({ time, title, host });
  }
  cleaned.sort((left, right) => left.time.localeCompare(right.time));
  return cleaned;
}

/* Gelen yükü alan tanımına göre doğrular. Yalnızca gönderilen alanlar değerlendirilir. */
export function validateSettings(payload) {
  const values = {};
  const errors = {};
  const input = payload && typeof payload === "object" ? payload : {};

  for (const field of settingFields) {
    if (!(field.key in input)) continue;
    const raw = input[field.key];

    if (field.type === "bool") {
      values[field.key] = raw === true || raw === 1 || raw === "1" ? "1" : "0";
      continue;
    }

    const value = String(raw ?? "").trim();
    if (!value) {
      if (field.required) errors[field.key] = `${field.label} boş bırakılamaz.`;
      else values[field.key] = "";
      continue;
    }

    if (field.type === "url") {
      if (!isSafeUrl(value)) { errors[field.key] = "Adres http veya https ile başlayan geçerli bir bağlantı olmalıdır."; continue; }
      if (value.length > 500) { errors[field.key] = "Adres en fazla 500 karakter olabilir."; continue; }
      /* Canlı yayın alanları yalnızca oynatılabilir kaynak kabul eder. */
      if (field.key === "liveHlsUrl" || field.key === "liveBackupUrl") {
        const source = parseLiveSource(value);
        if (source.kind === "invalid") { errors[field.key] = source.reason; continue; }
      }
      values[field.key] = value;
      continue;
    }

    if (field.type === "email") {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || value.length > 160) { errors[field.key] = "Geçerli bir e-posta adresi girin."; continue; }
      values[field.key] = value.toLowerCase();
      continue;
    }

    const limit = field.maxLength ?? 200;
    const minimum = field.minLength ?? 0;
    if (value.length < minimum) { errors[field.key] = `En az ${minimum} karakter girilmelidir.`; continue; }
    if (value.length > limit) { errors[field.key] = `En fazla ${limit} karakter girilebilir.`; continue; }
    values[field.key] = value;
  }

  if ("broadcastSchedule" in input) {
    const schedule = normalizeSchedule(input.broadcastSchedule);
    if (!schedule.length) errors.broadcastSchedule = "En az bir geçerli yayın satırı gerekir (saat HH:MM ve program adı).";
    else values.broadcastSchedule = JSON.stringify(schedule);
  }

  return { values, errors, valid: Object.keys(errors).length === 0 };
}

/* Yönlendirme kaydı: eski adresten yeni adrese kalıcı/geçici eşleme. */
export function validateRedirect(payload) {
  const errors = {};
  const input = payload && typeof payload === "object" ? payload : {};
  const fromPath = normalizePath(input.fromPath);
  const toPath = normalizePath(input.toPath);
  const kind = input.kind === "temporary" ? "temporary" : "permanent";
  const note = String(input.note ?? "").trim().slice(0, 200);

  if (!fromPath) errors.fromPath = "Eski adres site kökünden başlayan bir yol olmalıdır (örn. /haber/eski-adres).";
  if (!toPath) errors.toPath = "Yeni adres site kökünden başlayan bir yol olmalıdır (örn. /haber/yeni-adres).";
  if (fromPath && toPath && fromPath === toPath) errors.toPath = "Yeni adres eski adresle aynı olamaz.";
  if (fromPath === "/") errors.fromPath = "Ana sayfa yönlendirilemez.";
  if (fromPath && /^\/(admin|api|_next|media)(\/|$)/.test(fromPath)) errors.fromPath = "Yönetim, API ve medya yolları yönlendirilemez.";

  return { value: { fromPath, toPath, kind, note }, errors, valid: Object.keys(errors).length === 0 };
}

/* Tam URL, sorgu veya sondaki eğik çizgi verilse de karşılaştırılabilir tek biçime indirir. */
export function normalizePath(input) {
  let value = String(input ?? "").trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) {
    try { value = new URL(value).pathname; } catch { return ""; }
  }
  if (!value.startsWith("/")) value = `/${value}`;
  value = value.split("#")[0].split("?")[0];
  value = value.replace(/\/{2,}/g, "/");
  if (value.length > 1) value = value.replace(/\/+$/, "");
  if (value.length > 400) return "";
  return decodeURI(value).toLowerCase();
}

/* Yapıştırılan envanter metnini satır satır eşlemeye çevirir: "eski, yeni" veya "eski yeni". */
export function parseRedirectInventory(text) {
  const rows = [];
  const invalid = [];
  for (const line of String(text ?? "").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const parts = trimmed.split(/[,;\t]|\s{1,}/).map((part) => part.trim()).filter(Boolean);
    /* Her iki parça da yol ya da tam adres görünmeli; aksi halde satır serbest metindir ve
       boşluktan bölünüp yanlışlıkla eşleme olarak kaydedilmemelidir. */
    const looksLikeAddress = (part) => part.startsWith("/") || /^https?:\/\//i.test(part);
    if (parts.length < 2 || !looksLikeAddress(parts[0]) || !looksLikeAddress(parts[1])) { invalid.push(trimmed.slice(0, 120)); continue; }
    const candidate = validateRedirect({ fromPath: parts[0], toPath: parts[1], kind: parts[2] === "temporary" ? "temporary" : "permanent" });
    if (!candidate.valid) { invalid.push(trimmed.slice(0, 120)); continue; }
    rows.push(candidate.value);
  }
  const seen = new Set();
  const unique = rows.filter((row) => (seen.has(row.fromPath) ? false : seen.add(row.fromPath)));
  return { rows: unique, invalid, duplicates: rows.length - unique.length };
}

/* Canlı yayın kaynağı: YouTube bağlantısı da HLS adresi de kabul edilir. Yayın sağlayıcısı
   değiştiğinde kod değişmez; yönetici panelden adresi günceller.

   Desteklenen YouTube biçimleri:
   - youtube.com/watch?v=VIDEO      → o yayını gösterir
   - youtu.be/VIDEO, youtube.com/embed/VIDEO, youtube.com/live/VIDEO
   - youtube.com/channel/UC…        → kanalın o an açık olan yayınını gösterir (kesintide yayın
                                       kimliği değişse bile adres güncellemek gerekmez)
   Kullanıcı adı biçimi (youtube.com/@KozaTv) gömülemez; YouTube bunun için kanal kimliği ister. */
export function parseLiveSource(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return { kind: "none" };

  let url;
  try { url = new URL(raw); } catch { return { kind: "invalid", reason: "Adres okunamadı." }; }
  if (url.protocol !== "https:" && url.protocol !== "http:") return { kind: "invalid", reason: "Adres http veya https olmalıdır." };

  const host = url.host.toLowerCase().replace(/^www\./, "");
  const youtubeHosts = ["youtube.com", "m.youtube.com", "youtube-nocookie.com", "youtu.be"];
  if (youtubeHosts.includes(host)) {
    const segments = url.pathname.split("/").filter(Boolean);
    const videoId = host === "youtu.be"
      ? segments[0]
      : url.searchParams.get("v") ?? (["embed", "live", "v", "shorts"].includes(segments[0]) ? segments[1] : "");
    if (videoId && /^[A-Za-z0-9_-]{6,20}$/.test(videoId)) {
      return { kind: "youtube", embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1` };
    }
    const channelId = segments[0] === "channel" ? segments[1] : /^UC[A-Za-z0-9_-]{20,26}$/.test(segments[0] ?? "") ? segments[0] : "";
    if (channelId && /^UC[A-Za-z0-9_-]{20,26}$/.test(channelId)) {
      return { kind: "youtube", embedUrl: `https://www.youtube-nocookie.com/embed/live_stream?channel=${channelId}&rel=0` };
    }
    if (segments[0]?.startsWith("@")) {
      return { kind: "invalid", reason: "YouTube kullanıcı adı gömülemez. Yayın bağlantısını (watch?v=…) veya kanal kimliğini (youtube.com/channel/UC…) kullanın." };
    }
    return { kind: "invalid", reason: "YouTube bağlantısında yayın kimliği bulunamadı." };
  }

  if (/\.m3u8($|\?)/i.test(url.pathname + url.search)) return { kind: "hls", src: raw };
  return { kind: "invalid", reason: "Kaynak YouTube bağlantısı veya .m3u8 uzantılı HLS adresi olmalıdır." };
}
