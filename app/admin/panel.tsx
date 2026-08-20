"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type Status = "draft" | "review" | "scheduled" | "published";
type Article = {
  id?: number; slug: string; title: string; spot: string; body: string; category: string; status: Status;
  heroImage: string; imageAlt: string; videoUrl: string; author: string; sourceName: string; sourceUrl: string;
  seoTitle: string; seoDescription: string; isBreaking: number; isFeatured: number; publishedAt?: number | null;
  scheduledAt?: number | string | null; updatedAt?: number;
};
type Stats = { total: number; published: number; draft: number; review: number; scheduled: number };
type Source = { id: number; name: string; url: string; type: string; active: number; lastCheckedAt: number | null };
type Tab = "dashboard" | "articles" | "editor" | "sources";

const categories = ["Gündem", "Siyaset", "Ekonomi", "Dünya", "Spor", "Yaşam", "Kültür-Sanat", "Teknoloji", "Video"];
const statusLabels: Record<Status, string> = { draft: "Taslak", review: "Editör incelemesi", scheduled: "Planlandı", published: "Yayında" };
const emptyArticle: Article = { slug: "", title: "", spot: "", body: "", category: "Gündem", status: "draft", heroImage: "/news/gundem.jpg", imageAlt: "", videoUrl: "", author: "Koza TV Haber Merkezi", sourceName: "Koza TV", sourceUrl: "", seoTitle: "", seoDescription: "", isBreaking: 0, isFeatured: 0, scheduledAt: null };

function relativeDate(value?: number | null) {
  if (!value) return "Henüz yayınlanmadı";
  return new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(value);
}

