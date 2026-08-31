"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AdImage } from "../ad-image";
import { formSignature, istanbulInputTimestamp, istanbulInputValue, toggleConfirmation } from "./ad-form-model.mjs";

type Placement = { key: string; label: string; scope: string; format: string; shape: string };
type Media = { id: number; publicUrl: string; originalName: string; altText: string };
type Advertisement = {
  id?: number; placement: string; advertiser: string; campaignName: string; title: string; description: string;
  imageUrl: string; targetUrl: string; ctaLabel: string; theme: string; kind: string; priority: number;
  active: number; startsAt: number | string | null; endsAt: number | string | null; state?: string;
  eligible?: boolean; serving?: boolean; updatedAt?: number;
};
type Notice = { kind: "success" | "error" | "info"; text: string } | null;
type ApiResponse = { error?: string; code?: string; fields?: Record<string, string>; placements?: Placement[]; advertisements?: Advertisement[]; media?: Media[] | Media; advertisement?: Advertisement };

const emptyAdvertisement: Advertisement = {
  placement: "site_top", advertiser: "", campaignName: "", title: "", description: "", imageUrl: "",
  targetUrl: "", ctaLabel: "", theme: "dark", kind: "direct", priority: 100, active: 1,
  startsAt: null, endsAt: null,
};
const stateLabels: Record<string, string> = { live: "Yayına uygun", scheduled: "Planlandı", paused: "Durduruldu", expired: "Süresi doldu" };
const kindLabels: Record<string, string> = { house: "Koza TV tanıtımı", direct: "Doğrudan reklam", programmatic: "Reklam ağı" };
const placementPreview: Record<string, string> = {
  site_top: "/", home_billboard: "/", section_inline: "/kategori/gundem",
  article_sidebar: "/haber/turkiyenin-gundemi-koza-tv-haber-merkezinde",
};
const acceptedImageTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function editableAdvertisement(item: Advertisement): Advertisement {
  return { ...item, startsAt: istanbulInputValue(item.startsAt), endsAt: istanbulInputValue(item.endsAt) };
}

function formatIstanbul(value: number | string | null | undefined) {
  const numeric = typeof value === "number" ? value : istanbulInputTimestamp(value);
  if (!numeric || !Number.isFinite(numeric)) return "";
  return new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Istanbul" }).format(numeric);
}

function saveMessage(item: Advertisement) {
  if (!item.active) return "Değişiklikler kaydedildi. Reklam yayından kaldırıldı; dilediğiniz zaman yeniden başlatabilirsiniz.";
  if (item.state === "scheduled") return `Reklam kaydedildi. ${formatIstanbul(item.startsAt)} tarihinde otomatik başlayacak.`;
  if (item.state === "expired") return "Reklam kaydedildi; ancak seçilen yayın dönemi sona ermiş durumda.";
  if (item.serving) return "Reklam kaydedildi ve seçilen alanda şu anda gösteriliyor.";
  return "Reklam kaydedildi. Aynı alandaki daha yüksek öncelikli kampanya gösteriliyor; bu kayıt yedekte bekliyor.";
}

function FieldError({ name, errors }: { name: string; errors: Record<string, string> }) {
  return errors[name] ? <em id={`ad-error-${name}`}>{errors[name]}</em> : null;
}

async function responseJson(response: Response): Promise<ApiResponse> {
  try { return await response.json() as ApiResponse; }
  catch { return { error: "Sunucudan okunabilir bir yanıt alınamadı." }; }
}

