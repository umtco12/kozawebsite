import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { getSiteSettings } from "../../../db";
import { hasCompleteMarketRates, parseMynetMarketPayload, preferCompleteMarketSnapshot } from "./market-model.mjs";

export const dynamic = "force-dynamic";

/* Üst banttaki döviz ve hava durumu göstergesi. Veri sunucu tarafında çekilir, önbelleğe alınır ve
   kaynağı ile tarihi birlikte döner. Kaynak yanıt vermezse uydurma değer üretilmez; gösterge gizlenir. */

type MarketPayload = {
  ok: boolean;
  rates: { code: string; name: string; value: string; change: string; direction: "up" | "down" | "neutral"; asOf: string }[];
  rateSource: string;
  rateDate: string;
  weather: { label: string; value: string } | null;
  fetchedAt: number;
};

const CACHE_MS = 5 * 60 * 1000;
const DEGRADED_CACHE_MS = 30 * 1000;
const SOURCE_TIMEOUT_MS = 5000;
const SHARED_CACHE_VERSION = 1;
let cache: { payload: MarketPayload; expiresAt: number } | undefined;

type SharedMarketCache = {
  version: number;
  rates: MarketPayload["rates"];
  rateSource: string;
  rateDate: string;
  weather: MarketPayload["weather"];
  updatedAt: number;
};

function sharedCachePath() {
  if (process.env.KOZA_MARKET_CACHE_PATH) return process.env.KOZA_MARKET_CACHE_PATH;
  if (process.env.KOZA_MEDIA_PATH) return join(dirname(process.env.KOZA_MEDIA_PATH), "market-cache.json");
  return join(tmpdir(), `koza-market-cache-${process.pid}.json`);
}

function validWeather(value: unknown): value is NonNullable<MarketPayload["weather"]> {
  if (!value || typeof value !== "object") return false;
  const weather = value as { label?: unknown; value?: unknown };
  return typeof weather.label === "string" && weather.label.length <= 40
    && typeof weather.value === "string" && /^-?\d{1,3}°$/.test(weather.value);
}

async function readSharedCache(): Promise<SharedMarketCache | null> {
  try {
    const parsed = JSON.parse(await readFile(sharedCachePath(), "utf8")) as Partial<SharedMarketCache>;
    if (parsed.version !== SHARED_CACHE_VERSION) return null;
    const rates = hasCompleteMarketRates(parsed.rates) ? parsed.rates as MarketPayload["rates"] : [];
    const weather = validWeather(parsed.weather) ? parsed.weather : null;
    if (!rates.length && !weather) return null;
    return {
      version: SHARED_CACHE_VERSION,
      rates,
      rateSource: rates.length && typeof parsed.rateSource === "string" ? parsed.rateSource : "",
      rateDate: rates.length && typeof parsed.rateDate === "string" ? parsed.rateDate : "",
      weather,
      updatedAt: typeof parsed.updatedAt === "number" ? parsed.updatedAt : 0,
    };
  } catch {
    return null;
  }
}

async function writeSharedCache(snapshot: Omit<SharedMarketCache, "version" | "updatedAt">) {
  const path = sharedCachePath();
  const temporaryPath = `${path}.${process.pid}.${Date.now()}.tmp`;
  await mkdir(dirname(path), { recursive: true });
  await writeFile(temporaryPath, JSON.stringify({ version: SHARED_CACHE_VERSION, ...snapshot, updatedAt: Date.now() }), { encoding: "utf8", mode: 0o600 });
  await rename(temporaryPath, path);
}

