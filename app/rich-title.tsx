import { displaySpot, displayTitle } from "../db/title-model.mjs";
import { displayRichTitle } from "../db/rich-text.mjs";

/* Başlık ve spotun ekrandaki gösterimi.

   Editör başlığa renk, punto veya vurgu verdiyse `titleHtml` dolu olur ve burada gösterilir.
   Boşsa haber eskisi gibi düz metin başlıkla görünür; arşivdeki kayıtlar etkilenmez.

   `<title>`, `og:title`, RSS, JSON-LD ve adres her zaman düz metin `title` alanını kullanır. */

type TitleSource = { title: string; titleHtml?: string };
type SpotSource = { title: string; spot: string; spotHtml?: string };

export function articleTitle(article: TitleSource) {
  const html = String(article.titleHtml ?? "").trim();
  if (!html) return displayTitle(article.title);
  return <span className="rich-title" dangerouslySetInnerHTML={{ __html: displayRichTitle(html) }} />;
}

export function articleSpot(article: SpotSource) {
  /* Spot başlığın kopyasıysa kartta ikinci kez gösterilmez; bu kural düz metin üzerinden işler. */
  const visible = displaySpot(article.spot, article.title);
  if (!visible) return null;
  const html = String(article.spotHtml ?? "").trim();
  if (!html) return visible;
  return <span className="rich-spot" dangerouslySetInnerHTML={{ __html: html }} />;
}
