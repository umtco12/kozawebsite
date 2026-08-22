"use client";

import { useEffect, useRef, useState } from "react";

type MarketData = {
  ok: boolean;
  rates: { code: string; label: string; value: string }[];
  rateSource: string;
  rateDate: string;
  weather: { label: string; value: string } | null;
};

/* Döviz ve hava durumu sunucu tarafında TCMB ve açık hava durumu servisinden okunur.
   Veri alınamazsa gösterge hiç çizilmez; okura sabit ya da eski değer gösterilmez. */
export function LiveData() {
  const [data, setData] = useState<MarketData | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/piyasa")
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: MarketData | null) => { if (!cancelled && payload?.ok) setData(payload); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  if (!data) return <div className="live-data" aria-hidden="true" />;

  const rateTitle = data.rateSource && data.rateDate ? `${data.rateSource} döviz satış kuru · ${data.rateDate}` : undefined;

  return (
    <div className="live-data">
      {data.weather && <span>☀ {data.weather.label} {data.weather.value}</span>}
      {data.rates.map((rate) => (
        <span key={rate.code} title={rateTitle}>{rate.label} {rate.value}</span>
      ))}
      {data.rateSource && <small className="live-data-source">{data.rateSource}</small>}
    </div>
  );
}

type Lead = {
  category: string;
  title: string;
  summary: string;
  image: string;
  href?: string;
  published?: string;
};

/* Arama, tarayıcının kendi GET gönderimini kullanır; JavaScript yüklenmese de çalışır. */
export function SearchBox() {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <form className={open ? "nav-search open" : "nav-search"} action="/arama" method="get" role="search">
      <input ref={inputRef} type="search" name="q" placeholder="Haberlerde ara…" aria-label="Haberlerde ara" minLength={2} required />
      <button
        type="submit"
        onClick={(event) => {
          if (open) return;
          event.preventDefault();
          setOpen(true);
          window.setTimeout(() => inputRef.current?.focus(), 60);
        }}
        aria-label={open ? "Aramayı başlat" : "Arama alanını aç"}
      >
        ⌕
      </button>
    </form>
  );
}

export function LeadSlider({ items }: { items: Lead[] }) {
  const [slides] = useState(items);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setActive((value) => (value + 1) % slides.length),
      6500,
    );
    return () => clearInterval(id);
  }, [slides.length]);

  const item = slides[active] ?? items[0];

  return (
    <article className="lead">
      <img src={item.image} alt="" />
      <div className="lead-shade" />
      <div className="lead-copy">
        <span>{item.category}</span>
        <h1><a href={item.href ?? "/son-dakika"}>{item.title}</a></h1>
        <p>{item.summary}</p>
        <time>{item.published ?? "Koza TV Haber Merkezi"}</time>
      </div>
      <div className="slider-controls">
        <button
          onClick={() => setActive((active - 1 + slides.length) % slides.length)}
          aria-label="Önceki"
        >
          ←
        </button>
        <div>
          {slides.map((_, index) => (
            <button
              key={index}
              className={index === active ? "active" : ""}
              onClick={() => setActive(index)}
              aria-label={`${index + 1}. manşet`}
            />
          ))}
        </div>
        <button
          onClick={() => setActive((active + 1) % slides.length)}
          aria-label="Sonraki"
        >
          →
        </button>
      </div>
    </article>
  );
}

export function MobileMenu({ categories }: { categories: { name: string; slug: string }[] }) {
  const [open, setOpen] = useState(false);
  const mobileLinks = [["Ana Sayfa", "/"], ["Son Dakika", "/son-dakika"], ...categories.map((category) => [category.name, `/kategori/${category.slug}`]), ["Videolar", "/videolar"], ["Yazarlar", "/yazarlar"], ["Canlı Yayın", "/canli"], ["Arama", "/arama"], ["İletişim", "/kurumsal/iletisim"]];

  return (
    <>
      <button
        className="menu-button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label="Menüyü aç"
      >
        ☰
      </button>
      {open && (
        <div className="mobile-panel" id="mobile-menu">
          {mobileLinks.map(([label, href]) => (
            <a href={href} key={href} onClick={() => setOpen(false)}>
              {label}
            </a>
          ))}
        </div>
      )}
    </>
  );
}
