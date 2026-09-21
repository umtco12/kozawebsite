const selectedMarkets = [
  { sourceCode: "XU100", code: "XU100", name: "BIST 100", fractionDigits: 0 },
  { sourceCode: "GAUTRY", code: "GOLD", name: "Altın", fractionDigits: 0 },
  { sourceCode: "USDTRY", code: "USD", name: "Dolar", fractionDigits: 2 },
  { sourceCode: "EURTRY", code: "EUR", name: "Euro", fractionDigits: 2 },
];

const requiredMarketCodes = selectedMarkets.map((market) => market.code);

const turkishMonths = new Map([
  ["ocak", "01"], ["şubat", "02"], ["mart", "03"], ["nisan", "04"],
  ["mayıs", "05"], ["haziran", "06"], ["temmuz", "07"], ["ağustos", "08"],
  ["eylül", "09"], ["ekim", "10"], ["kasım", "11"], ["aralık", "12"],
]);

function parsePrice(value) {
  const normalized = String(value ?? "").trim().replaceAll(".", "").replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function parsePercent(value) {
  const normalized = String(value ?? "").replace("%", "").replaceAll(" ", "").replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatValue(value, fractionDigits) {
  return value.toLocaleString("tr-TR", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

function formatChange(value) {
  return `%${value.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function compactDate(value) {
  const match = /^(\d{1,2})\s+([^\s]+)\s+(\d{4})/.exec(String(value ?? "").trim().toLocaleLowerCase("tr-TR"));
  if (!match) return "";
  const month = turkishMonths.get(match[2]);
  return month ? `${match[1].padStart(2, "0")}.${month}.${match[3]}` : "";
}

export function parseMynetMarketPayload(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Piyasa yanıtı nesne değil");
  }

  const rates = selectedMarkets.map((market) => {
    const source = payload[market.sourceCode];
    const price = parsePrice(source?.price);
    const percent = parsePercent(source?.percent);
    if (price === null || percent === null) throw new Error(`${market.sourceCode} verisi eksik`);

    return {
      code: market.code,
      name: market.name,
      value: formatValue(price, market.fractionDigits),
      change: formatChange(percent),
      direction: /** @type {"up" | "down" | "neutral"} */ (percent > 0 ? "up" : percent < 0 ? "down" : "neutral"),
      asOf: typeof source.date === "string" ? source.date.trim() : "",
    };
  });

  const referenceDate = rates.find((rate) => rate.code === "USD")?.asOf || rates[0]?.asOf || "";
  return { rates, date: compactDate(referenceDate), source: "Mynet Finans" };
}

/**
 * BIST, altın, dolar ve euro birlikte gelmedikçe yanıt tam piyasa verisi sayılmaz.
 * Böylece yalnız TCMB'den gelen iki döviz kuru daha önceki tam bandı ezemez.
 */
export function hasCompleteMarketRates(rates) {
  if (!Array.isArray(rates) || rates.length !== requiredMarketCodes.length) return false;
  const codes = new Set(rates.map((rate) => rate?.code));
  return requiredMarketCodes.every((code) => codes.has(code));
}

/**
 * Yeni kaynak eksikse son başarılı tam piyasa verisini korur. Hava durumu da aynı
 * biçimde son doğrulanmış değere düşer; hiçbir değer uydurulmaz.
 */
export function preferCompleteMarketSnapshot(fresh, stored) {
  const freshHasAllRates = hasCompleteMarketRates(fresh?.rates);
  const storedHasAllRates = hasCompleteMarketRates(stored?.rates);
  const useStoredRates = !freshHasAllRates && storedHasAllRates;

  return {
    rates: useStoredRates ? stored.rates : Array.isArray(fresh?.rates) ? fresh.rates : [],
    rateSource: useStoredRates ? stored.rateSource : String(fresh?.rateSource ?? ""),
    rateDate: useStoredRates ? stored.rateDate : String(fresh?.rateDate ?? ""),
    weather: fresh?.weather ?? stored?.weather ?? null,
  };
}
