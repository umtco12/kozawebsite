"use client";

import { useRef, useState } from "react";

/* Yayın kaynağı tanımlanmadıysa oynatıcı sahte bir yayın göstermez; kesinti ekranı gösterilir.
   Ana kaynak açılmazsa yönetim panelinde tanımlı yedek kaynağa geçilir. */
export function LivePlayer({ src, backupSrc = "", poster }: { src: string; backupSrc?: string; poster: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);
  const [usingBackup, setUsingBackup] = useState(false);
  const [failed, setFailed] = useState(false);

  if (!src) {
    return (
      <div className="live-frame live-offline" role="status">
        <img src={poster} alt="Koza TV stüdyosu" />
        <div>
          <span>YAYIN KAYNAĞI TANIMLI DEĞİL</span>
          <strong>Web canlı yayın adresi henüz sisteme girilmedi.</strong>
          <p>Yönetim panelindeki Site Ayarları ekranına canlı yayın HLS adresi girildiğinde bu alan gerçek oynatıcıya döner. Şu anda uydu ve platform üzerinden izlemeye devam edebilirsiniz.</p>
        </div>
      </div>
    );
  }

  const activeSrc = usingBackup ? backupSrc : src;

  async function start() {
    setFailed(false);
    setStarted(true);
    try {
      await videoRef.current?.play();
    } catch {
      handleFailure();
    }
  }

  /* Ana kaynak açılmazsa bir kez yedek kaynağa geçilir; o da açılmazsa okura durum bildirilir. */
  function handleFailure() {
    if (!usingBackup && backupSrc) {
      setUsingBackup(true);
      window.setTimeout(() => { void videoRef.current?.play().catch(() => setFailed(true)); }, 100);
      return;
    }
    setFailed(true);
  }

  return (
    <div className="live-frame">
      <video ref={videoRef} key={activeSrc} poster={poster} controls={started} playsInline preload="none" onError={handleFailure}>
        <source src={activeSrc} type="application/vnd.apple.mpegurl" />
        <track kind="captions" src="/empty-captions.vtt" srcLang="tr" label="Altyazı yok" default />
      </video>
      {!started && <button onClick={start} aria-label="Canlı yayını başlat">▶</button>}
      {usingBackup && !failed && <p className="live-note" role="status">Yedek yayın kaynağı kullanılıyor.</p>}
      {failed && <p className="live-error" role="alert">Yayın şu anda açılamadı. Sayfayı yenileyebilir veya uydu/platform üzerinden izlemeye devam edebilirsiniz.</p>}
    </div>
  );
}
