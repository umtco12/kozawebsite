"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { homepageLayoutSignature, moveHomepageLayoutCard } from "./homepage-layout-model.mjs";

type Placement = "slider" | "side" | "below" | "latest";
type LayoutArticle = {
  id: number;
  slug: string;
  title: string;
  category: string;
  heroImage: string;
  publishedAt: number | null;
};
type LayoutBoard = Record<Placement, LayoutArticle[]>;
type LayoutResponse = { revision: string; layout: LayoutBoard; movedToLatest?: number[]; error?: string; code?: string };

const placements: Placement[] = ["slider", "side", "below", "latest"];
const limits: Record<Placement, number> = { slider: 5, side: 2, below: 4, latest: 60 };
const labels: Record<Placement, string> = {
  slider: "Manşet · Slider",
  side: "Manşet yanı · Günün Akışı",
  below: "Manşet altı",
  latest: "Son Haberler",
};
const descriptions: Record<Placement, string> = {
  slider: "Ana sayfadaki beşli büyük manşet alanı",
  side: "Manşetin yanındaki Günün Akışı alanı",
  below: "Manşetin hemen altındaki haber kartları",
  latest: "Manşetten çıkan ve yayın tarihine göre sıralanan haberler",
};

function publishedDate(value: number | null) {
  if (!value) return "Tarih yok";
  return new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(value);
}

