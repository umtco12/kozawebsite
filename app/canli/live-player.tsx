"use client";

import { useRef, useState } from "react";

export type LiveSource = { kind: "none" | "youtube" | "hls" | "invalid"; embedUrl?: string; src?: string; reason?: string };

/* Canlı yayın oynatıcısı. Kaynak YouTube ise gömülü oynatıcı, HLS ise video etiketi kullanılır.
   Kaynak tanımlı değilse sahte yayın gösterilmez; kesinti ekranı çıkar. */
export function LivePlayer({ source, backup, poster }: { source: LiveSource; backup: LiveSource; poster: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);
  const [usingBackup, setUsingBackup] = useState(false);
  const [failed, setFailed] = useState(false);

  const active = usingBackup && backup.kind !== "none" && backup.kind !== "invalid" ? backup : source;
  const canFallBack = !usingBackup && (backup.kind === "youtube" || backup.kind === "hls");

  if (active.kind === "none" || active.kind === "invalid") {
    return (
      <div className="live-frame live-offline" role="status">
        <img src={poster} alt="Koza TV stüdyosu" />
        <div>
          <span>YAYIN KAYNAĞI TANIMLI DEĞİL</span>
          <strong>Web canlı yayın adresi henüz sisteme girilmedi.</strong>
          <p>Yönetim panelindeki Site Ayarları ekranına YouTube canlı yayın bağlantısı veya HLS adresi girildiğinde bu alan gerçek oynatıcıya döner. Şu anda uydu ve platform üzerinden izlemeye devam edebilirsiniz.</p>
        </div>
      </div>
    );
  }

  /* YouTube yayınının bant genişliği maliyeti yoktur ve kalite uyarlaması hazır gelir. */
  if (active.kind === "youtube") {
    return (
      <div className="live-frame live-embed">
        <iframe
          src={active.embedUrl}
          title="Koza TV canlı yayın"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
        {usingBackup && <p className="live-note" role="status">Yedek yayın kaynağı kullanılıyor.</p>}
      </div>
    );
  }

  async function start() {
    setFailed(false);
    setStarted(true);
    try {
      await videoRef.current?.play();
    } catch {
      handleFailure();
    }
  }

  function handleFailure() {
    if (canFallBack) {
      setUsingBackup(true);
      window.setTimeout(() => { void videoRef.current?.play().catch(() => setFailed(true)); }, 100);
      return;
    }
    setFailed(true);
  }

  return (
    <div className="live-frame">
      <video ref={videoRef} key={active.src} poster={poster} controls={started} playsInline preload="none" onError={handleFailure}>
        <source src={active.src} type="application/vnd.apple.mpegurl" />
        <track kind="captions" src="/empty-captions.vtt" srcLang="tr" label="Altyazı yok" default />
      </video>
      {!started && <button onClick={start} aria-label="Canlı yayını başlat">▶</button>}
      {usingBackup && !failed && <p className="live-note" role="status">Yedek yayın kaynağı kullanılıyor.</p>}
      {failed && <p className="live-error" role="alert">Yayın şu anda açılamadı. Sayfayı yenileyebilir veya uydu/platform üzerinden izlemeye devam edebilirsiniz.</p>}
    </div>
  );
}
