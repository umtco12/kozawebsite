"use client";

import { useCallback, useEffect, useState } from "react";

type Level = "healthy" | "warning" | "critical";
type StatusPayload = {
  overall: Level;
  generatedAt: number;
  thresholds: { diskWarningPercent: number; diskCriticalPercent: number };
  disk: { status: Level; totalBytes: number; usedBytes: number; freeBytes: number; usedPercent: number };
  database: { status: Level; engine: string; sizeBytes: number; latencyMs: number; articleCount: number; mediaRecordCount: number };
  media: { status: Level; recordCount: number; fileCount: number | null; storedBytes: number };
  backup: { status: Level; lastCompletedAt: number | null; ageMs: number | null };
  restore: { status: Level; lastTestedAt: number | null; ageMs: number | null; articleCount: number | null; mediaRecordCount: number | null; mediaFileCount: number | null };
  monitor: { status: Level; lastCheckedAt: number | null; ageMs: number | null; services: { postgresql: boolean; application: boolean; proxy: boolean } };
};

const labels: Record<Level, string> = { healthy: "Normal", warning: "Kontrol gerekli", critical: "Kritik" };

function formatBytes(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "—";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let amount = value; let unit = 0;
  while (amount >= 1024 && unit < units.length - 1) { amount /= 1024; unit += 1; }
  return `${amount >= 100 || unit === 0 ? Math.round(amount) : amount.toFixed(1)} ${units[unit]}`;
}

function formatDate(value: number | null) {
  return value ? new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Istanbul" }).format(value) : "Henüz doğrulanmadı";
}