export function HomepageLayout({ onDirtyChange }: { onDirtyChange?: (dirty: boolean) => void }) {
  const [board, setBoard] = useState<LayoutBoard | null>(null);
  const [savedBoard, setSavedBoard] = useState<LayoutBoard | null>(null);
  const [revision, setRevision] = useState("");
  const [savedSignature, setSavedSignature] = useState("");
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const dragRef = useRef<number | null>(null);
  const dirty = Boolean(board) && homepageLayoutSignature(board) !== savedSignature;

  const load = useCallback(async () => {
    setLoading(true); setMessage("");
    try {
      const response = await fetch("/api/homepage-layout", { cache: "no-store" });
      const data = await response.json() as LayoutResponse;
      if (!response.ok) throw new Error(data.error || "Ana sayfa düzeni alınamadı.");
      setBoard(data.layout); setSavedBoard(data.layout); setRevision(data.revision); setSavedSignature(homepageLayoutSignature(data.layout));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Ana sayfa düzeni alınamadı.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);
  useEffect(() => { onDirtyChange?.(dirty); }, [dirty, onDirtyChange]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (!dirty) return; event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function moveCard(id: number, target: Placement, targetIndex?: number) {
    setBoard((current) => {
      if (!current) return current;
      const next = moveHomepageLayoutCard(current, id, target, targetIndex, limits) as LayoutBoard;
      if (next !== current) setMessage("");
      return next;
    });
  }

  function positionOf(id: number) {
    if (!board) return null;
    for (const placement of placements) {
      const index = board[placement].findIndex((article) => article.id === id);
      if (index >= 0) return { placement, index };
    }
    return null;
  }

  function nudge(id: number, direction: -1 | 1) {
    const position = positionOf(id);
    if (!position || position.placement === "latest") return;
    moveCard(id, position.placement, position.index + direction);
  }

  function resetChanges() {
    if (!savedBoard || !dirty) return;
    setBoard(savedBoard);
    setQuery("");
    setMessage("Kaydedilmemiş değişiklikler geri alındı.");
    finishDrag();
  }

  function finishDrag() { dragRef.current = null; setDraggingId(null); }

  function pointerMove(event: React.PointerEvent<HTMLElement>) {
    const id = dragRef.current;
    if (!id) return;
    const element = document.elementFromPoint(event.clientX, event.clientY) as HTMLElement | null;
    const card = element?.closest<HTMLElement>("[data-home-layout-card]");
    const zone = element?.closest<HTMLElement>("[data-home-layout-zone]");
    const placement = (card?.dataset.placement || zone?.dataset.placement) as Placement | undefined;
    if (!placement || !placements.includes(placement)) return;
    const index = card ? Number(card.dataset.index) : board?.[placement].length;
    moveCard(id, placement, Number.isFinite(index) ? index : undefined);
  }

  async function save() {
    if (!board || !dirty) return;
    setSaving(true); setMessage("Ana sayfa düzeni kaydediliyor…");
    const layout = {
      slider: board.slider.map((article) => article.id),
      side: board.side.map((article) => article.id),
      below: board.below.map((article) => article.id),
      latest: board.latest.map((article) => article.id),
    };
    try {
      const response = await fetch("/api/homepage-layout", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ revision, layout }) });
      const data = await response.json() as LayoutResponse;
      if (!response.ok) {
        if (response.status === 409) void load();
        throw new Error(data.error || "Ana sayfa düzeni kaydedilemedi.");
      }
      setBoard(data.layout); setSavedBoard(data.layout); setRevision(data.revision); setSavedSignature(homepageLayoutSignature(data.layout));
      const moved = data.movedToLatest?.length || 0;
      setMessage(moved ? `Düzen kaydedildi. ${moved} haber Son Haberler'e taşındı.` : "Ana sayfa düzeni kaydedildi.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Ana sayfa düzeni kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <section className="newsroom-card homepage-layout-loading">Ana sayfa düzeni hazırlanıyor…</section>;
  if (!board) return <section className="newsroom-card homepage-layout-loading"><strong>Düzen açılamadı.</strong><p>{message}</p><button type="button" onClick={() => void load()}>Tekrar dene</button></section>;
  const normalizedQuery = query.trim().toLocaleLowerCase("tr-TR");
  const visibleLatest = board.latest.map((article, index) => ({ article, index })).filter(({ article }) => `${article.title} ${article.category}`.toLocaleLowerCase("tr-TR").includes(normalizedQuery));

  return <section className="homepage-layout-manager" onPointerMove={pointerMove} onPointerUp={finishDrag} onPointerCancel={finishDrag}>
    <header className="homepage-layout-intro">
      <div className="homepage-layout-intro-copy"><span>CANLI ANA SAYFA</span><h2>Tut, taşı, kaydet</h2><p>Haber yerleşimini üç basit adımda düzenleyin. Siz kaydetmeden ziyaretçi sayfası değişmez.</p>
        <ol className="homepage-layout-steps">
          <li><strong>1. Haberi tut</strong><small>Solundaki tutamacı basılı tutun.</small></li>
          <li><strong>2. Yerini seç</strong><small>İstediğiniz kutuya bırakın.</small></li>
          <li><strong>3. Düzeni kaydet</strong><small>Alttaki kırmızı düğmeye basın.</small></li>
        </ol>
      </div>
      <a href="/" target="_blank" rel="noreferrer">Ana sayfayı aç ↗</a>
    </header>
    <div className="homepage-layout-rule"><strong>Haber kaybolmaz:</strong> Slider 5, Manşet yanı 2, Manşet altı 4 haber alır. Dolu alana yeni haber koyarsanız son sıradaki haber otomatik olarak Son Haberler&apos;in başına geçer. Son düşen haber ilk sırada görünür; önceki haberler sırayla aşağı iner.</div>
    {message && <div className={message.includes("kaydedilemedi") || message.includes("değiştirildi") ? "homepage-layout-message error" : "homepage-layout-message"} role="status">{message}</div>}

    <div className="homepage-layout-zones">
      {(["slider", "side", "below"] as Placement[]).map((placement) => <section className={`homepage-layout-zone zone-${placement}`} data-home-layout-zone data-placement={placement} key={placement}>
        <header><div><span>{labels[placement]}</span><small>{descriptions[placement]}</small></div><b>{board[placement].length} / {limits[placement]}</b></header>
        <div className="homepage-layout-list">
          {board[placement].map((article, index) => <LayoutCard article={article} placement={placement} index={index} total={board[placement].length} dragging={draggingId === article.id} onMove={moveCard} onNudge={nudge} onDragStart={(id) => { dragRef.current = id; setDraggingId(id); }} key={article.id} />)}
          {!board[placement].length && <div className="homepage-layout-empty">Haberi buraya sürükleyin</div>}
        </div>
      </section>)}
    </div>

    <section className="homepage-latest-zone" data-home-layout-zone data-placement="latest">
      <header><div><span>SON HABERLER</span><h3>Yayındaki diğer haberler</h3><p>Yeni yayınlanan veya manşet alanlarından çıkan haberler bu listenin başına gelir. Ana sayfada en güncel 13 haber görünür: 1 ana haber ve dörderli üç sıra kart. Daha eski haberler “Tümünü Gör” sayfasında kalır.</p></div><label><span>Haber ara</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Başlık veya kategori…" /></label></header>
      <div className="homepage-latest-list">
        {visibleLatest.map(({ article, index }) => <LayoutCard article={article} placement="latest" index={index} total={board.latest.length} dragging={draggingId === article.id} onMove={moveCard} onNudge={nudge} onDragStart={(id) => { dragRef.current = id; setDraggingId(id); }} key={article.id} />)}
        {!visibleLatest.length && <div className="homepage-layout-search-empty">{normalizedQuery ? "Aramanıza uygun haber bulunamadı." : "Son Haberler'de başka yayın bulunmuyor."}</div>}
      </div>
    </section>

    <footer className="homepage-layout-actions"><div className="homepage-layout-status"><strong>{dirty ? "Kaydedilmemiş değişiklik var" : "Düzen güncel"}</strong><small>Değişiklikler yalnız kaydettiğinizde yayına uygulanır.</small></div><div className="homepage-layout-action-buttons"><button className="homepage-layout-reset" type="button" disabled={!dirty || saving} onClick={resetChanges}>Değişiklikleri geri al</button><button type="button" disabled={!dirty || saving} onClick={() => void save()}>{saving ? "Kaydediliyor…" : "Düzeni kaydet"}</button></div></footer>
  </section>;
}

function LayoutCard({ article, placement, index, total, dragging, onMove, onNudge, onDragStart }: {
  article: LayoutArticle;
  placement: Placement;
  index: number;
  total: number;
  dragging: boolean;
  onMove: (id: number, placement: Placement, index?: number) => void;
  onNudge: (id: number, direction: -1 | 1) => void;
  onDragStart: (id: number) => void;
}) {
  return <article className={`homepage-layout-card${dragging ? " dragging" : ""}`} data-home-layout-card data-placement={placement} data-index={index}>
    <button className="homepage-drag-handle" type="button" aria-label={`${article.title} haberini sürükle`} title="Tut ve taşı" onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); onDragStart(article.id); }}>⋮⋮</button>
    <img src={article.heroImage} alt="" />
    <div className="homepage-layout-card-copy"><small>{placement === "latest" ? publishedDate(article.publishedAt) : `${index + 1}. sıra`} · {article.category}</small><strong>{article.title}</strong></div>
    <div className={`homepage-layout-card-controls${placement === "latest" ? " latest-only" : ""}`}>
      {placement !== "latest" && <><button type="button" disabled={index === 0} onClick={() => onNudge(article.id, -1)} aria-label={`${article.title} haberini yukarı taşı`}>↑</button>
      <button type="button" disabled={index === total - 1} onClick={() => onNudge(article.id, 1)} aria-label={`${article.title} haberini aşağı taşı`}>↓</button></>}
      <label><span className="visually-hidden">{article.title} ana sayfa konumu</span><select value={placement} onChange={(event) => onMove(article.id, event.target.value as Placement)} aria-label={`${article.title} ana sayfa konumu`}>{placements.map((option) => <option value={option} key={option}>{labels[option]}</option>)}</select></label>
    </div>
  </article>;
}
