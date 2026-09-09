export const articleStatuses = ["draft", "review", "scheduled", "published"];
export const headlinePositions = ["left-top", "left-bottom", "right-top", "right-bottom"];
export const homepagePlacements = ["latest", "slider", "side", "below"];

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
