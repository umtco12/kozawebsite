"use client";

import { useEffect, useState } from "react";
import { selectBroadcastWindow } from "../db/broadcast-schedule.mjs";

type ScheduleRow = { time: string; title: string; host: string };

export function BroadcastStrip({ schedule, initialNow }: { schedule: ScheduleRow[]; initialNow: number }) {
  const [now, setNow] = useState(initialNow);
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
  const items = selectBroadcastWindow(schedule, now);

  return (
    <section className="broadcast-strip" aria-label="Yayın akışı">
      <header className="broadcast-strip-head">
        <div><span>KOZA TV</span><h2>Yayın Akışı</h2></div>
        <a href="/canli#yayin-akisi">Tüm akış <span aria-hidden="true">↗</span></a>
      </header>
      {items.length ? <>
        <span className="broadcast-strip-summary" aria-live="polite">Yayın akışına göre şu anda: {items[0].title}</span>
        <ol className="broadcast-programs" aria-label="Programlar; diğer yayınları görmek için yatay kaydırın">
          {items.map((item, index) => (
            <li className={index === 0 ? "is-current" : ""} key={item.time}>
              <a href={index === 0 ? "/canli" : "/canli#yayin-akisi"} aria-current={index === 0 ? "time" : undefined} title={`${item.title}${item.host ? ` · ${item.host}` : ""}`}>
                <div className="broadcast-program-time"><time dateTime={item.time}>{item.time}</time><span>{index === 0 ? "ŞU ANDA" : item.dayOffset > 0 ? "YARIN" : index === 1 ? "SIRADAKİ" : "DAHA SONRA"}</span></div>
                <h3>{item.title}</h3>
                <div className="broadcast-program-bottom"><small>{item.host || "Koza TV"}</small>{index === 0 && <b><i aria-hidden="true">▶</i> İzle</b>}</div>
                {index === 0 && <span className="broadcast-program-progress" aria-hidden="true"><span style={{ width: `${item.progress * 100}%` }} /></span>}
              </a>
            </li>
          ))}
        </ol>
      </> : <p className="broadcast-strip-empty">Yayın akışı henüz eklenmedi. <a href="/canli">Canlı yayına geç →</a></p>}
    </section>
  );
}
