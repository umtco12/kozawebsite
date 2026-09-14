/* Kurumun kendi herkese açık Atom akışı. Haber kaydı oluşturmaz veya videoyu indirmez. */
export const KOZA_YOUTUBE_CHANNEL_ID = "UC4Ohyy56H4EZAy0Pagsv3iA";
export const KOZA_YOUTUBE_VIDEOS_URL = "https://www.youtube.com/@KozaTv/videos";
export const KOZA_YOUTUBE_FEED_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${KOZA_YOUTUBE_CHANNEL_ID}`;
export const YOUTUBE_REFRESH_MS = 10 * 60_000;
export const YOUTUBE_STALE_MS = 24 * 60 * 60_000;
const MAX_FEED_BYTES = 256 * 1024;

function field(xml, name) {
  return new RegExp(`<${name}>([\\s\\S]*?)</${name}>`).exec(xml)?.[1]?.trim() ?? "";
}

function titleText(value) {
  const entities = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
  return value.replace(/^<!\[CDATA\[([\s\S]*)\]\]>$/, "$1")
    .replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (whole, key) => {
      if (!key.startsWith("#")) return entities[key.toLowerCase()] ?? whole;
      const code = key[1].toLowerCase() === "x" ? parseInt(key.slice(2), 16) : Number(key.slice(1));
      return code > 0 && code <= 0x10ffff && !(code >= 0xd800 && code <= 0xdfff) ? String.fromCodePoint(code) : "";
    }).replace(/\s+/g, " ").trim().slice(0, 300);
}

/** @returns {{ id: string, title: string, publishedAt: number, href: string, image: string }[]} */
export function parseYouTubeFeed(xml) {
  if (typeof xml !== "string" || Buffer.byteLength(xml) > MAX_FEED_BYTES || /<!DOCTYPE|<!ENTITY/i.test(xml)
    || !/<feed\b/.test(xml) || !/<\/feed>\s*$/.test(xml)) throw new Error("YouTube akışı geçersiz");
  const header = xml.split("<entry>")[0];
  const channelId = field(header, "yt:channelId");
  // YouTube bazı akışlarda kök kanal kimliğinin UC önekini göndermiyor.
  if (![KOZA_YOUTUBE_CHANNEL_ID, KOZA_YOUTUBE_CHANNEL_ID.slice(2)].includes(channelId)) throw new Error("YouTube kanalı eşleşmiyor");
  const videos = new Map();
  for (const [, entry] of xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)) {
    const id = field(entry, "yt:videoId");
    const title = titleText(field(entry, "title"));
    const publishedAt = Date.parse(field(entry, "published"));
    if (!/^[\w-]{11}$/.test(id) || field(entry, "yt:channelId") !== KOZA_YOUTUBE_CHANNEL_ID || !title || !Number.isFinite(publishedAt)) continue;
    if (videos.has(id) && videos.get(id).publishedAt >= publishedAt) continue;
    // Bağlantılar XML'den alınmaz; doğrulanmış kimlikten sabit YouTube adresleri üretilir.
    videos.set(id, { id, title, publishedAt, href: `https://www.youtube.com/watch?v=${id}`, image: `https://i.ytimg.com/vi/${id}/hqdefault.jpg` });
  }
  if (xml.includes("<entry>") && videos.size === 0) throw new Error("YouTube video kayıtları okunamadı");
  return [...videos.values()].sort((a, b) => b.publishedAt - a.publishedAt || a.id.localeCompare(b.id)).slice(0, 4);
}

async function readFeed(response) {
  if (!response.ok || !response.body || Number(response.headers.get("content-length")) > MAX_FEED_BYTES) throw new Error("YouTube akışı alınamadı");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let bytes = 0;
  let xml = "";
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_FEED_BYTES) throw new Error("YouTube yanıtı çok büyük");
      xml += decoder.decode(value, { stream: true });
    }
    return xml + decoder.decode();
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

/** Sunucu sürecinde tek istek, 10 dakika önbellek; kesintide en çok 24 saatlik son başarılı liste. */
export function createYouTubeFeedLoader({ fetcher = fetch, now = Date.now, timeoutMs = 3000 } = {}) {
  /** @type {ReturnType<typeof parseYouTubeFeed>} */
  let cached = [];
  let fetchedAt = -Infinity;
  let retryAt = 0;
  /** @type {Promise<ReturnType<typeof parseYouTubeFeed>> | undefined} */
  let pending;
  return async function load() {
    const usable = () => now() - fetchedAt < YOUTUBE_STALE_MS ? cached : [];
    if (now() < retryAt) return usable();
    if (pending) return pending;
    pending = (async () => {
      try {
        const response = await fetcher(KOZA_YOUTUBE_FEED_URL, {
          cache: "no-store", redirect: "error", signal: AbortSignal.timeout(timeoutMs),
          headers: { accept: "application/atom+xml, application/xml" },
        });
        cached = parseYouTubeFeed(await readFeed(response));
        fetchedAt = now();
        retryAt = fetchedAt + YOUTUBE_REFRESH_MS;
      } catch {
        retryAt = now() + 60_000;
      }
      return usable();
    })();
    try { return await pending; } finally { pending = undefined; }
  };
}

export const loadKozaYouTubeVideos = createYouTubeFeedLoader();
