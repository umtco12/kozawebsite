"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Stats = { total: number; pending: number; imported: number; skipped: number; failed: number };
type Item = { id: number; sourceUrl: string; sourcePath: string; status: string; title: string; message: string; articleId: number | null; processedAt: number | null };

const statusLabels: Record<string, string> = { pending: "Bekliyor", imported: "Aktarıldı", skipped: "Atlandı", failed: "Hata" };

function stamp(value: number | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(value);
}

/* Eski kozatv.com.tr arşivini yeni siteye taşıyan köprü. Aktarım parça parça çalışır; tarayıcı
   kapatılsa bile kaldığı yerden sürdürülebilir çünkü durum veritabanında tutulur. */
export function ContentImport({ canEdit }: { canEdit: boolean }) {
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, imported: 0, skipped: 0, failed: 0 });
  const [items, setItems] = useState<Item[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [publish, setPublish] = useState(false);
  const [batchSize, setBatchSize] = useState(10);
  const [running, setRunning] = useState(false);
  const runningRef = useRef(false);

  const load = useCallback(async () => {
    const response = await fetch("/api/import");
    if (!response.ok) { setMessage("Aktarım durumu okunamadı."); return; }
    const data = await response.json();
    setStats(data.stats); setItems(data.items ?? []);
  }, []);

  useEffect(() => { const timer = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timer); }, [load]);

  async function send(body: Record<string, unknown>) {
    const response = await fetch("/api/import", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? "İşlem tamamlanamadı.");
    return data;
  }

  async function discover() {
    setBusy(true); setMessage("Eski sitenin sitemap dosyaları taranıyor… Bu işlem bir dakika sürebilir.");
    try {
      const data = await send({ action: "discover" });
      setStats(data.stats);
      setMessage(`${data.sitemaps} aylık sitemap tarandı, ${data.discovered} yeni adres kuyruğa eklendi.`);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Keşif tamamlanamadı.");
    }
    setBusy(false);
  }

  async function runOnce() {
    setBusy(true); setMessage(`${batchSize} haber aktarılıyor…`);
    try {
      const data = await send({ action: "run", limit: batchSize, publish });
      setStats(data.stats);
      setMessage(`${data.processed} adres işlendi. ${data.message ?? ""}`.trim());
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Aktarım tamamlanamadı.");
    }
    setBusy(false);
  }

  /* Sürekli aktarım: kuyruk boşalana veya durdurulana kadar parti parti devam eder. */
  async function runContinuous() {
    if (runningRef.current) { runningRef.current = false; setRunning(false); setMessage("Aktarım durduruldu."); return; }
    runningRef.current = true; setRunning(true);
    let done = 0;
    while (runningRef.current) {
      try {
        const data = await send({ action: "run", limit: batchSize, publish });
        setStats(data.stats);
        done += data.processed ?? 0;
        setMessage(`Aktarım sürüyor… bu turda ${done} adres işlendi, kuyrukta ${data.stats.pending} kaldı.`);
        if (!data.processed) break;
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Aktarım durdu.");
        break;
      }
    }
    runningRef.current = false; setRunning(false);
    await load();
    setMessage((current) => `${current} Aktarım tamamlandı.`);
  }

  async function retryFailed() {
    setBusy(true);
    try {
      const data = await send({ action: "retry" });
      setStats(data.stats);
      setMessage(`${data.requeued} hatalı kayıt yeniden kuyruğa alındı.`);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Tekrar denenemedi.");
    }
    setBusy(false);
  }

  const progress = stats.total ? Math.round(((stats.imported + stats.skipped) / stats.total) * 100) : 0;

  return (
    <div className="import-layout">
      <section className="newsroom-card">
        <div className="card-title">
          <div><span>ESKİ SİTE KÖPRÜSÜ</span><h2>kozatv.com.tr arşiv aktarımı</h2><p>Eski sitenin sitemap dosyaları taranır, her haber başlık, spot, tam metin, kategori, yazar, tarih ve kapak görseliyle aktarılır. Eski adres yeni habere kalıcı olarak yönlendirilir.</p></div>
        </div>

        <div className="import-stats">
          <article><span>Keşfedilen</span><strong>{stats.total}</strong><small>eski haber adresi</small></article>
          <article><span>Aktarılan</span><strong>{stats.imported}</strong><small>haber yeni sitede</small></article>
          <article><span>Kuyrukta</span><strong>{stats.pending}</strong><small>bekleyen adres</small></article>
          <article className={stats.failed ? "accent" : ""}><span>Hata / atlanan</span><strong>{stats.failed + stats.skipped}</strong><small>{stats.failed} hata · {stats.skipped} atlandı</small></article>
        </div>

        {stats.total > 0 && (
          <div className="import-progress"><div style={{ width: `${progress}%` }} /><span>{stats.imported + stats.skipped} / {stats.total} tamamlandı (%{progress})</span></div>
        )}

        {canEdit && (
          <div className="import-actions">
            <button type="button" onClick={discover} disabled={busy || running}>1 · Eski siteyi tara</button>
            <button type="button" onClick={runOnce} disabled={busy || running || !stats.pending}>2 · {batchSize} haber aktar</button>
            <button type="button" className={running ? "danger" : "primary"} onClick={runContinuous} disabled={busy || (!stats.pending && !running)}>{running ? "■ Aktarımı durdur" : "▶ Tümünü aktar"}</button>
            {stats.failed > 0 && <button type="button" onClick={retryFailed} disabled={busy || running}>Hatalıları tekrar dene</button>}
          </div>
        )}

        {canEdit && (
          <div className="import-options">
            <label>
              <input type="checkbox" aria-label="Doğrudan yayında aktar" checked={publish} disabled={running} onChange={(event) => setPublish(event.target.checked)} />
              <span><strong>Doğrudan yayında aktar</strong><small>Kapalıyken haberler taslak olarak gelir ve editör onayıyla yayına alınır. Arşivin sitede hemen görünmesi için açın; özgün yayın tarihleri korunur.</small></span>
            </label>
            <label className="import-batch">
              <span>Parti büyüklüğü</span>
              <select aria-label="Parti büyüklüğü" value={batchSize} disabled={running} onChange={(event) => setBatchSize(Number(event.target.value))}>
                {[5, 10, 20, 30, 50].map((size) => <option value={size} key={size}>{size} haber</option>)}
              </select>
            </label>
          </div>
        )}

        {message && <div className={message.includes("okunamadı") || message.includes("tamamlanamadı") || message.includes("durdu") ? "newsroom-message error" : "newsroom-message"}>{message}</div>}
      </section>

      <aside className="newsroom-card import-log">
        <span>SON İŞLEMLER</span>
        <h2>Aktarım kaydı</h2>
        {items.length ? items.map((item) => (
          <div className={`import-row status-${item.status}`} key={item.id}>
            <b>{statusLabels[item.status] ?? item.status}</b>
            <div>
              <strong>{item.title || item.sourcePath}</strong>
              <small>{item.sourcePath}</small>
              {item.message && <em>{item.message}</em>}
            </div>
            <time>{stamp(item.processedAt)}</time>
          </div>
        )) : <div className="empty-state">Henüz aktarım yapılmadı. &quot;Eski siteyi tara&quot; ile başlayın.</div>}
      </aside>
    </div>
  );
}
