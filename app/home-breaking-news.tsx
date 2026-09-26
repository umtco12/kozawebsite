"use client";

import { useEffect, useRef, useState } from "react";
import { displayTitle } from "../db/title-model.mjs";
import { BREAKING_REFRESH_MS, createBreakingRefresh } from "./breaking-news-refresh.mjs";

/* Ana sayfadaki "HABER AKIŞI · Son Haberler" kutusu.
   Son dakika işaretine bakmaz: en son yayına alınan beş haberi yeniden eskiye sıralar.
   Yeni haber yayınlandığında en üste girer ve beşinci haber listeden düşer.
   Dosya ve sınıf adlarındaki "breaking" ilk sürümden kalmadır. */
type BreakingItem = { id: number; slug: string; title: string; publishedAt: number | null };
const timeOptions = { timeZone: "Europe/Istanbul" };
function newsTime(value: number | null) {
  if (!value) return { time: "—", date: "", full: "Yayın saati belirtilmedi", iso: undefined };
  return {
    time: new Intl.DateTimeFormat("tr-TR", { ...timeOptions, hour: "2-digit", minute: "2-digit" }).format(value),
    date: new Intl.DateTimeFormat("tr-TR", { ...timeOptions, day: "2-digit", month: "short" }).format(value),
    full: new Intl.DateTimeFormat("tr-TR", { ...timeOptions, dateStyle: "long", timeStyle: "short" }).format(value),
    iso: new Date(value).toISOString(),
  };
}

export function HomeBreakingNews({ initialItems }: { initialItems: BreakingItem[] }) {
  const [items, setItems] = useState(initialItems);
  const [announcement, setAnnouncement] = useState("");
  const region = useRef<HTMLElement>(null);
  const queued = useRef<BreakingItem[] | null>(null);
  function apply(next: BreakingItem[]) {
    setItems((previous) => {
      if (JSON.stringify(previous) === JSON.stringify(next)) return previous;
      return next;
    });
  }
  useEffect(() => {
    const refresher = createBreakingRefresh({ onItems(next: BreakingItem[]) {
      // Okur bir bağlantıda klavye odağı tutarken listeyi yerinden oynatma.
      if (region.current?.contains(document.activeElement)) queued.current = next;
      else { apply(next); setAnnouncement("Haber akışı güncellendi."); }
    } });
    const refresh = () => { if (!document.hidden) void refresher.refresh(); };
    const timer = setInterval(refresh, BREAKING_REFRESH_MS);
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("online", refresh);
    return () => { clearInterval(timer); refresher.stop(); document.removeEventListener("visibilitychange", refresh); window.removeEventListener("online", refresh); };
  }, []);
  return (
    <aside className="home-breaking-news" aria-labelledby="home-breaking-heading" ref={region} onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget) && queued.current) { apply(queued.current); queued.current = null; setAnnouncement("Haber akışı güncellendi."); }
    }}>
      <header><span className="home-breaking-kicker"><i aria-hidden="true" /> HABER AKIŞI</span><h2 id="home-breaking-heading">Son Haberler</h2></header>
      <ol>
        {items.map((article) => {
          const stamp = newsTime(article.publishedAt);
          return <li key={article.id}>
            <a href={`/haber/${article.slug}`} title={displayTitle(article.title)}>
              <time dateTime={stamp.iso} aria-label={stamp.full}><strong>{stamp.time}</strong><small>{stamp.date}</small></time>
              <h3>{displayTitle(article.title)}</h3>
              <span className="home-breaking-arrow" aria-hidden="true">↗</span>
            </a>
          </li>;
        })}
      </ol>
      {!items.length && <p className="home-breaking-empty">Yeni eklenen haberler burada görünecek.</p>}
      <a className="home-breaking-all" href="/son-dakika">Tüm haberleri gör <span aria-hidden="true">→</span></a>
      <span className="visually-hidden" role="status">{announcement}</span>
    </aside>
  );
}
