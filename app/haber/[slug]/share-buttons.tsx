"use client";

import { useState } from "react";
import { SocialIcon } from "../../social-icon";

/* Haber paylaşım kontrolleri: gerçek paylaşım adresleri ve bağlantı kopyalama. */
export function ShareButtons({ url, title, variant = "rail" }: { url: string; title: string; variant?: "rail" | "inline" }) {
  const [copied, setCopied] = useState(false);
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const targets = [
    { platform: "Facebook", label: "Facebook'ta paylaş", href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}` },
    { platform: "X", label: "X'te paylaş", href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}` },
    { platform: "WhatsApp", label: "WhatsApp'ta paylaş", href: `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}` },
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
        <a href={target.href} key={target.platform} data-share={target.platform} target="_blank" rel="noreferrer" aria-label={target.label}>
          <SocialIcon label={target.platform} />
        </a>
      ))}
      <button type="button" onClick={copyLink} aria-label="Haber bağlantısını kopyala">{copied ? "✓" : "↗"}</button>
    </div>
  );
}