function formatTurkish(value: number) {
  return value.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/* Mynet'in genel piyasa akışı Koza TV'nin eski üst bandındaki BIST, altın ve serbest piyasa
   değerleriyle aynı veri setini sağlar. Yanıt yalnız sunucuda okunur ve sıkı biçimde doğrulanır. */
async function fetchLiveMarkets() {
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetch("https://finans.mynet.com/api/real-time", { cache: "no-store", headers: { accept: "application/json" }, signal: AbortSignal.timeout(SOURCE_TIMEOUT_MS) });
      if (!response.ok) throw new Error(`Mynet Finans ${response.status}`);
      return parseMynetMarketPayload(await response.json());
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Piyasa kaynağı okunamadı");
}

/* Birincil piyasa akışı erişilemezse resmî TCMB günlük bülteni güvenli yedektir. TCMB hafta
   sonu ve tatilde son iş gününün bültenini döndürür; BIST ve altın için değer uydurulmaz. */
async function fetchTcmRates() {
  const response = await fetch("https://www.tcmb.gov.tr/kurlar/today.xml", { cache: "no-store", headers: { accept: "application/xml" }, signal: AbortSignal.timeout(SOURCE_TIMEOUT_MS) });
  if (!response.ok) throw new Error(`TCMB ${response.status}`);
  const xml = await response.text();
  const date = /Tarih="([\d.]+)"/.exec(xml)?.[1] ?? "";
  const wanted = [["USD", "Dolar"], ["EUR", "Euro"]] as const;
  const rates = [];
  for (const [code, name] of wanted) {
    const block = new RegExp(`<Currency[^>]*Kod="${code}"[\\s\\S]*?</Currency>`).exec(xml)?.[0] ?? "";
    const selling = Number(/<ForexSelling>([\d.]+)<\/ForexSelling>/.exec(block)?.[1] ?? "");
    if (!Number.isFinite(selling) || selling <= 0) continue;
    rates.push({ code, name, value: formatTurkish(selling), change: "", direction: "neutral" as const, asOf: date });
  }
  if (!rates.length) throw new Error("TCMB kur verisi ayrıştırılamadı");
  return { rates, date, source: "TCMB" };
}

async function fetchMarkets() {
  try {
    return { ...(await fetchLiveMarkets()), degraded: false };
  } catch (error) {
    console.warn("Piyasa ana kaynağı geçici olarak kullanılamadı; TCMB yedeği denenecek.", error instanceof Error ? error.message : "Bilinmeyen hata");
    return { ...(await fetchTcmRates()), degraded: true };
  }
}

async function fetchWeather() {
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetch("https://api.open-meteo.com/v1/forecast?latitude=41.01&longitude=28.97&current=temperature_2m&timezone=Europe%2FIstanbul", { cache: "no-store", signal: AbortSignal.timeout(SOURCE_TIMEOUT_MS) });
      if (!response.ok) throw new Error(`Hava durumu ${response.status}`);
      const data = await response.json() as { current?: { temperature_2m?: number } };
      const temperature = data.current?.temperature_2m;
      if (typeof temperature !== "number") throw new Error("Sıcaklık okunamadı");
      return { label: "İstanbul", value: `${Math.round(temperature)}°` };
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Hava durumu okunamadı");
}

export async function GET() {
  if (!getSiteSettings().showMarketTicker || getSiteSettings().showMarketTicker === "0") {
    return Response.json({ ok: false, disabled: true, rates: [], weather: null }, { headers: { "cache-control": "no-store" } });
  }

  const now = Date.now();
  if (cache && cache.expiresAt > now) return Response.json(cache.payload, { headers: { "cache-control": "no-store" } });

  const stored = await readSharedCache();
  const [rateResult, weatherResult] = await Promise.allSettled([fetchMarkets(), fetchWeather()]);
  const rateData = rateResult.status === "fulfilled" ? rateResult.value : null;
  const freshWeather = weatherResult.status === "fulfilled" ? weatherResult.value : null;
  const fresh = {
    rates: rateData?.rates ?? [],
    rateSource: rateData?.source ?? "",
    rateDate: rateData?.date ?? "",
    weather: freshWeather,
  };
  let selected = preferCompleteMarketSnapshot(fresh, stored);

  /* Aynı anda başlayan başka bir worker tam veriyi yazdıysa eksik yanıt vermeden önce onu al. */
  if (!hasCompleteMarketRates(selected.rates)) {
    const concurrent = await readSharedCache();
    selected = preferCompleteMarketSnapshot(fresh, concurrent ?? stored);
  }

  const payload: MarketPayload = {
    ok: Boolean(selected.rates.length || selected.weather),
    rates: selected.rates,
    rateSource: selected.rateSource,
    rateDate: selected.rateDate,
    weather: selected.weather,
    fetchedAt: now,
  };

  const freshHasAllRates = Boolean(rateData && !rateData.degraded && hasCompleteMarketRates(rateData.rates));
  const fullyFresh = freshHasAllRates && Boolean(freshWeather);

  /* Worker'ların tamamı aynı son başarılı tam veriyi paylaşır. Eksik TCMB yedeği tam veriyi ezmez. */
  if (freshHasAllRates || freshWeather) {
    const latest = await readSharedCache();
    const persisted = preferCompleteMarketSnapshot(fresh, latest ?? stored);
    try {
      await writeSharedCache({
        rates: hasCompleteMarketRates(persisted.rates) ? persisted.rates : [],
        rateSource: hasCompleteMarketRates(persisted.rates) ? persisted.rateSource : "",
        rateDate: hasCompleteMarketRates(persisted.rates) ? persisted.rateDate : "",
        weather: persisted.weather,
      });
    } catch (error) {
      console.warn("Ortak piyasa önbelleği yazılamadı.", error instanceof Error ? error.message : "Bilinmeyen hata");
    }
  }

  /* Eksik veya son başarılı veriye düşen yanıt beş dakika tutulmaz; kısa sürede tekrar denenir. */
  cache = { payload, expiresAt: now + (fullyFresh ? CACHE_MS : DEGRADED_CACHE_MS) };
  return Response.json(payload, { headers: { "cache-control": "no-store" } });
}