function formatAge(value: number | null) {
  if (value == null) return "ölçüm yok";
  const minutes = Math.max(0, Math.round(value / 60_000));
  if (minutes < 60) return `${minutes} dakika önce`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours} saat önce`;
  return `${Math.round(hours / 24)} gün önce`;
}

function Badge({ level }: { level: Level }) { return <span className={`system-status-badge ${level}`}>{labels[level]}</span>; }

export function SystemStatusPanel() {
  const [status, setStatus] = useState<StatusPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/system-status", { cache: "no-store" });
      if (!response.ok) throw new Error(response.status === 403 ? "Bu ekran yalnız yönetici hesabına açıktır." : "Sistem bilgileri alınamadı.");
      setStatus(await response.json());
    } catch (reason) {
      setError(reason instanceof TypeError ? "Sunucuya bağlanılamadı. Bağlantıyı kontrol edip yeniden deneyin." : reason instanceof Error ? reason.message : "Sistem bilgileri alınamadı.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const first = window.setTimeout(load, 0);
    const timer = window.setInterval(load, 60_000);
    const refreshWhenVisible = () => { if (document.visibilityState === "visible") void load(); };
    window.addEventListener("online", load); document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => { window.clearTimeout(first); window.clearInterval(timer); window.removeEventListener("online", load); document.removeEventListener("visibilitychange", refreshWhenVisible); };
  }, [load]);

  if (!status && loading) return <section className="system-status-loading" aria-live="polite">Sunucu durumu okunuyor…</section>;
  if (!status) return <section className="system-status-error" role="alert"><b>Sistem durumu açılamadı</b><p>{error}</p><button type="button" onClick={() => void load()}>Yeniden dene</button></section>;

  const overallText = status.overall === "healthy" ? "Yayın altyapısı normal çalışıyor"
    : status.overall === "warning" ? "Bazı kontroller için dikkat gerekiyor" : "Kritik bir sistem kontrolü başarısız";
  const serviceCount = Object.values(status.monitor.services).filter(Boolean).length;

  return <div className="system-status-panel" aria-busy={loading}>
    <section className={`system-status-summary ${status.overall}`}>
      <div><span>SİSTEM ÖZETİ</span><h2>{overallText}</h2><p>Disk, PostgreSQL, medya dosyaları ve yedekler salt okunur olarak izlenir. Bu ekran hiçbir bakım komutu çalıştırmaz.</p></div>
      <div className="system-status-actions"><Badge level={status.overall} /><button type="button" disabled={loading} onClick={() => void load()}>{loading ? "Yenileniyor…" : "Şimdi yenile"}</button><small>Son ekran kontrolü: {formatDate(status.generatedAt)}</small></div>
    </section>
    {error && <div className="system-status-inline-error" role="status">Son yenileme başarısız: {error}. Önceki ölçüm gösteriliyor.</div>}

    <div className="system-status-grid">
      <article className={`system-status-card ${status.disk.status}`}><header><span>DEPOLAMA</span><Badge level={status.disk.status} /></header><h3>Disk alanı</h3><strong>%{status.disk.usedPercent} dolu</strong><progress max="100" value={status.disk.usedPercent} aria-label={`Disk yüzde ${status.disk.usedPercent} dolu`} /><p><b>{formatBytes(status.disk.freeBytes)}</b> boş · {formatBytes(status.disk.totalBytes)} toplam</p><small>Erken uyarı %{status.thresholds.diskWarningPercent}, kritik sınır %{status.thresholds.diskCriticalPercent}.</small></article>

      <article className={`system-status-card ${status.database.status}`}><header><span>VERİ KATMANI</span><Badge level={status.database.status} /></header><h3>Veritabanı</h3><strong>{status.database.engine}</strong><p><b>{status.database.articleCount.toLocaleString("tr-TR")}</b> haber · {formatBytes(status.database.sizeBytes)}</p><small>Sorgu yanıtı {status.database.latencyMs.toLocaleString("tr-TR")} ms. Bağlantı bilgileri güvenlik için gösterilmez.</small></article>

      <article className={`system-status-card ${status.media.status}`}><header><span>DOSYA EŞLEŞMESİ</span><Badge level={status.media.status} /></header><h3>Medya arşivi</h3><strong>{status.media.recordCount.toLocaleString("tr-TR")} kayıt</strong><p><b>{status.media.fileCount == null ? "—" : status.media.fileCount.toLocaleString("tr-TR")}</b> fiziksel dosya · {formatBytes(status.media.storedBytes)}</p><small>Dosya sayısı kayıt sayısından azsa kritik alarm oluşur.</small></article>

      <article className={`system-status-card ${status.backup.status}`}><header><span>VERİ KORUMA</span><Badge level={status.backup.status} /></header><h3>Günlük yedek</h3><strong>{formatAge(status.backup.ageMs)}</strong><p>{formatDate(status.backup.lastCompletedAt)}</p><small>PostgreSQL dökümü, medya arşivi ve SHA-256 doğrulaması birlikte aranır.</small></article>

      <article className={`system-status-card ${status.restore.status}`}><header><span>FELAKET KURTARMA</span><Badge level={status.restore.status} /></header><h3>Geri yükleme testi</h3><strong>{formatAge(status.restore.ageMs)}</strong><p>{formatDate(status.restore.lastTestedAt)}</p><small>{status.restore.mediaFileCount == null ? "Aylık gerçek geri yükleme sonucu henüz panele bağlanmadı." : `${status.restore.articleCount?.toLocaleString("tr-TR")} haber ve ${status.restore.mediaFileCount.toLocaleString("tr-TR")} dosya geri yüklendi.`}</small></article>

      <article className={`system-status-card ${status.monitor.status}`}><header><span>OTOMATİK DENETİM</span><Badge level={status.monitor.status} /></header><h3>5 dakikalık sağlık kontrolü</h3><strong>{formatAge(status.monitor.ageMs)}</strong><p><b>{serviceCount}/3</b> servis doğrulandı</p><small>Uygulama, PostgreSQL, web proxy, ziyaretçi sayfası ve yetkisiz oturum sözleşmesi birlikte sınanır.</small></article>
    </div>

    <section className="system-status-guide"><div><span>NE ZAMAN HAREKETE GEÇMELİ?</span><h3>Renkleri böyle okuyun</h3></div><ul><li><i className="healthy" /> <b>Normal:</b> yayın akışı güvenli sınırlar içinde.</li><li><i className="warning" /> <b>Kontrol gerekli:</b> kapasiteyi veya zamanlayıcıyı aynı gün inceleyin.</li><li><i className="critical" /> <b>Kritik:</b> yeni medya yüklemeyi durdurup teknik sorumluya haber verin.</li></ul></section>
  </div>;
}
