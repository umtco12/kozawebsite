"use client";

import { useRef, useState } from "react";

/* Yayın kaynağı tanımlanmadıysa oynatıcı sahte bir yayın göstermez; kesinti ekranı gösterilir. */
export function LivePlayer({ src, poster }: { src: string; poster: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);
  const [failed, setFailed] = useState(false);

  if (!src) {
    return (
      <div className="live-frame live-offline" role="status">
        <img src={poster} alt="Koza TV stüdyosu" />
        <div>
          <span>YAYIN KAYNAĞI TANIMLI DEĞİL</span>
          <strong>Web canlı yayın adresi henüz sisteme girilmedi.</strong>
          <p>Yayın sağlayıcısından alınan HLS adresi tanımlandığında bu alan gerçek oynatıcıya döner. Şu anda uydu ve platform üzerinden izlemeye devam edebilirsiniz.</p>
        </div>
      </div>
    );
  }

  async function start() {
    setFailed(false);
    setStarted(true);
    try {
      await videoRef.current?.play();
    } catch {
      setFailed(true);
    }
  }

  return (
    <div className="live-frame">
      <video ref={videoRef} poster={poster} controls={started} playsInline preload="none" onError={() => setFailed(true)}>
        <source src={src} type="application/vnd.apple.mpegurl" />
        <track kind="captions" src="/empty-captions.vtt" srcLang="tr" label="Altyazı yok" default />
      </video>
      {!started && <button onClick={start} aria-label="Canlı yayını başlat">▶</button>}
      {failed && <p className="live-error" role="alert">Yayın şu anda açılamadı. Sayfayı yenileyebilir veya uydu/platform üzerinden izlemeye devam edebilirsiniz.</p>}
    </div>
  );
}
