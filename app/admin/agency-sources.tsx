"use client";

import { FormEvent, useEffect, useState } from "react";

type Source = { id: number; name: string; url: string; type: string; provider: string; feedFormat: string; authType: string; secretEnv: string; credentialReady: boolean; pollIntervalMinutes: number; publishMode: string; defaultCategory: string; categoryMap: string; disclaimer: string; active: number; lastCheckedAt: number | null; lastSuccessAt: number | null; lastError: string; nextPollAt: number | null; itemCount: number };
type Category = { name: string; isVisible: number };
const disclaimer = "Bu haber {agency} tarafından servis edilmiş, Koza TV ajans akışı tarafından otomatik olarak alınmıştır. İçeriğin kaynağı ve varsa güncelleme ya da geri çekme kayıtları ajans kimliğiyle birlikte saklanır.";
const empty = { id: 0, name: "", url: "", type: "agency", provider: "aa", feedFormat: "rss", authType: "bearer", secretEnv: "KOZA_AGENCY_AA_TOKEN", pollIntervalMinutes: 15, publishMode: "review", defaultCategory: "Gündem", categoryMap: "{}", disclaimer, active: 1 };
const providerLabels: Record<string, string> = { aa: "Anadolu Ajansı (AA)", iha: "İhlas Haber Ajansı (İHA)", dha: "Demirören Haber Ajansı (DHA)", other: "Diğer sözleşmeli ajans" };

function date(value: number | null) { return value ? new Intl.DateTimeFormat("tr-TR", { dateStyle: "short", timeStyle: "short" }).format(value) : "Henüz çalışmadı"; }

