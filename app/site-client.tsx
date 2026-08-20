"use client";
import { useEffect, useState } from "react";

export function LiveData(){
  const [weather,setWeather]=useState("İstanbul 27°");
  const [rates,setRates]=useState({USD:"41,12",EUR:"48,06",GBP:"55,74"});
  useEffect(()=>{
    fetch("https://api.open-meteo.com/v1/forecast?latitude=41.01&longitude=28.97&current=temperature_2m&timezone=Europe%2FIstanbul").then(r=>r.json()).then(d=>setWeather(`İstanbul ${Math.round(d.current.temperature_2m)}°`)).catch(()=>{});
    fetch("https://api.frankfurter.app/latest?from=TRY&to=USD,EUR,GBP").then(r=>r.json()).then(d=>setRates({USD:(1/d.rates.USD).toFixed(2).replace(".",","),EUR:(1/d.rates.EUR).toFixed(2).replace(".",","),GBP:(1/d.rates.GBP).toFixed(2).replace(".",",")})).catch(()=>{});
  },[]);
  return <div className="live-data"><span>☀ {weather}</span><span>$ {rates.USD} <b>↑</b></span><span>€ {rates.EUR} <b>↑</b></span><span>£ {rates.GBP}</span></div>
}

type Lead={category:string;title:string;summary:string;image:string};
export function LeadSlider({items}:{items:Lead[]}){
  const [slides,setSlides]=useState(items);
  const [active,setActive]=useState(0);
  useEffect(()=>{fetch("/api/content").then(r=>r.json()).then(d=>d.leads?.length&&setSlides(d.leads)).catch(()=>{})},[]);
  useEffect(()=>{const id=setInterval(()=>setActive(v=>(v+1)%slides.length),6500);return()=>clearInterval(id)},[slides.length]);
  const item=slides[active]??items[0];
  return <article className="lead"><img src={item.image} alt=""/><div className="lead-shade"/><div className="lead-copy"><span>{item.category}</span><h1>{item.title}</h1><p>{item.summary}</p><time>20 Ağustos 2026 • 14:20</time></div><div className="slider-controls"><button onClick={()=>setActive((active-1+slides.length)%slides.length)} aria-label="Önceki">←</button><div>{slides.map((_,i)=><button key={i} className={i===active?"active":""} onClick={()=>setActive(i)} aria-label={`${i+1}. manşet`}/>)}</div><button onClick={()=>setActive((active+1)%slides.length)} aria-label="Sonraki">→</button></div></article>
}

export function MobileMenu(){const [open,setOpen]=useState(false);return <><button className="menu-button" onClick={()=>setOpen(!open)} aria-label="Menüyü aç">☰</button>{open&&<div className="mobile-panel"><a>Ana Sayfa</a><a>Son Dakika</a><a>Gündem</a><a>Siyaset</a><a>Ekonomi</a><a>Spor</a><a>Dünya</a><a>Video</a><a>Yazarlar</a></div>}</>}
