/* Başlık görüntüleme kuralları.

   Eski arşivdeki haberlerin yaklaşık dörtte üçü tamamen büyük harfle yazılmış. Sayfada olduğu
   gibi gösterildiğinde okuma yorucu ve görsel olarak bağırgan oluyor. Bu yüzden yalnızca
   *tamamı* büyük harf olan başlıklar okunur biçime çevrilir; kısaltmalar korunur.

   Veri değiştirilmez, dönüşüm yalnızca gösterim anında yapılır: editör başlığı panelde
   özgün hâliyle görür ve istediğinde elle düzeltebilir. */

/* Kısaltma sayılan bilinen kurum ve terimler. Uzunluk kuralına takılmayanlar buraya yazılır. */
const knownAcronyms = new Set([
  "TBMM", "CHP", "AKP", "MHP", "PKK", "DEM", "İYİ", "TSK", "ABD", "AB", "BM", "NATO", "TÜİK",
  "TCMB", "SGK", "MEB", "YÖK", "TFF", "UEFA", "FIFA", "MİT", "AFAD", "TRT", "RTÜK", "KVKK",
  "İBB", "ASKİ", "İSKİ", "TÜBİTAK", "TOKİ", "OSB", "KDV", "ÖTV", "HDP", "DEVA", "İYİP",
]);

const lower = (value) => value.toLocaleLowerCase("tr-TR");
/* İlk *harfi* büyütür. Başta tırnak veya parantez varsa onu atlar: "(MAÇ" → "(Maç". */
const upperFirst = (value) => {
  const text = lower(value);
  const index = [...text].findIndex((character) => /\p{L}/u.test(character));
  if (index === -1) return text;
  return text.slice(0, index) + text[index].toLocaleUpperCase("tr-TR") + text.slice(index + 1);
};

function isAllUpper(value) {
  const letters = value.replace(/[^\p{L}]/gu, "");
  return letters.length > 0 && letters === letters.toLocaleUpperCase("tr-TR");
}

/* Kısaltma sayma kuralı: bilinen listede olmak ya da sesli harf içermeyen kısa bir dizi olmak.
   "CHP", "PKK", "TSK" korunur; "SON", "YENİ", "BİR" gibi gerçek kelimeler çevrilir. */
function isAcronym(bare) {
  if (knownAcronyms.has(bare)) return true;
  if (bare.length < 3 || bare.length > 5) return false;
  if (!isAllUpper(bare)) return false;
  return !/[AEIİOÖUÜ]/.test(bare);
}

/* "CHP'NİN" gibi ekli kısaltmalarda kök korunur, ek küçültülür: "CHP'nin". */
function convertToken(token) {
  const parts = token.split(/(['’])/);
  const head = parts[0];
  const bare = head.replace(/[^\p{L}\p{N}]/gu, "");
  const converted = isAcronym(bare) ? head : upperFirst(head);
  if (parts.length === 1) return converted;
  return converted + parts.slice(1).map((part, index) => (index % 2 === 0 ? part : lower(part))).join("");
}

/* Tamamı büyük harf olan başlığı okunur biçime çevirir; diğer başlıklara dokunmaz. */
export function displayTitle(title) {
  const value = String(title ?? "").trim();
  if (!value || !isAllUpper(value)) return value;

  const words = value.split(/(\s+)/).map((chunk) => (/^\s+$/.test(chunk) ? chunk : convertToken(chunk)));
  const result = words.join("");
  return result;
}

/* Eski sitede `og:description` çoğu haberde başlığın kopyası. Aynı metni spot olarak ikinci kez
   göstermek kartı doldurmuyor, tekrar hissi veriyor. Spot başlıkla aynıysa gösterilmez. */
function comparable(value) {
  return String(value ?? "")
    .toLocaleLowerCase("tr-TR")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

export function displaySpot(spot, title) {
  const value = String(spot ?? "").trim();
  if (!value) return "";
  const left = comparable(value);
  const right = comparable(title);
  if (!left || left === right) return "";
  /* Spot da başlığın devamıysa (başlıkla başlayıp aynı cümleyi sürdürüyorsa) gösterilmez. */
  if (right && left.startsWith(right) && left.length - right.length < 12) return "";
  return isAllUpperExport(value) ? displayTitle(value) : value;
}

function isAllUpperExport(value) {
  const letters = value.replace(/[^\p{L}]/gu, "");
  return letters.length > 0 && letters === letters.toLocaleUpperCase("tr-TR");
}