export function AdvertisingCenter({ canEdit, onDirtyChange }: { canEdit: boolean; onDirtyChange?: (dirty: boolean) => void }) {
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const [media, setMedia] = useState<Media[]>([]);
  const [form, setForm] = useState<Advertisement>(emptyAdvertisement);
  const [savedSignature, setSavedSignature] = useState(formSignature(emptyAdvertisement));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<Notice>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const editorHeading = useRef<HTMLHeadingElement>(null);
  const editorForm = useRef<HTMLFormElement>(null);

  const dirty = useMemo(() => formSignature(form) !== savedSignature, [form, savedSignature]);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [adsResponse, mediaResponse] = await Promise.all([
        fetch("/api/ads", { cache: "no-store" }),
        fetch("/api/media", { cache: "no-store" }),
      ]);
      const [adsData, mediaData] = await Promise.all([responseJson(adsResponse), responseJson(mediaResponse)]);
      if (!adsResponse.ok) throw new Error(adsData.error ?? "Reklam alanları alınamadı.");
      setPlacements(adsData.placements ?? []);
      setAdvertisements(adsData.advertisements ?? []);
      if (mediaResponse.ok) setMedia(Array.isArray(mediaData.media) ? mediaData.media : []);
    } catch (error) {
      setNotice({ kind: "error", text: error instanceof Error ? error.message : "Reklam alanları alınamadı. İnternet bağlantınızı kontrol edip yeniden deneyin." });
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => { const timer = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timer); }, [load]);
  useEffect(() => { onDirtyChange?.(dirty); }, [dirty, onDirtyChange]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  useEffect(() => {
    if (Object.keys(errors).length === 0) return;
    const frame = window.requestAnimationFrame(() => editorForm.current?.querySelector<HTMLElement>("[aria-invalid='true']")?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [errors]);

  const metrics = useMemo(() => ({
    serving: advertisements.filter((item) => item.serving).length,
    scheduled: advertisements.filter((item) => item.state === "scheduled").length,
  }), [advertisements]);

  function confirmDiscard() {
    return !dirty || window.confirm("Kaydedilmemiş değişiklikleriniz var. Bu değişiklikleri silmek istiyor musunuz?");
  }

  function focusEditor() {
    window.requestAnimationFrame(() => {
      editorHeading.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
      editorHeading.current?.focus({ preventScroll: true });
    });
  }

  function openEditor(item: Advertisement) {
    if (!confirmDiscard()) return;
    const next = editableAdvertisement(item);
    setForm(next); setSavedSignature(formSignature(next)); setErrors({}); setNotice(null); setPickerOpen(false); focusEditor();
  }

  function create(placement = placements[0]?.key ?? "site_top") {
    if (!confirmDiscard()) return;
    const next = { ...emptyAdvertisement, placement };
    setForm(next); setSavedSignature(formSignature(next)); setErrors({}); setNotice(null); setPickerOpen(false); focusEditor();
  }

  function update<K extends keyof Advertisement>(key: K, value: Advertisement[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => { if (!current[key as string]) return current; const next = { ...current }; delete next[key as string]; return next; });
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const startsAt = istanbulInputTimestamp(form.startsAt);
    const endsAt = istanbulInputTimestamp(form.endsAt);
    const dateErrors: Record<string, string> = {};
    if (Number.isNaN(startsAt)) dateErrors.startsAt = "Başlangıç tarihini kontrol edin.";
    if (Number.isNaN(endsAt)) dateErrors.endsAt = "Bitiş tarihini kontrol edin.";
    if (Object.keys(dateErrors).length) { setErrors(dateErrors); setNotice({ kind: "error", text: "Yayın tarihlerini kontrol edin." }); return; }
    setSaving(true); setErrors({}); setNotice({ kind: "info", text: "Reklam kaydediliyor…" });
    try {
      const response = await fetch("/api/ads", {
        method: form.id ? "PATCH" : "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...form, startsAt, endsAt }),
      });
      const data = await responseJson(response);
      if (!response.ok) {
        setErrors(data.fields ?? {});
        setNotice({ kind: "error", text: data.error ?? "Reklam kaydedilemedi. Bilgileri kontrol edip yeniden deneyin." });
        if (data.code === "EDIT_CONFLICT") await load(true);
        return;
      }
      await load(true);
      const saved = data.advertisement!;
      const next = editableAdvertisement(saved);
      setForm(next); setSavedSignature(formSignature(next)); setNotice({ kind: "success", text: saveMessage(saved) });
    } catch {
      setNotice({ kind: "error", text: "Sunucuya ulaşılamadı. Değişiklikler kaydedilmedi; bağlantınızı kontrol edip yeniden deneyin." });
    } finally {
      setSaving(false);
    }
  }

  async function toggleAdvertisement(item: Advertisement) {
    const confirmation = toggleConfirmation({ currentId: form.id, dirty, itemId: item.id, active: item.active, label: item.campaignName || item.title });
    if (confirmation && !window.confirm(confirmation)) return;
    setSaving(true); setNotice({ kind: "info", text: item.active ? "Reklam durduruluyor…" : "Reklam başlatılıyor…" });
    try {
      const response = await fetch("/api/ads", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...item, active: item.active ? 0 : 1 }) });
      const data = await responseJson(response);
      if (!response.ok) { setNotice({ kind: "error", text: data.error ?? "Reklam durumu değiştirilemedi." }); if (data.code === "EDIT_CONFLICT") await load(true); return; }
      await load(true);
      const saved = data.advertisement!;
      if (form.id === item.id) { const next = editableAdvertisement(saved); setForm(next); setSavedSignature(formSignature(next)); }
      setNotice({ kind: "success", text: saveMessage(saved) });
    } catch {
      setNotice({ kind: "error", text: "Sunucuya ulaşılamadı. Reklam durumu değiştirilmedi." });
    } finally { setSaving(false); }
  }

  async function uploadImage(file: File) {
    if (!acceptedImageTypes.has(file.type)) { setNotice({ kind: "error", text: "Yalnız JPG, PNG, WebP veya GIF görsel yükleyebilirsiniz." }); return; }
    if (file.size > 12 * 1024 * 1024) { setNotice({ kind: "error", text: "Reklam görseli en fazla 12 MB olabilir." }); return; }
    setUploading(true); setNotice({ kind: "info", text: "Görsel güvenli medya kütüphanesine yükleniyor…" });
    try {
      const payload = new FormData(); payload.set("file", file); payload.set("altText", `${form.advertiser || "Reklam"} görseli`); payload.set("credit", form.advertiser);
      const response = await fetch("/api/media", { method: "POST", body: payload });
      const data = await responseJson(response);
      if (!response.ok) { setNotice({ kind: "error", text: data.error ?? "Görsel yüklenemedi." }); return; }
      const uploaded = Array.isArray(data.media) ? data.media[0] : data.media;
      if (!uploaded) { setNotice({ kind: "error", text: "Yüklenen görsel sunucudan doğrulanamadı." }); return; }
      setMedia((current) => [uploaded, ...current.filter((item) => item.id !== uploaded.id)]);
      update("imageUrl", uploaded.publicUrl); setPickerOpen(false);
      setNotice({ kind: "success", text: "Görsel yüklendi ve bu reklama seçildi. Reklamı yayınlamak için değişiklikleri kaydedin." });
    } catch { setNotice({ kind: "error", text: "Görsel yüklenemedi. Bağlantınızı kontrol edip yeniden deneyin." }); }
    finally { setUploading(false); }
  }

  const statusText = !form.active ? "Durduruldu" : form.state === "scheduled" ? `Planlandı · ${formatIstanbul(form.startsAt)}` : form.state === "expired" ? "Yayın dönemi sona erdi" : form.serving ? "Şu anda yayında" : form.id ? "Kayda uygun; öncelik sırası bekleniyor" : "Kaydedilince yayın kuralları hesaplanacak";

  if (loading) return <section className="newsroom-card advertising-loading" aria-busy="true" aria-live="polite"><span className="advertising-spinner" /><div><h2>Reklam alanları hazırlanıyor</h2><p>Kampanyalar ve medya kütüphanesi yükleniyor…</p></div></section>;

  return (
    <div className="advertising-center" aria-busy={saving || uploading}>
      <section className="advertising-inventory newsroom-card">
        <header className="advertising-hero">
          <div><span>REKLAM ALANLARI</span><h2>Yayındaki reklamlar</h2><p>Dört sabit alanı buradan yönetin. Reklam etiketi ziyaretçi sitesine otomatik eklenir.</p></div>
          <div className="advertising-metrics"><b>{placements.length}<small>reklam alanı</small></b><b>{metrics.serving}<small>şu an yayında</small></b><b>{metrics.scheduled}<small>planlandı</small></b></div>
        </header>
        <div className="advertising-policy"><strong>“REKLAM” etiketi otomatik eklenir ve kaldırılamaz.</strong><p>Koza TV; pop-up, otomatik ses ve içeriği kapatan reklam kullanmaz. Bir reklamı silmek yerine güvenle durdurabilirsiniz.</p></div>
        {notice && <div className={`advertising-notice ${notice.kind}`} role={notice.kind === "error" ? "alert" : "status"} aria-live="polite"><span>{notice.text}</span>{notice.kind === "error" && advertisements.length === 0 ? <button type="button" onClick={() => void load()}>Yeniden dene</button> : null}</div>}
        <div className="placement-list">
          {placements.map((placement, placementIndex) => {
            const items = advertisements.filter((item) => item.placement === placement.key);
            const serving = items.find((item) => item.serving);
            return <article key={placement.key}>
              <div className="placement-code" aria-hidden="true"><b>{String(placementIndex + 1).padStart(2, "0")}</b><small>ALAN</small></div>
              <div className="placement-copy"><span>{placement.scope}</span><strong>{placement.label}</strong><p>{placement.format}</p>{serving ? <small>Şu anda: <b>{serving.advertiser}</b> · {serving.title}</small> : <small>Bu alanda şu anda reklam gösterilmiyor.</small>}</div>
              <div className="placement-actions"><em className={serving ? "live" : "empty"}>{serving ? "YAYINDA" : "BOŞ"}</em><b>{items.length} kampanya</b>{canEdit && <button type="button" onClick={() => create(placement.key)}>+ Yeni reklam</button>}</div>
              {items.length > 0 && <div className="placement-campaigns">{items.map((item) => <div className={form.id === item.id ? "selected" : ""} key={item.id}>
                <button className="campaign-open" type="button" aria-current={form.id === item.id ? "true" : undefined} onClick={() => openEditor(item)}><span><i className={`ad-state ad-state-${item.serving ? "live" : item.state}`} />{item.serving ? "Yayında" : item.eligible ? "Yedekte" : stateLabels[item.state ?? ""] ?? "Kayıt"}</span><strong>{item.campaignName || item.title}</strong><small>{kindLabels[item.kind] ?? item.kind} · öncelik {item.priority}</small></button>
                {canEdit && <button className="campaign-toggle" type="button" disabled={saving} onClick={() => void toggleAdvertisement(item)}>{item.active ? "Durdur" : "Başlat"}</button>}
              </div>)}</div>}
            </article>;
          })}
        </div>
      </section>

      <aside className="advertising-form newsroom-card">
        <span>{form.id ? "REKLAMI DÜZENLE" : "YENİ REKLAM"}</span>
        <h2 ref={editorHeading} tabIndex={-1}>{form.id ? (form.campaignName || form.title) : "Reklam oluştur"}</h2>
        <p className="advertising-form-intro">Önce görünüm ve bağlantıyı hazırlayın; yayın tarihlerini en son kontrol edin.</p>
        <form ref={editorForm} onSubmit={submit} noValidate>
          <section className="advertising-form-section"><h3>1. Temel bilgiler</h3>
            <label>Reklamın görüneceği alan<select name="placement" value={form.placement} disabled={!canEdit} onChange={(event) => update("placement", event.target.value)} aria-invalid={Boolean(errors.placement)} aria-describedby={errors.placement ? "ad-error-placement" : undefined}>{placements.map((item) => <option value={item.key} key={item.key}>{item.label} · {item.format}</option>)}</select><FieldError name="placement" errors={errors} /></label>
            <label>Reklamveren / marka<input name="advertiser" value={form.advertiser} maxLength={100} required disabled={!canEdit} placeholder="Örn. Koza TV" onChange={(event) => update("advertiser", event.target.value)} aria-invalid={Boolean(errors.advertiser)} aria-describedby={errors.advertiser ? "ad-error-advertiser" : undefined} /><FieldError name="advertiser" errors={errors} /></label>
            <label>Reklam başlığı <small>{form.title.length}/110</small><input name="title" value={form.title} maxLength={110} required disabled={!canEdit} placeholder="Okurun tek bakışta anlayacağı kısa başlık" onChange={(event) => update("title", event.target.value)} aria-invalid={Boolean(errors.title)} aria-describedby={errors.title ? "ad-error-title" : undefined} /><FieldError name="title" errors={errors} /></label>
            <label>Açıklama <small>İsteğe bağlı · {form.description.length}/260</small><textarea name="description" rows={3} value={form.description} maxLength={260} disabled={!canEdit} onChange={(event) => update("description", event.target.value)} aria-invalid={Boolean(errors.description)} aria-describedby={errors.description ? "ad-error-description" : undefined} /><FieldError name="description" errors={errors} /></label>
          </section>

          <section className="advertising-form-section"><h3>2. Görsel ve bağlantı</h3>
            <div className="advertising-media-actions"><label className="advertising-upload">↑ Bilgisayardan yükle<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={!canEdit || uploading} onChange={(event) => { const file = event.target.files?.[0]; event.currentTarget.value = ""; if (file) void uploadImage(file); }} /></label><button type="button" disabled={!canEdit || media.length === 0} onClick={() => setPickerOpen((open) => !open)}>▧ Kütüphaneden seç</button>{form.imageUrl && <button type="button" className="quiet" disabled={!canEdit} onClick={() => update("imageUrl", "")}>Görseli kaldır</button>}<small>JPG, PNG, WebP veya GIF · en fazla 12 MB</small></div>
            {pickerOpen && <div className="advertising-media-picker" aria-label="Medya kütüphanesi">{media.slice(0, 24).map((item) => <button type="button" className={form.imageUrl === item.publicUrl ? "selected" : ""} onClick={() => { update("imageUrl", item.publicUrl); setPickerOpen(false); }} key={item.id}><AdImage src={item.publicUrl} alt="" /><span>{item.originalName}</span></button>)}</div>}
            <label>Tıklanınca açılacak adres <small>İsteğe bağlı</small><input name="targetUrl" value={form.targetUrl} disabled={!canEdit} placeholder="/canli veya https://reklamveren.example" onChange={(event) => update("targetUrl", event.target.value)} aria-invalid={Boolean(errors.targetUrl)} aria-describedby={errors.targetUrl ? "ad-error-targetUrl" : undefined} /><FieldError name="targetUrl" errors={errors} /></label>
            <label>Buton metni <small>Hedef adres varsa isteğe bağlı</small><input name="ctaLabel" value={form.ctaLabel} maxLength={30} disabled={!canEdit} placeholder="Detaylı bilgi" onChange={(event) => update("ctaLabel", event.target.value)} aria-invalid={Boolean(errors.ctaLabel)} aria-describedby={errors.ctaLabel ? "ad-error-ctaLabel" : undefined} /><FieldError name="ctaLabel" errors={errors} /></label>
          </section>

          <section className="advertising-form-section"><h3>3. Yayın planı <small>Türkiye saati</small></h3>
            <div className="advertising-form-grid"><label>Başlangıç <small>İsteğe bağlı</small><input name="startsAt" type="datetime-local" value={String(form.startsAt ?? "")} disabled={!canEdit} onChange={(event) => update("startsAt", event.target.value || null)} aria-invalid={Boolean(errors.startsAt)} aria-describedby={errors.startsAt ? "ad-error-startsAt" : undefined} /><FieldError name="startsAt" errors={errors} /></label><label>Bitiş <small>İsteğe bağlı</small><input name="endsAt" type="datetime-local" value={String(form.endsAt ?? "")} disabled={!canEdit} onChange={(event) => update("endsAt", event.target.value || null)} aria-invalid={Boolean(errors.endsAt)} aria-describedby={errors.endsAt ? "ad-error-endsAt" : undefined} /><FieldError name="endsAt" errors={errors} /></label></div>
            <label className="advertising-check"><input name="active" aria-label="Reklam aktif" type="checkbox" checked={Boolean(form.active)} disabled={!canEdit} onChange={(event) => update("active", event.target.checked ? 1 : 0)} /><span><strong>Reklam aktif</strong><small>Kapatırsanız kampanya silinmez; ziyaretçi sitesinden hemen kaldırılır.</small></span></label>
            <div className="advertising-schedule-summary"><span>Yayın durumu</span><strong>{statusText}</strong>{form.id && <a href={placementPreview[form.placement] ?? "/"} target="_blank" rel="noreferrer">Sitede kontrol et →</a>}</div>
          </section>

          <details className="advertising-advanced"><summary>Gelişmiş ayarlar</summary><p>Bu alanları çoğu reklam için değiştirmeniz gerekmez.</p>
            <label>Kampanya adı <small>Yalnız panelde görünür</small><input name="campaignName" value={form.campaignName} maxLength={120} disabled={!canEdit} placeholder="Örn. Eylül marka kampanyası" onChange={(event) => update("campaignName", event.target.value)} aria-invalid={Boolean(errors.campaignName)} aria-describedby={errors.campaignName ? "ad-error-campaignName" : undefined} /><FieldError name="campaignName" errors={errors} /></label>
            <label>Görselin güvenli adresi <small>Medya kütüphanesi kullanmanız önerilir</small><input name="imageUrl" value={form.imageUrl} disabled={!canEdit} placeholder="/media/2026/08/reklam.webp" onChange={(event) => update("imageUrl", event.target.value)} aria-invalid={Boolean(errors.imageUrl)} aria-describedby={errors.imageUrl ? "ad-error-imageUrl" : undefined} /><FieldError name="imageUrl" errors={errors} /></label>
            <div className="advertising-form-grid"><label>Gösterim önceliği <small>Yüksek sayı önce gösterilir</small><input name="priority" type="number" min={1} max={999} step={1} value={form.priority} disabled={!canEdit} onChange={(event) => update("priority", Number(event.target.value))} aria-invalid={Boolean(errors.priority)} aria-describedby={errors.priority ? "ad-error-priority" : undefined} /><FieldError name="priority" errors={errors} /></label><label>Görsel tema<select name="theme" value={form.theme} disabled={!canEdit} onChange={(event) => update("theme", event.target.value)} aria-invalid={Boolean(errors.theme)}><option value="dark">Koyu</option><option value="red">Kırmızı</option><option value="light">Açık</option></select><FieldError name="theme" errors={errors} /></label></div>
            <label>Yayın türü<select name="kind" value={form.kind} disabled={!canEdit} onChange={(event) => update("kind", event.target.value)} aria-invalid={Boolean(errors.kind)}><option value="house">Koza TV tanıtımı</option><option value="direct">Doğrudan reklam</option><option value="programmatic" disabled={form.kind !== "programmatic"}>Reklam ağı · henüz bağlı değil</option></select><small>Reklam ağı seçeneği teknik entegrasyon tamamlanana kadar yeni kampanyalarda kullanılamaz.</small><FieldError name="kind" errors={errors} /></label>
          </details>

          <div className={`advertising-preview ad-theme-${form.theme} ${form.imageUrl ? "has-image" : "no-image"}`} aria-label="Reklam ön izlemesi"><span>REKLAM</span>{form.imageUrl && <AdImage src={form.imageUrl} alt="" />}<div><small>{form.kind === "house" ? "KOZA TV TANITIMI" : form.advertiser || "REKLAMVEREN"}</small><strong>{form.title || "Reklam başlığı"}</strong><p>{form.description || "Reklam açıklaması bu alanda görünür."}</p></div>{form.ctaLabel && form.targetUrl && <b>{form.ctaLabel} →</b>}</div>
          {canEdit && <div className="advertising-savebar"><span>{dirty ? "Kaydedilmemiş değişiklikler var" : form.id ? "Tüm değişiklikler kayıtlı" : "Yeni reklam hazır"}</span><button type="submit" disabled={saving || uploading}>{saving ? "Kaydediliyor…" : form.id ? "Değişiklikleri kaydet" : "Reklamı oluştur"}</button></div>}
        </form>
      </aside>
    </div>
  );
}
