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
  imageAlt: string;
  href?: string;
  published?: string;
};

const ROTATION_MS = 6000;

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
  const slides = items.filter((item) => item?.title && item?.image);
  const [active, setActive] = useState(0);
  const [pausedByUser, setPausedByUser] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener?.("change", update);
    return () => media.removeEventListener?.("change", update);
  }, []);

  const paused = pausedByUser || interacting || reducedMotion;

  useEffect(() => {
    if (paused || slides.length < 2) return;
    const id = window.setTimeout(() => setActive((value) => (value + 1) % slides.length), ROTATION_MS);
    return () => window.clearTimeout(id);
  }, [active, paused, slides.length]);

  if (!slides.length) return null;

  const item = slides[active] ?? slides[0];
  const previous = () => setActive((value) => (value - 1 + slides.length) % slides.length);
  const next = () => setActive((value) => (value + 1) % slides.length);

  return (
    <section
      className="lead"
      aria-roledescription="carousel"
      aria-label="Koza TV manşet haberleri"
      data-autoplay={!paused && slides.length > 1 ? "true" : "false"}
      onMouseEnter={() => setInteracting(true)}
      onMouseLeave={() => setInteracting(false)}
      onFocusCapture={() => setInteracting(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setInteracting(false);
      }}
    >
      <div className="lead-slides" aria-hidden="true">
        {slides.map((slide, index) => (
          <img
            className={index === active ? "lead-slide active" : "lead-slide"}
            src={slide.image}
            alt=""
            loading={index === 0 ? "eager" : "lazy"}
            fetchPriority={index === 0 ? "high" : "auto"}
            key={`${slide.href}-${slide.image}`}
          />
        ))}
      </div>
      <div className="lead-shade" />
      <div className="lead-copy" key={item.href} aria-live={pausedByUser ? "polite" : "off"}>
        <div className="lead-eyebrow"><span>{item.category}</span><b>KOZA TV MANŞET</b></div>
        <h1><a href={item.href ?? "/son-dakika"}>{item.title}</a></h1>
        <p>{item.summary}</p>
        <div className="lead-meta">
          <time>{item.published ?? "Koza TV Haber Merkezi"}</time>
          <a className="lead-read" href={item.href ?? "/son-dakika"}>Haberi oku <span aria-hidden="true">↗</span></a>
        </div>
      </div>
      <div className="slider-dock">
        <div className="slider-count">
          <strong>{String(active + 1).padStart(2, "0")}</strong>
          <span>/ {String(slides.length).padStart(2, "0")}</span>
        </div>
        <div className="slider-progress" aria-hidden="true">
          <i key={`${active}-${paused}`} className={paused ? "paused" : ""} />
        </div>
        <div className="slider-controls" aria-label="Manşet kontrolleri">
          <button className="slider-arrow" onClick={previous} aria-label="Önceki manşet">←</button>
          <div className="slider-dots" aria-label="Manşet seçimi">
          {slides.map((slide, index) => (
            <button
              key={slide.href ?? index}
              aria-pressed={index === active}
              className={index === active ? "active" : ""}
              onClick={() => setActive(index)}
              aria-label={`${index + 1}. manşeti göster`}
            >{String(index + 1).padStart(2, "0")}</button>
          ))}
          </div>
          <button className="slider-arrow" onClick={next} aria-label="Sonraki manşet">→</button>
          {slides.length > 1 && !reducedMotion && (
            <button
              className="slider-pause"
              onClick={() => setPausedByUser((value) => !value)}
              aria-pressed={pausedByUser}
              aria-label={pausedByUser ? "Otomatik geçişi sürdür" : "Otomatik geçişi duraklat"}
            >
              <span aria-hidden="true">{pausedByUser ? "▶" : "Ⅱ"}</span>
            </button>
          )}
        </div>
      </div>
    </section>
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
