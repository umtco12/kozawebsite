const selectedMarkets = [
  { sourceCode: "XU100", code: "XU100", name: "BIST 100", fractionDigits: 0 },
  { sourceCode: "GAUTRY", code: "GOLD", name: "Altın", fractionDigits: 0 },
  { sourceCode: "USDTRY", code: "USD", name: "Dolar", fractionDigits: 2 },
  { sourceCode: "EURTRY", code: "EUR", name: "Euro", fractionDigits: 2 },
];

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