export function AgencySources({ categories, onChanged }: { categories: Category[]; onChanged: () => Promise<void> }) {
  const [sources, setSources] = useState<Source[]>([]);
  const [form, setForm] = useState(empty);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<number | "save" | null>(null);

  async function refresh() { const response = await fetch("/api/sources"); const data = await response.json(); setSources(data.sources ?? []); }
  useEffect(() => { const timer = window.setTimeout(() => void refresh(), 0); return () => window.clearTimeout(timer); }, []);

  function provider(value: string) {
    const short = value === "other" ? "AJANS" : value.toUpperCase();
    setForm((current) => ({ ...current, provider: value, name: value === "other" ? "" : providerLabels[value], secretEnv: `KOZA_AGENCY_${short}_TOKEN` }));
  }
  function edit(source: Source) { setForm({ ...empty, ...source }); setErrors({}); setMessage(`${source.name} düzenleniyor.`); }
  async function save(event: FormEvent) {
    event.preventDefault(); setBusy("save"); setErrors({}); setMessage("Ajans bağlantısı kaydediliyor…");
    const response = await fetch("/api/sources", { method: form.id ? "PATCH" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(form) });
    const data = await response.json(); setBusy(null);
    if (!response.ok) { setErrors(data.fields ?? {}); setMessage(data.error ?? "Ajans bağlantısı kaydedilemedi."); return; }
    setForm(empty); setMessage("Ajans bağlantısı kaydedildi. Bağlantıyı test edip ardından akışı başlatabilirsiniz."); await refresh(); await onChanged();
  }
  async function action(source: Source, actionName: "test" | "pull") {
    setBusy(source.id); setMessage(actionName === "test" ? "Bağlantı ve veri biçimi test ediliyor…" : "Ajans bülteni alınıyor…");
    const response = await fetch("/api/agency", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: actionName, sourceId: source.id }) });
    const data = await response.json(); setBusy(null); const result = data.results?.[0];
    setMessage(response.ok ? (actionName === "test" ? `${result.detected} geçerli haber algılandı; hiçbir kayıt yayınlanmadı.` : `${result.created} yeni, ${result.updated} güncellenen, ${result.pending || 0} editör korumasında bekleyen, ${result.withdrawn} geri çekilen, ${result.unchanged} değişmeyen kayıt işlendi.`) : `Ajans bağlantısı başarısız: ${result?.error || data.error}`);
    await refresh(); await onChanged();
  }
  async function toggle(source: Source) {
    setBusy(source.id); const response = await fetch("/api/sources", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...source, active: source.active ? 0 : 1 }) });
    setBusy(null); setMessage(response.ok ? (source.active ? "Otomatik takip durduruldu." : "Otomatik takip açıldı.") : "Kaynak durumu değiştirilemedi."); await refresh(); await onChanged();
  }

  const agencies = sources.filter((source) => source.type === "agency");
  return <div className="agency-center">
    <section className="newsroom-card agency-overview">
      <div className="agency-hero"><div><span>YETKİLİ AJANS BAĞLANTILARI</span><h2>Ajans Akış Merkezi</h2><p>AA, İHA, DHA veya sözleşmeli başka bir servisten metin, fotoğraf, video, düzeltme ve geri çekme kayıtlarını otomatik alın.</p></div><div className="agency-metrics"><b>{agencies.filter((item) => item.active).length}<small>aktif akış</small></b><b>{agencies.reduce((sum, item) => sum + item.itemCount, 0)}<small>ajans kaydı</small></b></div></div>
      <div className="agency-safety"><strong>Önemli kullanım şartı</strong><p>Bu ekran herkese açık web sayfalarını kopyalamaz. Her ajans için kurumsal abonelik, ajansın verdiği uç nokta ve sunucuda tanımlı erişim anahtarı gerekir. Anahtar değeri panelde veya veritabanında tutulmaz.</p></div>
      <div className="agency-list">{agencies.length ? agencies.map((source) => <article key={source.id}>
        <div className={`agency-mark agency-${source.provider}`}>{source.provider === "other" ? "AJ" : source.provider.toUpperCase()}</div>
        <div className="agency-main"><div><strong>{source.name}</strong><span>{providerLabels[source.provider] || "Haber ajansı"} · {source.feedFormat.toUpperCase()} · {source.pollIntervalMinutes} dk.</span></div><a href={source.url} target="_blank" rel="noreferrer">{source.url}</a><div className="agency-state"><i className={source.active ? "online" : ""}>{source.active ? "Otomatik takip açık" : "Takip kapalı"}</i><i className={source.credentialReady ? "online" : "warning"}>{source.credentialReady ? "Erişim hazır" : source.authType === "none" ? "Anahtar gerekmiyor" : "Sunucu anahtarı bekleniyor"}</i><i>{source.publishMode === "auto" ? "Doğrudan yayın" : "Editör kuyruğu"}</i><i>{source.itemCount} kayıt</i></div>{source.lastError && <p className="agency-error">Son hata: {source.lastError}</p>}<small>Son başarılı bağlantı: {date(source.lastSuccessAt)}</small></div>
        <div className="agency-actions"><button type="button" disabled={busy !== null} onClick={() => void action(source, "test")}>Bağlantıyı test et</button><button type="button" className="primary" disabled={busy !== null || !source.active} onClick={() => void action(source, "pull")}>{busy === source.id ? "İşleniyor…" : "Şimdi çek"}</button><button type="button" disabled={busy !== null} onClick={() => edit(source)}>Düzenle</button><button type="button" disabled={busy !== null} onClick={() => void toggle(source)}>{source.active ? "Durdur" : "Başlat"}</button></div>
      </article>) : <div className="agency-empty"><b>Henüz gerçek ajans bağlantısı yok</b><p>Sağdaki formdan sözleşmeli servis bilgilerini ekleyin. Eski Kaynak Merkezi yalnız URL kaydı tutuyordu; bu yeni akış gerçek veri alır ve durum kaydı oluşturur.</p></div>}</div>
    </section>
    <aside className="newsroom-card agency-form"><span>{form.id ? "AJANSI DÜZENLE" : "YENİ AJANS BAĞLANTISI"}</span><h2>{form.id ? form.name : "Abonelik akışını bağla"}</h2><form onSubmit={save}>
      <label>Ajans<select value={form.provider} onChange={(event) => provider(event.target.value)}><option value="aa">Anadolu Ajansı (AA)</option><option value="iha">İhlas Haber Ajansı (İHA)</option><option value="dha">Demirören Haber Ajansı (DHA)</option><option value="other">Diğer ajans</option></select></label>
      <label>Bağlantı adı<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />{errors.name && <em>{errors.name}</em>}</label>
      <label>Ajansın verdiği HTTPS uç noktası<input type="url" value={form.url} onChange={(event) => setForm({ ...form, url: event.target.value })} placeholder="https://abone.ajans.example/feed" required />{errors.url && <em>{errors.url}</em>}</label>
      <div className="agency-form-grid"><label>Veri biçimi<select value={form.feedFormat} onChange={(event) => setForm({ ...form, feedFormat: event.target.value })}><option value="rss">RSS / Atom</option><option value="newsml">NewsML-G2</option><option value="json">JSON API</option></select></label><label>Kimlik doğrulama<select value={form.authType} onChange={(event) => setForm({ ...form, authType: event.target.value })}><option value="bearer">Bearer anahtarı</option><option value="basic">Basic kullanıcı/parola</option><option value="none">Yok / IP izinli</option></select></label></div>
      {form.authType !== "none" && <label>Sunucudaki gizli değişkenin adı<input value={form.secretEnv} onChange={(event) => setForm({ ...form, secretEnv: event.target.value.toUpperCase() })} placeholder="KOZA_AGENCY_AA_TOKEN" /><small>Gerçek anahtarı değil, yalnız sunucudaki değişken adını yazın.</small>{errors.secretEnv && <em>{errors.secretEnv}</em>}</label>}
      <div className="agency-form-grid"><label>Kontrol sıklığı<select value={form.pollIntervalMinutes} onChange={(event) => setForm({ ...form, pollIntervalMinutes: Number(event.target.value) })}><option value="5">5 dakika</option><option value="15">15 dakika</option><option value="30">30 dakika</option><option value="60">60 dakika</option></select></label><label>Yayın davranışı<select value={form.publishMode} onChange={(event) => setForm({ ...form, publishMode: event.target.value })}><option value="review">Editör kuyruğuna al</option><option value="auto">Doğrudan yayınla</option></select></label></div>
      {form.publishMode === "auto" && <div className="agency-warning"><strong>Doğrudan yayın açık</strong><p>Ajansın gönderdiği yeni haber, düzeltme ve geri çekme kayıtları editör beklemeden uygulanır. Yalnız sözleşme ve alan eşlemesi doğrulandıktan sonra kullanın.</p></div>}
      <label>Varsayılan kategori<select value={form.defaultCategory} onChange={(event) => setForm({ ...form, defaultCategory: event.target.value })}>{categories.filter((item) => item.isVisible).map((category) => <option key={category.name}>{category.name}</option>)}</select></label>
      <label>Kategori eşlemesi (JSON)<textarea rows={3} value={form.categoryMap} onChange={(event) => setForm({ ...form, categoryMap: event.target.value })} placeholder={'{"POLITIKA":"Siyaset"}'} />{errors.categoryMap && <em>{errors.categoryMap}</em>}</label>
      <label>Haberde gösterilecek ajans bilgilendirmesi <small>İsteğe bağlı</small><textarea rows={5} maxLength={1000} value={form.disclaimer} onChange={(event) => setForm({ ...form, disclaimer: event.target.value })} /><small>Boş bırakırsanız açıklama metni gösterilmez. <code>{"{agency}"}</code> yerine ajans adı yazılır.</small>{errors.disclaimer && <em>{errors.disclaimer}</em>}</label>
      <label className="agency-check"><input type="checkbox" checked={Boolean(form.active)} onChange={(event) => setForm({ ...form, active: event.target.checked ? 1 : 0 })} /> Otomatik takibi aç</label>
      <button type="submit" disabled={busy !== null}>{busy === "save" ? "Kaydediliyor…" : form.id ? "Değişiklikleri kaydet" : "Ajans bağlantısını oluştur"}</button>{form.id ? <button type="button" className="secondary" onClick={() => setForm(empty)}>Yeni bağlantı formuna dön</button> : null}
    </form></aside>
    {message && <div className="agency-message" role="status">{message}</div>}
  </div>;
}
