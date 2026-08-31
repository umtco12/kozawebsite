"use client";

import { useState } from "react";

export function AdImage({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  const [failedSrc, setFailedSrc] = useState("");
  if (failedSrc === src) return <span className={`ad-image-fallback ${className}`.trim()} aria-hidden={alt ? undefined : true} aria-label={alt ? `${alt} yüklenemedi` : undefined}><b>KT</b><small>Görsel yüklenemedi</small></span>;
  return <img className={className} src={src} alt={alt} loading="lazy" onError={() => setFailedSrc(src)} />;
}