export function AdminPanel() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [articles, setArticles] = useState<Article[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, published: 0, draft: 0, review: 0, scheduled: 0 });
  const [form, setForm] = useState<Article>(emptyArticle);
  const [filter, setFilter] = useState<Status | "all">("all");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [sourceForm, setSourceForm] = useState({ name: "", url: "", type: "website" });

  const refresh = useCallback(async () => {
    const [articleResponse, sourceResponse] = await Promise.all([fetch("/api/articles"), fetch("/api/sources")]);
    const articleData = await articleResponse.json();
    const sourceData = await sourceResponse.json();
    setArticles(articleData.articles ?? []); setStats(articleData.stats ?? { total: 0, published: 0, draft: 0, review: 0, scheduled: 0 }); setSources(sourceData.sources ?? []);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => refresh().catch(() => setMessage("İçerik verileri alınamadı.")), 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  const visibleArticles = useMemo(() => filter === "all" ? articles : articles.filter((article) => article.status === filter), [articles, filter]);
  const reviewQueue = articles.filter((article) => article.status === "review").slice(0, 4);

  function update<K extends keyof Article>(key: K, value: Article[K]) { setForm((current) => ({ ...current, [key]: value })); }
  function newArticle() { setForm(emptyArticle); setErrors({}); setMessage(""); setTab("editor"); }
  function editArticle(article: Article) { setForm({ ...article, scheduledAt: article.scheduledAt ? new Date(Number(article.scheduledAt)).toISOString().slice(0, 16) : null }); setErrors({}); setMessage(""); setTab("editor"); }

  async function saveArticle(status: Status) {
    setSaving(true); setErrors({}); setMessage("Kaydediliyor…");
    const response = await fetch("/api/articles", { method: form.id ? "PATCH" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...form, status }) });
    const data = await response.json(); setSaving(false);
    if (!response.ok) { setErrors(data.fields ?? {}); setMessage(data.error ?? "Haber kaydedilemedi"); return; }
    setForm(data.article); setMessage(status === "published" ? "Haber yayına alındı." : status === "review" ? "Haber editör incelemesine gönderildi." : status === "scheduled" ? "Haber planlandı." : "Taslak kaydedildi.");
    await refresh();
  }

  async function addSource(event: FormEvent) {
    event.preventDefault(); setMessage("Kaynak ekleniyor…");
    const response = await fetch("/api/sources", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(sourceForm) });
    const data = await response.json();
    if (!response.ok) { setMessage(data.error ?? "Kaynak eklenemedi"); return; }
    setSourceForm({ name: "", url: "", type: "website" }); setMessage("Kaynak izleme listesine eklendi. Otomatik tarama bağlantısı sonraki fazda etkinleşecek."); await refresh();
  }

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "dashboard", label: "Haber Masası", icon: "▦" }, { id: "articles", label: "Tüm Haberler", icon: "▤" },
    { id: "editor", label: "Yeni Haber", icon: "+" }, { id: "sources", label: "Kaynak Merkezi", icon: "⌁" },
  ];

  return (
    <main className="newsroom-shell">
      <aside className="newsroom-side">
        <Link className="admin-logo" href="/"><img src="/koza-logo.png" alt="Koza TV" /></Link>
        <span className="workspace-label">YAYIN OPERASYONU</span>
        <nav aria-label="Yönetim bölümleri">{tabs.map((item) => <button className={tab === item.id ? "active" : ""} onClick={() => item.id === "editor" ? newArticle() : setTab(item.id)} type="button" key={item.id}><i>{item.icon}</i>{item.label}{item.id === "articles" && <small>{stats.total}</small>}{item.id === "sources" && <small>{sources.length}</small>}</button>)}</nav>
        <div className="newsroom-ai"><span>AI HABER MASASI</span><strong>Editör kontrolü açık</strong><p>AI taslakları onay olmadan yayınlanamaz.</p></div>
        <Link className="back-site" href="/">← Siteye dön</Link>
      </aside>

      <section className="newsroom-main">
        <header className="newsroom-top"><div><span>KOZA TV / İÇERİK MERKEZİ</span><h1>{tab === "dashboard" ? "Günaydın, Haber Merkezi" : tab === "articles" ? "Haber Arşivi" : tab === "editor" ? (form.id ? "Haberi Düzenle" : "Yeni Haber Oluştur") : "Kaynak Merkezi"}</h1><p>{tab === "dashboard" ? "Yayın akışını, editör kuyruğunu ve günün performansını tek ekrandan yönetin." : tab === "editor" ? "İçerik, medya, kaynak ve SEO alanlarını birlikte hazırlayın." : "Koza TV yayın operasyonu"}</p></div><div className="newsroom-user"><b>KD</b><span>Kemal Deniz<small>Yayın Yönetmeni</small></span></div></header>
        {message && <div className={message.includes("alınamadı") || message.includes("edilemedi") ? "newsroom-message error" : "newsroom-message"}>{message}<button onClick={() => setMessage("")} aria-label="Mesajı kapat">×</button></div>}

        {tab === "dashboard" && <>
          <div className="newsroom-stats"><article><span>Yayındaki Haber</span><strong>{stats.published}</strong><small>Toplam {stats.total} kayıt</small></article><article><span>Editör Kuyruğu</span><strong>{stats.review}</strong><small>Onay bekleyen içerik</small></article><article><span>Planlı Yayın</span><strong>{stats.scheduled}</strong><small>Zamanlanmış haber</small></article><article className="accent"><span>Anlık Okuyucu</span><strong>2.841</strong><small>Canlı ölçüm bağlantısı hazır</small></article></div>
          <div className="newsroom-grid"><section className="newsroom-card desk-list"><div className="card-title"><div><span>EDİTÖR KUYRUĞU</span><h2>İnceleme bekleyenler</h2></div><button onClick={() => setTab("articles")}>Tüm haberler →</button></div>{reviewQueue.length ? reviewQueue.map((article) => <button className="queue-row" onClick={() => editArticle(article)} key={article.id}><img src={article.heroImage} alt="" /><span><b>{article.category}</b><strong>{article.title}</strong><small>{article.author} · {relativeDate(article.updatedAt)}</small></span><i>İncele →</i></button>) : <div className="empty-state">İnceleme kuyruğu temiz.</div>}</section>
          <aside className="newsroom-card today-flow"><div className="card-title"><div><span>BUGÜN</span><h2>Yayın akışı</h2></div></div>{articles.slice(0, 6).map((article) => <div className="today-row" key={article.id}><time>{relativeDate(article.publishedAt ?? article.updatedAt).split(" ").slice(-1)}</time><span><b className={`status status-${article.status}`}>{statusLabels[article.status]}</b><p>{article.title}</p></span></div>)}</aside></div>
        </>}

        {tab === "articles" && <section className="newsroom-card archive"><div className="archive-toolbar"><div>{(["all", "published", "review", "scheduled", "draft"] as const).map((value) => <button className={filter === value ? "active" : ""} onClick={() => setFilter(value)} key={value}>{value === "all" ? "Tümü" : statusLabels[value]}</button>)}</div><button className="primary" onClick={newArticle}>+ Yeni haber</button></div><div className="article-table"><div className="table-head"><span>Haber</span><span>Durum</span><span>Kaynak</span><span>Güncelleme</span><span /></div>{visibleArticles.map((article) => <button className="table-row" onClick={() => editArticle(article)} key={article.id}><span className="article-cell"><img src={article.heroImage} alt="" /><span><b>{article.category}</b><strong>{article.title}</strong></span></span><span><i className={`status status-${article.status}`}>{statusLabels[article.status]}</i></span><span>{article.sourceName}</span><span>{relativeDate(article.updatedAt)}</span><span>→</span></button>)}</div></section>}

        {tab === "editor" && <div className="editor-layout"><section className="editor-form"><div className="editor-section"><div className="editor-section-head"><span>01</span><div><h2>Haber içeriği</h2><p>Başlık, spot ve haber metnini hazırlayın.</p></div></div><label>Haber başlığı <small>{form.title.length}/110</small><input value={form.title} maxLength={110} onChange={(event) => update("title", event.target.value)} placeholder="Okurun haberi tek bakışta anlayacağı güçlü başlık" />{errors.title && <em>{errors.title}</em>}</label><label>Spot / kısa özet <small>{form.spot.length}/240</small><textarea value={form.spot} maxLength={240} rows={3} onChange={(event) => update("spot", event.target.value)} placeholder="Haberin en önemli bilgisini iki cümlede özetleyin" />{errors.spot && <em>{errors.spot}</em>}</label><label>Haber metni <textarea className="body-editor" value={form.body} rows={14} onChange={(event) => update("body", event.target.value)} placeholder="Haber metnini paragraflar halinde yazın…" />{errors.body && <em>{errors.body}</em>}</label></div>
          <div className="editor-section"><div className="editor-section-head"><span>02</span><div><h2>Medya ve kaynak</h2><p>Görsel, video ve doğrulama kaynağını tanımlayın.</p></div></div><div className="form-grid"><label>Kapak görseli yolu<input value={form.heroImage} onChange={(event) => update("heroImage", event.target.value)} /></label><label>Görsel alternatif metni<input value={form.imageAlt} onChange={(event) => update("imageAlt", event.target.value)} placeholder="Görselde ne var?" /></label><label>Kaynak adı<input value={form.sourceName} onChange={(event) => update("sourceName", event.target.value)} /></label><label>Kaynak URL<input value={form.sourceUrl} onChange={(event) => update("sourceUrl", event.target.value)} placeholder="https://" />{errors.sourceUrl && <em>{errors.sourceUrl}</em>}</label><label>Video URL<input value={form.videoUrl} onChange={(event) => update("videoUrl", event.target.value)} placeholder="YouTube veya yayın adresi" /></label><label>Yazar / servis<input value={form.author} onChange={(event) => update("author", event.target.value)} /></label></div></div>
          <div className="editor-section"><div className="editor-section-head"><span>03</span><div><h2>Yayın ve SEO</h2><p>Kategori, görünürlük ve arama alanlarını kontrol edin.</p></div></div><div className="form-grid"><label>Kategori<select value={form.category} onChange={(event) => update("category", event.target.value)}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label><label>Planlanan tarih<input type="datetime-local" value={typeof form.scheduledAt === "string" ? form.scheduledAt : ""} onChange={(event) => update("scheduledAt", event.target.value)} />{errors.scheduledAt && <em>{errors.scheduledAt}</em>}</label><label className="wide">SEO başlığı<input value={form.seoTitle} onChange={(event) => update("seoTitle", event.target.value)} placeholder="Boş bırakılırsa haber başlığı kullanılır" /></label><label className="wide">SEO açıklaması<textarea rows={2} value={form.seoDescription} onChange={(event) => update("seoDescription", event.target.value)} placeholder="Boş bırakılırsa spot kullanılır" /></label></div><div className="editor-checks"><label><input type="checkbox" checked={Boolean(form.isFeatured)} onChange={(event) => update("isFeatured", event.target.checked ? 1 : 0)} /> Manşette göster</label><label><input type="checkbox" checked={Boolean(form.isBreaking)} onChange={(event) => update("isBreaking", event.target.checked ? 1 : 0)} /> Son dakika olarak işaretle</label></div></div></section>
          <aside className="editor-aside"><div className="preview-card"><div className="preview-label">CANLI ÖNİZLEME</div><img src={form.heroImage || "/news/gundem.jpg"} alt="" /><span>{form.category}</span><h2>{form.title || "Haber başlığınız burada görünecek"}</h2><p>{form.spot || "Haber spotu kartlarda ve paylaşım alanlarında bu şekilde görünecek."}</p><small>{form.author}</small></div><div className="publish-card"><h3>Yayın kontrolü</h3><ul><li className={form.title.length >= 12 ? "ok" : ""}>Başlık hazır</li><li className={form.spot.length >= 24 ? "ok" : ""}>Spot hazır</li><li className={form.body.length >= 80 ? "ok" : ""}>Haber metni hazır</li><li className={form.imageAlt ? "ok" : ""}>Görsel açıklaması</li><li className={form.sourceName ? "ok" : ""}>Kaynak bilgisi</li></ul><button disabled={saving} onClick={() => saveArticle("published")} className="publish">{saving ? "Kaydediliyor…" : "Şimdi yayınla"}</button><button disabled={saving} onClick={() => saveArticle("review")}>Editör incelemesine gönder</button><button disabled={saving} onClick={() => saveArticle("scheduled")}>Yayını planla</button><button disabled={saving} onClick={() => saveArticle("draft")}>Taslak kaydet</button>{form.id && form.status === "published" && <Link href={`/haber/${form.slug}`} target="_blank">Yayındaki haberi gör →</Link>}</div></aside></div>}

        {tab === "sources" && <div className="sources-layout"><section className="newsroom-card"><div className="card-title"><div><span>KAYNAK HAVUZU</span><h2>İzlenen yayınlar</h2><p>Haberler doğrudan yayınlanmaz; önce editör kuyruğuna taslak olarak gelir.</p></div></div><div className="source-list">{sources.map((source) => <article key={source.id}><span className="source-icon">⌁</span><div><strong>{source.name}</strong><a href={source.url} target="_blank" rel="noreferrer">{source.url}</a></div><i>{source.type === "official" ? "RESMÎ KAYNAK" : "WEB SİTESİ"}</i><b className={source.active ? "online" : ""}>{source.active ? "İzleniyor" : "Kapalı"}</b></article>)}</div></section><aside className="newsroom-card source-add"><span>YENİ KAYNAK</span><h2>URL ile kaynak ekle</h2><p>RSS, ajans veya resmî kurum adresini tanımlayın. Otomatik çekilen içerikler yayınlanmadan önce doğrulama kuyruğuna alınır.</p><form onSubmit={addSource}><label>Kaynak adı<input value={sourceForm.name} onChange={(event) => setSourceForm({ ...sourceForm, name: event.target.value })} placeholder="Örn. Resmî Gazete" /></label><label>Kaynak adresi<input type="url" value={sourceForm.url} onChange={(event) => setSourceForm({ ...sourceForm, url: event.target.value })} placeholder="https://" /></label><label>Kaynak türü<select value={sourceForm.type} onChange={(event) => setSourceForm({ ...sourceForm, type: event.target.value })}><option value="website">Web sitesi</option><option value="rss">RSS</option><option value="official">Resmî kaynak</option><option value="agency">Haber ajansı</option></select></label><button type="submit">Kaynağı ekle</button></form><div className="ai-note"><strong>AI güvenlik kuralı</strong><p>Kaynak belirtmeyen, benzerlik kontrolünden geçmeyen veya editör onayı almayan taslaklar yayınlanamaz.</p></div></aside></div>}
      </section>
    </main>
  );
}
