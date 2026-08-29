import { getSiteSettings } from "../../../db";
import { parseMynetMarketPayload } from "./market-model.mjs";

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
let cache: { payload: MarketPayload; expiresAt: number } | undefined;

function formatTurkish(value: number) {
  return value.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/* Mynet'in genel piyasa akışı Koza TV'nin eski üst bandındaki BIST, altın ve serbest piyasa
   değerleriyle aynı veri setini sağlar. Yanıt yalnız sunucuda okunur ve sıkı biçimde doğrulanır. */
async function fetchLiveMarkets() {
  const response = await fetch("https://finans.mynet.com/api/real-time", { cache: "no-store", headers: { accept: "application/json" }, signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error(`Mynet Finans ${response.status}`);
  return parseMynetMarketPayload(await response.json());
}

/* Birincil piyasa akışı erişilemezse resmî TCMB günlük bülteni güvenli yedektir. TCMB hafta
   sonu ve tatilde son iş gününün bültenini döndürür; BIST ve altın için değer uydurulmaz. */
async function fetchTcmRates() {
  const response = await fetch("https://www.tcmb.gov.tr/kurlar/today.xml", { cache: "no-store", headers: { accept: "application/xml" }, signal: AbortSignal.timeout(8000) });
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
    return await fetchLiveMarkets();
  } catch {
    return fetchTcmRates();
  }
}

async function fetchWeather() {
  const response = await fetch("https://api.open-meteo.com/v1/forecast?latitude=41.01&longitude=28.97&current=temperature_2m&timezone=Europe%2FIstanbul", { cache: "no-store", signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error(`Hava durumu ${response.status}`);
  const data = await response.json() as { current?: { temperature_2m?: number } };
  const temperature = data.current?.temperature_2m;
  if (typeof temperature !== "number") throw new Error("Sıcaklık okunamadı");
  return { label: "İstanbul", value: `${Math.round(temperature)}°` };
}

export async function GET() {
  if (!getSiteSettings().showMarketTicker || getSiteSettings().showMarketTicker === "0") {
    return Response.json({ ok: false, disabled: true, rates: [], weather: null }, { headers: { "cache-control": "no-store" } });
  }

  const now = Date.now();
  if (cache && cache.expiresAt > now) return Response.json(cache.payload, { headers: { "cache-control": "public, max-age=300" } });

  const [rateResult, weatherResult] = await Promise.allSettled([fetchMarkets(), fetchWeather()]);
  const rateData = rateResult.status === "fulfilled" ? rateResult.value : null;
  const weather = weatherResult.status === "fulfilled" ? weatherResult.value : null;

  const payload: MarketPayload = {
    ok: Boolean(rateData || weather),
    rates: rateData?.rates ?? [],
    rateSource: rateData?.source ?? "",
    rateDate: rateData?.date ?? "",
    weather,
    fetchedAt: now,
  };

  /* Başarısız denemeyi uzun süre önbelleğe almayız; bir sonraki istekte tekrar denenir. */
  cache = { payload, expiresAt: now + (payload.ok ? CACHE_MS : 60_000) };
  return Response.json(payload, { headers: { "cache-control": payload.ok ? "public, max-age=300" : "no-store" } });
}
