"use client";

import { useEffect, useRef, useState } from "react";

export function LiveData() {
  const [weather, setWeather] = useState("İstanbul 27°");
  const [rates, setRates] = useState({ USD: "41,12", EUR: "48,06", GBP: "55,74" });

  useEffect(() => {
    fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=41.01&longitude=28.97&current=temperature_2m&timezone=Europe%2FIstanbul",
    )
      .then((response) => response.json())
      .then((data) => setWeather(`İstanbul ${Math.round(data.current.temperature_2m)}°`))
      .catch(() => {});

    fetch("https://api.frankfurter.app/latest?from=TRY&to=USD,EUR,GBP")
      .then((response) => response.json())
      .then((data) =>
        setRates({
          USD: (1 / data.rates.USD).toFixed(2).replace(".", ","),
          EUR: (1 / data.rates.EUR).toFixed(2).replace(".", ","),
          GBP: (1 / data.rates.GBP).toFixed(2).replace(".", ","),
        }),
      )
      .catch(() => {});
  }, []);

  return (
    <div className="live-data">
      <span>☀ {weather}</span>
      <span>$ {rates.USD} <b>↑</b></span>
      <span>€ {rates.EUR} <b>↑</b></span>
      <span>£ {rates.GBP}</span>
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
