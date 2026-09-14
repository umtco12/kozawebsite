"use client";

import { useState } from "react";

export function VideoThumbnail({ src, alt, fallbackSrc = "/news/gorsel-yok.svg" }: { src: string; alt: string; fallbackSrc?: string }) {
  const [failedUrls, setFailedUrls] = useState<string[]>([]);
  const currentSrc = [src, fallbackSrc, "/news/gorsel-yok.svg"].find((url) => !failedUrls.includes(url)) ?? "/news/gorsel-yok.svg";
  return <img src={currentSrc} alt={alt} loading="lazy" onError={() => setFailedUrls((previous) => previous.includes(currentSrc) ? previous : [...previous, currentSrc])} />;
}
