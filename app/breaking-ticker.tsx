"use client";

import { useEffect, useState } from "react";
import { displayTitle } from "../db/title-model.mjs";
import { BREAKING_REFRESH_MS, BREAKING_ROTATION_MS, createBreakingRefresh } from "./breaking-news-refresh.mjs";
import { nextBreakingId, reconcileBreakingId } from "./breaking-ticker-model.mjs";

type BreakingItem = { id: number; slug: string; title: string; publishedAt: number | null };

function clock(value: number | null) {
  if (!value) return "Şimdi";
  return new Intl.DateTimeFormat("tr-TR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Istanbul" }).format(value);
}

export function BreakingTicker({ initialItems }: { initialItems: BreakingItem[] }) {
  const [items, setItems] = useState(initialItems);
  const [activeId, setActiveId] = useState<number | null>(initialItems[0]?.id ?? null);
  const [interacting, setInteracting] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener?.("change", update);
    return () => media.removeEventListener?.("change", update);
  }, []);

  useEffect(() => {
    const refresher = createBreakingRefresh({
      endpoint: "/api/breaking-ticker",
      onItems(next: BreakingItem[]) {
        setItems(next);
        setActiveId((current) => reconcileBreakingId(next, current));
      },
    });
    const refresh = () => { if (!document.hidden) void refresher.refresh(); };
    refresh();
    const timer = window.setInterval(refresh, BREAKING_REFRESH_MS);
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("online", refresh);
    return () => {
      window.clearInterval(timer);
      refresher.stop();
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("online", refresh);
    };
  }, []);

  useEffect(() => {
    if (interacting || reducedMotion || items.length < 2) return;
    const timer = window.setTimeout(() => setActiveId((current) => nextBreakingId(items, current)), BREAKING_ROTATION_MS);
    return () => window.clearTimeout(timer);
  }, [activeId, interacting, items, reducedMotion]);

  const activeIndex = Math.max(0, items.findIndex((item) => item.id === activeId));
  const active = items[activeIndex];
  if (!active) return null;

  return (
    <section
      className="breaking"
      id="sondakika"
      aria-label={`Son dakika haberleri, ${activeIndex + 1}/${items.length}`}
      aria-roledescription="dönen haber şeridi"
      data-active-id={active.id}
      data-autoplay={!interacting && !reducedMotion && items.length > 1 ? "true" : "false"}
      onMouseEnter={() => setInteracting(true)}
      onMouseLeave={() => setInteracting(false)}
      onFocusCapture={() => setInteracting(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setInteracting(false);
      }}
    >
      <a className="wrap breaking-inner" href={`/haber/${active.slug}`} key={active.id}>
        <strong><i /> SON DAKİKA</strong>
        <time dateTime={active.publishedAt ? new Date(active.publishedAt).toISOString() : undefined}>{clock(active.publishedAt)}</time>
        <p>{displayTitle(active.title)}</p>
        <b className="breaking-go">Habere git <span aria-hidden="true">→</span></b>
      </a>
    </section>
  );
}
