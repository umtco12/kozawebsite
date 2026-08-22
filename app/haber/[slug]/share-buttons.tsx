"use client";

import { useState } from "react";

/* Haber paylaşım kontrolleri: gerçek paylaşım adresleri ve bağlantı kopyalama. */
export function ShareButtons({ url, title, variant = "rail" }: { url: string; title: string; variant?: "rail" | "inline" }) {
  const [copied, setCopied] = useState(false);
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const targets = [
    { label: "Facebook'ta paylaş", short: "f", href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}` },
    { label: "X'te paylaş", short: "𝕏", href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}` },
    { label: "WhatsApp'ta paylaş", short: "◎", href: `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}` },
  ];

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className={variant === "rail" ? "article-share" : "share-buttons"}>
      {variant === "rail" && <span>PAYLAŞ</span>}
      {targets.map((target) => (
        <a href={target.href} key={target.label} target="_blank" rel="noreferrer" aria-label={target.label}>{target.short}</a>
      ))}
      <button type="button" onClick={copyLink} aria-label="Haber bağlantısını kopyala">{copied ? "✓" : "↗"}</button>
    </div>
  );
}
