export const articleStatuses = ["draft", "review", "scheduled", "published"];

export function slugify(value) {
  return String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ı/g, "i").replace(/İ/g, "i").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 120);
}

export function validateArticleInput(payload) {
  const errors = {};
  if (!payload || typeof payload !== "object") return { valid: false, errors: { form: "Geçersiz veri" } };
  if (String(payload.title ?? "").trim().length < 12) errors.title = "Başlık en az 12 karakter olmalı";
  if (String(payload.spot ?? "").trim().length < 24) errors.spot = "Spot en az 24 karakter olmalı";
  if (String(payload.body ?? "").trim().length < 80) errors.body = "Haber metni en az 80 karakter olmalı";
  if (!String(payload.category ?? "").trim()) errors.category = "Kategori seçilmeli";
  if (!articleStatuses.includes(payload.status)) errors.status = "Geçerli bir yayın durumu seçilmeli";
  if (payload.status === "scheduled" && !payload.scheduledAt) errors.scheduledAt = "Planlı yayın tarihi gerekli";
  if (payload.sourceUrl) {
    try {
      const sourceUrl = new URL(payload.sourceUrl);
      if (!["http:", "https:"].includes(sourceUrl.protocol)) errors.sourceUrl = "Kaynak adresi http veya https olmalı";
    } catch {
      errors.sourceUrl = "Kaynak adresi geçerli bir URL olmalı";
    }
  }
  return { valid: Object.keys(errors).length === 0, errors };
}
