export const articleStatuses = ["draft", "review", "scheduled", "published"];
export const headlinePositions = ["left-top", "left-bottom", "right-top", "right-bottom"];
export const homepagePlacements = ["latest", "slider", "side", "below"];

export function slugify(value) {
  return String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ı/g, "i").replace(/İ/g, "i").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 120);
}

export function markHeadingSelection(value, start, end) {
  const source = String(value ?? "");
  const from = Number(start);
  const to = Number(end);
  if (!Number.isInteger(from) || !Number.isInteger(to) || from < 0 || to > source.length || from >= to) {
    return { valid: false, value: source, error: "Önce ara başlık olacak metni seçin." };
  }
  const heading = source.slice(from, to).trim().replace(/^##\s+/, "");
  if (heading.length < 2) return { valid: false, value: source, error: "Ara başlık en az 2 karakter olmalı." };
  if (heading.length > 180 || /[\r\n]/.test(heading)) return { valid: false, value: source, error: "Ara başlık tek satır ve en fazla 180 karakter olmalı." };
  const before = source.slice(0, from).trimEnd();
  const after = source.slice(to).trimStart();
  const prefix = before ? `${before}\n\n` : "";
  const marker = `## ${heading}`;
  const next = `${prefix}${marker}${after ? `\n\n${after}` : ""}`;
  const selectionStart = prefix.length + 3;
  return { valid: true, value: next, error: "", selectionStart, selectionEnd: selectionStart + heading.length };
}

export function plainBodyToBlocks(value, makeId = (index) => `plain-${index}`) {
  const chunks = String(value ?? "").replace(/\r\n?/g, "\n").split(/\n\s*\n+/).map((chunk) => chunk.trim()).filter(Boolean);
  return chunks.map((chunk, index) => {
    const heading = /^##\s+([^\n]+)$/.exec(chunk);
    return { id: makeId(index), type: heading ? "heading" : "paragraph", content: heading ? heading[1].trim() : chunk };
  });
}

export function promoteBlockSelectionToHeading(blocks, blockId, start, end, makeId = (index) => `split-${index}`) {
  const index = Array.isArray(blocks) ? blocks.findIndex((block) => block.id === blockId) : -1;
  const block = index >= 0 ? blocks[index] : null;
  if (!block || block.type !== "paragraph") return { valid: false, blocks, error: "Yalnız paragraf içindeki metin ara başlığa çevrilebilir." };
  const marked = markHeadingSelection(block.content, start, end);
  if (!marked.valid) return { valid: false, blocks, error: marked.error };
  const parsed = plainBodyToBlocks(marked.value, (partIndex) => partIndex === 0 ? block.id : makeId(partIndex));
  return { valid: true, blocks: [...blocks.slice(0, index), ...parsed, ...blocks.slice(index + 1)], error: "" };
}

export function validateArticleInput(payload) {
  const errors = {};
  if (!payload || typeof payload !== "object") return { valid: false, errors: { form: "Geçersiz veri" } };
  if (String(payload.title ?? "").trim().length < 12) errors.title = "Başlık en az 12 karakter olmalı";
  const spot = String(payload.spot ?? "").trim();
  if (spot.length < 24) errors.spot = "Spot en az 24 karakter olmalı";
  else if (spot.length > 500) errors.spot = "Spot en fazla 500 karakter olmalı";
  if (String(payload.body ?? "").trim().length < 80) errors.body = "Haber metni en az 80 karakter olmalı";
  if (!String(payload.category ?? "").trim()) errors.category = "Kategori seçilmeli";
  if (!String(payload.heroImage ?? "").trim()) errors.heroImage = "Kapak fotoğrafı seçmeden haber kaydedilemez";
  if (!articleStatuses.includes(payload.status)) errors.status = "Geçerli bir yayın durumu seçilmeli";
  if (payload.homepagePlacement != null && !homepagePlacements.includes(payload.homepagePlacement)) errors.homepagePlacement = "Geçerli bir ana sayfa konumu seçilmeli";
  if (payload.headlinePosition != null && !headlinePositions.includes(payload.headlinePosition)) errors.headlinePosition = "Geçerli bir manşet yazısı konumu seçilmeli";
  if (payload.status === "scheduled" && !payload.scheduledAt) errors.scheduledAt = "Planlı yayın tarihi gerekli";
  if (payload.sourceUrl) {
    try {
      const sourceUrl = new URL(payload.sourceUrl);
      if (!["http:", "https:"].includes(sourceUrl.protocol)) errors.sourceUrl = "Kaynak adresi http veya https olmalı";
    } catch {
      errors.sourceUrl = "Kaynak adresi geçerli bir URL olmalı";
    }
  }
  if (payload.videoUrl) {
    const videoUrl = String(payload.videoUrl).trim();
    if (videoUrl.startsWith("/")) {
      if (!/^\/media\/\d{4}\/\d{2}\/[a-f0-9]{32}\.(?:mp4|webm)$/i.test(videoUrl)) errors.videoUrl = "Kütüphane video yolu geçerli değil";
    } else {
      try {
        const parsed = new URL(videoUrl);
        if (parsed.protocol !== "https:" || parsed.username || parsed.password) errors.videoUrl = "Video adresi güvenli bir https bağlantısı olmalı";
      } catch {
        errors.videoUrl = "Video adresi veya kütüphane yolu geçerli değil";
      }
    }
  }
  return { valid: Object.keys(errors).length === 0, errors };
}
