"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

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
};

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
        <h1><Link href={item.href ?? "#gundem"}>{item.title}</Link></h1>
        <p>{item.summary}</p>
        <time>20 Ağustos 2026 • 14:20</time>
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

const mobileLinks = [
  ["Ana Sayfa", "/"],
  ["Son Dakika", "/#sondakika"],
  ["Gündem", "/#gundem"],
  ["Siyaset", "/#siyaset"],
  ["Ekonomi", "/#ekonomi"],
  ["Spor", "/#spor"],
  ["Dünya", "/#dunya"],
  ["Video", "/#video"],
  ["Yazarlar", "/yazarlar"],
];

export function MobileMenu() {
  const [open, setOpen] = useState(false);

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
            <Link href={href} key={href} onClick={() => setOpen(false)}>
              {label}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
