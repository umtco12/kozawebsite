"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

type Redirect = { id: number; fromPath: string; toPath: string; kind: "permanent" | "temporary"; note: string; active: number; hits: number; lastHitAt: number | null; lastCheckStatus: number | null; lastCheckedAt: number | null };

function stamp(value: number | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(value);
}

/* Eski site adres envanteri ve 301 eşlemesi. Taşıma sırasında URL değerinin kaybedilmemesi için
   yöneticiler eşlemeleri buradan tanımlar; sistem hedef adreslerin açıldığını doğrular. */
export function RedirectManager({ canEdit }: { canEdit: boolean }) {
  const [redirects, setRedirects] = useState<Redirect[]>([]);
  const [form, setForm] = useState({ fromPath: "", toPath: "", kind: "permanent" as "permanent" | "temporary", note: "" });
  const [inventory, setInventory] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const response = await fetch("/api/redirects");
    if (!response.ok) { setMessage("Yönlendirme listesi okunamadı."); return; }
    setRedirects((await response.json()).redirects ?? []);
  }, []);

  useEffect(() => { const timer = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timer); }, [load]);

  async function addSingle(event: FormEvent) {
    event.preventDefault();
    setBusy(true); setErrors({}); setMessage("Eşleme kaydediliyor…");
    const response = await fetch("/api/redirects", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(form) });
    const data = await response.json(); setBusy(false);
    if (!response.ok) { setErrors(data.fields ?? {}); setMessage(data.error ?? "Eşleme kaydedilemedi."); return; }
    setRedirects(data.redirects ?? []); setForm({ fromPath: "", toPath: "", kind: "permanent", note: "" });
    setMessage("Eşleme kaydedildi; eski adres artık yeni adrese yönleniyor.");
  }

  async function importInventory(event: FormEvent) {
    event.preventDefault();
    setBusy(true); setMessage("Envanter işleniyor…");
    const response = await fetch("/api/redirects", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ inventory }) });
    const data = await response.json(); setBusy(false);
    if (!response.ok) { setMessage(`${data.error ?? "Envanter alınamadı."}${data.invalid?.length ? ` Okunamayan satır: ${data.invalid.length}` : ""}`); return; }
    setRedirects(data.redirects ?? []); setInventory("");
    setMessage(`${data.created} eşleme kaydedildi.${data.invalid?.length ? ` ${data.invalid.length} satır okunamadı.` : ""}${data.duplicates ? ` ${data.duplicates} tekrar eden satır atlandı.` : ""}`);
  }

  async function toggle(redirect: Redirect) {
    setBusy(true);
    const response = await fetch("/api/redirects", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: redirect.id, active: !redirect.active }) });
    const data = await response.json(); setBusy(false);
    if (!response.ok) { setMessage(data.error ?? "Güncellenemedi."); return; }
    setRedirects(data.redirects ?? []); setMessage(redirect.active ? "Eşleme durduruldu." : "Eşleme yeniden açıldı.");
  }

  async function remove(redirect: Redirect) {
    setBusy(true);
    const response = await fetch(`/api/redirects?id=${redirect.id}`, { method: "DELETE" });
    const data = await response.json(); setBusy(false);
    if (!response.ok) { setMessage(data.error ?? "Silinemedi."); return; }
    setRedirects(data.redirects ?? []); setMessage("Eşleme silindi.");
  }

  async function checkTargets() {
    setBusy(true); setMessage("Hedef adresler kontrol ediliyor…");
    const response = await fetch("/api/redirects", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "check" }) });
    const data = await response.json(); setBusy(false);
    if (!response.ok) { setMessage(data.error ?? "Kontrol tamamlanamadı."); return; }
    setRedirects(data.redirects ?? []);
    setMessage(data.broken?.length ? `${data.checked} eşleme kontrol edildi, ${data.broken.length} hedef açılmıyor.` : `${data.checked} eşlemenin hedefi sorunsuz açıldı.`);
  }

  const broken = redirects.filter((item) => item.lastCheckStatus !== null && item.lastCheckStatus !== 200);

  return (
    <div className="redirect-layout">
      <section className="newsroom-card">
        <div className="card-title">
          <div><span>ADRES ENVANTERİ</span><h2>Eski adres eşlemeleri</h2><p>Eski sitedeki adres, ziyaretçiyi kalıcı olarak yeni adrese gönderir. Arama motoru sıralaması korunur.</p></div>
          <button type="button" onClick={checkTargets} disabled={busy || !redirects.length}>Hedefleri kontrol et</button>
        </div>
        {broken.length > 0 && <div className="newsroom-message error">{broken.length} eşlemenin hedefi açılmıyor: {broken.slice(0, 3).map((item) => item.toPath).join(", ")}</div>}
        <div className="redirect-table">
          <div className="redirect-head"><span>Eski adres</span><span>Yeni adres</span><span>Tür</span><span>Kullanım</span><span>Hedef</span><span /></div>
          {redirects.length ? redirects.map((redirect) => (
            <div className={redirect.active ? "redirect-row" : "redirect-row passive"} key={redirect.id}>
              <span><code>{redirect.fromPath}</code>{redirect.note && <small>{redirect.note}</small>}</span>
              <span><a href={redirect.toPath} target="_blank" rel="noreferrer">{redirect.toPath}</a></span>
              <span>{redirect.kind === "permanent" ? "Kalıcı (301)" : "Geçici"}</span>
              <span>{redirect.hits} kez<small>{stamp(redirect.lastHitAt)}</small></span>
              <span>{redirect.lastCheckStatus === null ? "—" : redirect.lastCheckStatus === 200 ? "Açılıyor" : `Hata ${redirect.lastCheckStatus || "yok"}`}</span>
              <span className="redirect-actions">
                {canEdit && <button type="button" disabled={busy} onClick={() => void toggle(redirect)}>{redirect.active ? "Durdur" : "Aç"}</button>}
                {canEdit && <button type="button" disabled={busy} onClick={() => void remove(redirect)}>Sil</button>}
              </span>
            </div>
          )) : <div className="empty-state">Henüz eşleme tanımlanmadı.</div>}
        </div>
      </section>

      <aside className="newsroom-card redirect-add">
        <span>YENİ EŞLEME</span>
        <h2>Tek adres ekle</h2>
        <form onSubmit={addSingle}>
          <label>Eski adres<input value={form.fromPath} disabled={!canEdit} onChange={(event) => setForm({ ...form, fromPath: event.target.value })} placeholder="/haber/eski-haber-adresi" />{errors.fromPath && <em>{errors.fromPath}</em>}</label>
          <label>Yeni adres<input value={form.toPath} disabled={!canEdit} onChange={(event) => setForm({ ...form, toPath: event.target.value })} placeholder="/haber/yeni-haber-adresi" />{errors.toPath && <em>{errors.toPath}</em>}</label>
          <label>Tür<select value={form.kind} disabled={!canEdit} onChange={(event) => setForm({ ...form, kind: event.target.value as "permanent" | "temporary" })}><option value="permanent">Kalıcı (301) — taşınan içerik</option><option value="temporary">Geçici — kısa süreli</option></select></label>
          <label>Not<input value={form.note} disabled={!canEdit} onChange={(event) => setForm({ ...form, note: event.target.value })} placeholder="Neden taşındı?" /></label>
          <button type="submit" disabled={busy || !canEdit}>Eşlemeyi kaydet</button>
        </form>

        <h2>Toplu envanter aktar</h2>
        <p>Her satıra <b>eski adres, yeni adres</b> yazın. Tam URL de yapıştırabilirsiniz.</p>
        <form onSubmit={importInventory}>
          <label className="visually-hidden" htmlFor="redirect-inventory">Envanter listesi</label>
          <textarea id="redirect-inventory" rows={6} value={inventory} disabled={!canEdit} onChange={(event) => setInventory(event.target.value)} placeholder={"/eski/ekonomi-haberi, /haber/ekonomi-haberi\nhttps://kozatv.com.tr/eski/spor, /kategori/spor"} />
          <button type="submit" disabled={busy || !canEdit || inventory.trim().length < 3}>Envanteri aktar</button>
        </form>
        {message && <div className={message.includes("edilemedi") || message.includes("okunamadı") || message.includes("açılmıyor") ? "newsroom-message error" : "newsroom-message"}>{message}</div>}
      </aside>
    </div>
  );
}
