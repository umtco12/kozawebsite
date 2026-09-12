"use client";

import { useEffect, useRef, useState } from "react";
import { selectDailySchedule } from "../db/broadcast-schedule.mjs";

export type ScheduleRow = { time: string; end: string; title: string; host: string; image: string; days: string };
export type FlowItem = ScheduleRow & { state: "past" | "live" | "next" | "upcoming"; progress: number };
export type DailyFlow = { dayLabel: string; dayOffset: number; items: FlowItem[] };

/* Yalnız o an yayında olan program etiketlenir; biten ve sıradaki programlar sade kalır. */
const stateLabels: Record<string, string> = { live: "YAYINDA" };

/* Başlıktaki yayın akışı şeridi. Panelde tanımlı günlük akışı sunucu fotoğraflarıyla gösterir;
   yayındaki program dakika başında ve sekmeye dönüşte kendiliğinden güncellenir. */
export function BroadcastFlow({ schedule, initialNow }: { schedule: ScheduleRow[]; initialNow: number }) {
  const [now, setNow] = useState(initialNow);
  const listRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const refresh = () => {
      clearTimeout(timer);
      const current = Date.now();
      setNow(current);
      timer = setTimeout(refresh, 60_000 - current % 60_000);
    };
    const onVisible = () => { if (document.visibilityState === "visible") refresh(); };
    refresh();
    document.addEventListener("visibilitychange", onVisible);
    return () => { clearTimeout(timer); document.removeEventListener("visibilitychange", onVisible); };
  }, []);

  const { dayLabel, items } = selectDailySchedule(schedule, now) as DailyFlow;
  const live = items.find((item) => item.state === "live");
  const liveIndex = items.findIndex((item) => item.state === "live");

  /* Dar ekranda şerit yatay kayar; açılışta yayındaki program görünür olmalı. */
  useEffect(() => {
    const list = listRef.current;
    if (!list || liveIndex < 0) return;
    const card = list.children[liveIndex] as HTMLElement | undefined;
    if (!card || list.scrollWidth <= list.clientWidth) return;
    list.scrollLeft = Math.max(0, card.offsetLeft - (list.clientWidth - card.offsetWidth) / 2);
  }, [liveIndex]);

  if (!items.length) return null;

  return (
    <section className="flow-rail" aria-label="Yayın akışı">
      <span className="flow-rail-status" aria-live="polite">
        {live ? `Yayın akışına göre şu anda: ${live.title}` : `Yayın akışı: ${dayLabel}`}
      </span>
      {/* Şeridin ne olduğunu söyleyen ince dikey etiket; kart genişliğinden neredeyse hiç almaz. */}
      <span className="flow-rail-label" aria-hidden="true">Yayın Akışı</span>
      <ol className="flow-rail-list" ref={listRef} aria-label="Günün programları; tamamı için yatay kaydırın">
        {items.map((item) => (
          <li className={`flow-card flow-card-${item.state}`} key={`${item.days}-${item.time}`}>
            <a
              href={item.state === "live" ? "/canli" : "/canli#yayin-akisi"}
              aria-current={item.state === "live" ? "time" : undefined}
              title={`${item.time} – ${item.end} ${item.title}${item.host ? ` · ${item.host}` : ""}`}
            >
              {/* Fotoğrafın üzerinde yazı durmaz; program bilgisi altındaki kendi bandındadır. */}
              <span className="flow-card-frame">
                {item.image
                  ? <img className="flow-card-photo" src={item.image} alt="" loading="lazy" decoding="async" width={480} height={640} />
                  : <span className="flow-card-photo-empty" aria-hidden="true">KOZA TV</span>}
              </span>
              <span className="flow-card-foot">
                <strong>{item.title}</strong>
                <small>{item.host || "Koza TV"}</small>
                {/* Kartta yalnız başlangıç saati durur; tam aralık ipucu metninde ve /canli listesindedir. */}
                <span className="flow-card-clock">
                  <time dateTime={item.time}>{item.time}</time>
                  {stateLabels[item.state] ? <b>{stateLabels[item.state]}</b> : null}
                </span>
              </span>
              {item.state === "live" ? (
                <span className="flow-card-progress" aria-hidden="true"><span style={{ width: `${Math.round(item.progress * 100)}%` }} /></span>
              ) : null}
            </a>
          </li>
        ))}
      </ol>
    </section>
  );
}
