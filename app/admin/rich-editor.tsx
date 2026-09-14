"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import { useCallback, useEffect, useRef, useState } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { CharacterCount, Placeholder } from "@tiptap/extensions";
import TextAlign from "@tiptap/extension-text-align";
import { BackgroundColor, Color, FontSize, TextStyle } from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import { TableKit } from "@tiptap/extension-table";
import Image from "@tiptap/extension-image";
import Youtube from "@tiptap/extension-youtube";
import { resizableMediaView } from "./resizable-media";
import { mediaWidthAttributes } from "./media-size-model.mjs";

/* Genişlik hem öznitelik hem satır içi stil olarak yazılır. Yayındaki genel `img{width:100%}`
   kuralı yazar stili olduğu için öznitelik ipucunu ezer; ölçüyü ancak satır içi stil taşıyabilir. */
type WidthAttribute = { default: unknown; renderHTML?: (attributes: Record<string, unknown>) => Record<string, string> };
function widthAttribute(parent?: WidthAttribute): WidthAttribute {
  return {
    ...(parent ?? { default: null }),
    renderHTML: (attributes): Record<string, string> => mediaWidthAttributes(attributes.width),
  };
}

/* Eklentinin kendi özniteliklerini korur, yalnız genişliği zengin sürümüyle değiştirir. */
function resizableAttributes(parent: unknown) {
  const attributes = (parent ?? {}) as Record<string, WidthAttribute>;
  return { ...attributes, width: widthAttribute(attributes.width) };
}

/* Kütüphaneden eklenen mp4/webm videosu. Yayında `<video controls>` olarak görünür ve
   editörde görsellerle aynı tutamakla boyutlandırılır. */
const LibraryVideo = Node.create({
  name: "video",
  group: "block",
  atom: true,
  draggable: true,
  addAttributes: () => ({ src: { default: null }, width: widthAttribute(), height: { default: null } }),
  parseHTML: () => [{ tag: "video[src]" }],
  renderHTML: ({ HTMLAttributes }) => ["video", mergeAttributes({ controls: "controls", preload: "metadata", playsinline: "playsinline" }, HTMLAttributes)],
  addNodeView: () => resizableMediaView("rt-media-video"),
});

/* Görsel ve YouTube gömmesi de aynı tutamağı kullanır. Görselde yükseklik yazılmaz;
   oran `height:auto` ile korunur. */
const ResizableImage = Image.extend({
  addNodeView: () => resizableMediaView("rt-media-image"),
  addAttributes() { return resizableAttributes(this.parent?.()); },
});
const ResizableYoutube = Youtube.extend({
  addNodeView: () => resizableMediaView("rt-media-embed", 16 / 9),
  addAttributes() { return resizableAttributes(this.parent?.()); },
});

type MediaAsset = { id: number; publicUrl: string; originalName: string; altText: string; mimeType: string };

/* Küçük tek renkli simge seti; araç çubuğu metin glifleri yerine bunları kullanır. */
const icons: Record<string, string> = {
  gorsel: "M2.5 3.5h11v9h-11zM2.5 10l3-3 2.5 2.5L11 6l2.5 3.5M5.5 6a.9.9 0 1 0 0-.1",
  video: "M2.5 4h7v8h-7zM10 6.5l3.5-2v7l-3.5-2",
  geri: "M6 4.5 3 7.5l3 3M3 7.5h5.5a4 4 0 0 1 0 8H7",
  ileri: "m10 4.5 3 3-3 3M13 7.5H7.5a4 4 0 0 0 0 8H9",
  solaHizala: "M2 4h12M2 7.2h7M2 10.4h12M2 13.6h7",
  ortala: "M2 4h12M4.5 7.2h7M2 10.4h12M4.5 13.6h7",
  sagaHizala: "M2 4h12M7 7.2h7M2 10.4h12M7 13.6h7",
  iki_yana: "M2 4h12M2 7.2h12M2 10.4h12M2 13.6h12",
  maddeListe: "M5.5 4.5h9M5.5 8h9M5.5 11.5h9M2.6 4.5h.01M2.6 8h.01M2.6 11.5h.01",
  numaraliListe: "M6 4.5h8.5M6 8h8.5M6 11.5h8.5M2 3.6h1v2.2M2 9.6h1.6L2 11.4h1.6",
  girintiAzalt: "M7 4.5h7.5M7 8h7.5M7 11.5h7.5M4.4 6.2 2.4 8l2 1.8",
  girintiArtir: "M7 4.5h7.5M7 8h7.5M7 11.5h7.5M2.4 6.2 4.4 8l-2 1.8",
  baglanti: "M6.8 9.2a2.6 2.6 0 0 0 3.7 0l2-2a2.6 2.6 0 1 0-3.7-3.7l-.9.9M9.2 6.8a2.6 2.6 0 0 0-3.7 0l-2 2a2.6 2.6 0 1 0 3.7 3.7l.9-.9",
  tablo: "M2.5 3.5h11v9h-11zM2.5 6.6h11M2.5 9.6h11M6.2 3.5v9M9.9 3.5v9",
  alinti: "M6.6 4.6c-2 .7-3.1 2.2-3.1 4.2 0 1.6 1 2.6 2.2 2.6 1.1 0 1.9-.8 1.9-1.8 0-1-.7-1.7-1.6-1.7-.2 0-.4 0-.5.1.2-.9.9-1.7 1.9-2.1zm5.6 0c-2 .7-3.1 2.2-3.1 4.2 0 1.6 1 2.6 2.2 2.6 1.1 0 1.9-.8 1.9-1.8 0-1-.7-1.7-1.6-1.7-.2 0-.4 0-.5.1.2-.9.9-1.7 1.9-2.1z",
  cizgi: "M2.5 8h11",
};

function Icon({ name }: { name: string }) {
  return <svg className="rt-icon" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d={icons[name]} /></svg>;
}
type PanelKind = "image" | "video" | "link" | "source" | null;

const fontSizes = ["14px", "16px", "18px", "20px", "24px", "28px", "32px"];
const textColors = [
  { label: "Siyah", value: "#161b22" }, { label: "Koza kırmızısı", value: "#dc151d" },
  { label: "Lacivert", value: "#12395e" }, { label: "Yeşil", value: "#177a4a" },
  { label: "Gri", value: "#68717d" }, { label: "Turuncu", value: "#c2610a" },
];
const highlightColors = [
  { label: "Sarı", value: "#fff3a3" }, { label: "Yeşil", value: "#cdf3d8" },
  { label: "Mavi", value: "#d4e7fb" }, { label: "Pembe", value: "#fbd7dd" },
];

/* Koza TV haber gövdesi için zengin metin editörü.
   Değer HTML olarak dışarı verilir; kaydetme ve düz metin projeksiyonu çağıran ekranda yapılır. */
export function RichEditor({ value, onChange, disabled = false, placeholder = "Haber metnini yazın…" }: {
  value: string; onChange: (html: string) => void; disabled?: boolean; placeholder?: string;
}) {
  const [panel, setPanel] = useState<PanelKind>(null);
  const [library, setLibrary] = useState<MediaAsset[]>([]);
  const [mediaQuery, setMediaQuery] = useState("");
  const [linkHref, setLinkHref] = useState("");
  const [sourceHtml, setSourceHtml] = useState("");
  const [loadingMedia, setLoadingMedia] = useState(false);
  /* Dışarıdan gelen değeri, kullanıcı yazarken editöre geri basmamak için son yayılan HTML tutulur. */
  const emitted = useRef(value);

  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    editable: !disabled,
    content: value,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3, 4, 5, 6] }, link: { openOnClick: false, autolink: true, HTMLAttributes: { rel: "noreferrer nofollow", target: "_blank" } } }),
      TextStyle, Color, FontSize, BackgroundColor,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Highlight.configure({ multicolor: true }),
      TableKit.configure({ table: { resizable: true } }),
      ResizableImage.configure({ inline: false, allowBase64: false }),
      ResizableYoutube.configure({ controls: true, nocookie: true, width: 640, height: 360 }),
      LibraryVideo,
      CharacterCount,
      Placeholder.configure({ placeholder }),
    ],
    onUpdate: ({ editor: instance }) => {
      const html = instance.getHTML();
      emitted.current = html; onChange(html);
    },
  }, [disabled]);

  /* Başka bir habere geçildiğinde içerik tazelenir; yazarken imleç kaybolmaz. */
  useEffect(() => {
    if (!editor || value === emitted.current) return;
    emitted.current = value;
    editor.commands.setContent(value || "", { emitUpdate: false });
  }, [editor, value]);

  const openMedia = useCallback(async (kind: "image" | "video") => {
    setPanel(kind); setMediaQuery(""); setLoadingMedia(true);
    try {
      const response = await fetch(`/api/media?type=${kind}&limit=60`);
      const data = response.ok ? await response.json() : {};
      setLibrary(Array.isArray(data.media) ? data.media : []);
    } catch { setLibrary([]); }
    setLoadingMedia(false);
  }, []);

  if (!editor) return <div className="rt-editor rt-editor-loading">Editör yükleniyor…</div>;

  /* Null kontrolünden sonraki kesin referans; aşağıdaki yardımcılar bunu kullanır. */
  const active: Editor = editor;

  const can = (name: string, attrs?: Record<string, unknown>) => editor.isActive(name, attrs);
  const chain = () => editor.chain().focus();
  const visibleMedia = library.filter((item) => !mediaQuery.trim() || `${item.originalName} ${item.altText}`.toLocaleLowerCase("tr-TR").includes(mediaQuery.toLocaleLowerCase("tr-TR")));
  const words = editor.storage.characterCount.words();

  function applyLink() {
    const href = linkHref.trim();
    if (!href) { active.chain().focus().extendMarkRange("link").unsetLink().run(); setPanel(null); return; }
    active.chain().focus().extendMarkRange("link").setLink({ href }).run();
    setPanel(null); setLinkHref("");
  }

  function transformSelection(mode: "upper" | "lower") {
    const { from, to } = active.state.selection;
    if (from === to) return;
    const text = active.state.doc.textBetween(from, to, " ");
    const next = mode === "upper" ? text.toLocaleUpperCase("tr-TR") : text.toLocaleLowerCase("tr-TR");
    active.chain().focus().insertContentAt({ from, to }, next).run();
  }

  return (
    <div className={`rt-editor${disabled ? " rt-editor-disabled" : ""}`}>
      <div className="rt-menubar">
        <details className="rt-menu"><summary>Ekle</summary><div>
          <button type="button" onClick={() => void openMedia("image")}>Görsel…</button>
          <button type="button" onClick={() => void openMedia("video")}>Video…</button>
          <button type="button" onClick={() => { setLinkHref(editor.getAttributes("link").href ?? ""); setPanel("link"); }}>Bağlantı…</button>
          <button type="button" onClick={() => chain().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>Tablo (3×3)</button>
          <button type="button" onClick={() => chain().setHorizontalRule().run()}>Yatay çizgi</button>
          <button type="button" onClick={() => { setSourceHtml(editor.getHTML()); setPanel("source"); }}>HTML kaynağı…</button>
        </div></details>
        <details className="rt-menu"><summary>Biçim</summary><div>
          <button type="button" onClick={() => chain().setParagraph().run()}>Paragraf</button>
          {[2, 3, 4].map((level) => <button type="button" key={level} onClick={() => chain().toggleHeading({ level: level as 2 | 3 | 4 }).run()}>Başlık {level}</button>)}
          <button type="button" onClick={() => chain().toggleBlockquote().run()}>Alıntı</button>
          <button type="button" onClick={() => chain().unsetAllMarks().clearNodes().run()}>Biçimi temizle</button>
        </div></details>
        <details className="rt-menu"><summary>Tablo</summary><div>
          <button type="button" onClick={() => chain().addRowAfter().run()}>Satır ekle</button>
          <button type="button" onClick={() => chain().addColumnAfter().run()}>Sütun ekle</button>
          <button type="button" onClick={() => chain().deleteRow().run()}>Satırı sil</button>
          <button type="button" onClick={() => chain().deleteColumn().run()}>Sütunu sil</button>
          <button type="button" onClick={() => chain().mergeOrSplit().run()}>Hücre birleştir / böl</button>
          <button type="button" onClick={() => chain().deleteTable().run()}>Tabloyu sil</button>
        </div></details>
      </div>

      <div className="rt-toolbar">
        <button type="button" title="Görsel ekle" onClick={() => void openMedia("image")}><Icon name="gorsel" /></button>
        <button type="button" title="Video ekle" onClick={() => void openMedia("video")}><Icon name="video" /></button>
        <span className="rt-sep" />
        <button type="button" title="Geri al" onClick={() => chain().undo().run()}><Icon name="geri" /></button>
        <button type="button" title="Yinele" onClick={() => chain().redo().run()}><Icon name="ileri" /></button>
        <span className="rt-sep" />
        <button type="button" title="Kalın" className={can("bold") ? "on" : ""} onClick={() => chain().toggleBold().run()}><b>B</b></button>
        <button type="button" title="İtalik" className={can("italic") ? "on" : ""} onClick={() => chain().toggleItalic().run()}><i>I</i></button>
        <button type="button" title="Altı çizili" className={can("underline") ? "on" : ""} onClick={() => chain().toggleUnderline().run()}><u>U</u></button>
        <button type="button" title="Üstü çizili" className={can("strike") ? "on" : ""} onClick={() => chain().toggleStrike().run()}><s>S</s></button>
        <span className="rt-sep" />
        <button type="button" title="Sola hizala" className={can({ textAlign: "left" } as never) ? "on" : ""} onClick={() => chain().setTextAlign("left").run()}><Icon name="solaHizala" /></button>
        <button type="button" title="Ortala" onClick={() => chain().setTextAlign("center").run()}><Icon name="ortala" /></button>
        <button type="button" title="Sağa hizala" onClick={() => chain().setTextAlign("right").run()}><Icon name="sagaHizala" /></button>
        <button type="button" title="İki yana yasla" onClick={() => chain().setTextAlign("justify").run()}><Icon name="iki_yana" /></button>
        <span className="rt-sep" />
        <button type="button" title="Madde işaretli liste" className={can("bulletList") ? "on" : ""} onClick={() => chain().toggleBulletList().run()}><Icon name="maddeListe" /></button>
        <button type="button" title="Numaralı liste" className={can("orderedList") ? "on" : ""} onClick={() => chain().toggleOrderedList().run()}><Icon name="numaraliListe" /></button>
        <button type="button" title="Girintiyi azalt" onClick={() => chain().liftListItem("listItem").run()}><Icon name="girintiAzalt" /></button>
        <button type="button" title="Girintiyi artır" onClick={() => chain().sinkListItem("listItem").run()}><Icon name="girintiArtir" /></button>
        <span className="rt-sep" />
        <button type="button" title="Bağlantı" className={can("link") ? "on" : ""} onClick={() => { setLinkHref(editor.getAttributes("link").href ?? ""); setPanel("link"); }}><Icon name="baglanti" /></button>
        <button type="button" title="Tablo ekle" onClick={() => chain().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}><Icon name="tablo" /></button>
      </div>

      <div className="rt-toolbar">
        <button type="button" title="Alıntı" className={can("blockquote") ? "on" : ""} onClick={() => chain().toggleBlockquote().run()}><Icon name="alinti" /></button>
        <button type="button" title="Yatay çizgi" onClick={() => chain().setHorizontalRule().run()}><Icon name="cizgi" /></button>
        <button type="button" title="HTML kaynağı" onClick={() => { setSourceHtml(editor.getHTML()); setPanel("source"); }}>&lt;/&gt;</button>
        <span className="rt-sep" />
        <label className="rt-select" title="Punto">
          <select value={editor.getAttributes("textStyle").fontSize ?? ""} onChange={(event) => { const size = event.target.value; if (size) chain().setFontSize(size).run(); else chain().unsetFontSize().run(); }}>
            <option value="">Punto</option>
            {fontSizes.map((size) => <option value={size} key={size}>{size}</option>)}
          </select>
        </label>
        <label className="rt-select" title="Yazı rengi">
          <select value={editor.getAttributes("textStyle").color ?? ""} onChange={(event) => { const color = event.target.value; if (color) chain().setColor(color).run(); else chain().unsetColor().run(); }}>
            <option value="">Yazı rengi</option>
            {textColors.map((color) => <option value={color.value} key={color.value}>{color.label}</option>)}
          </select>
        </label>
        <label className="rt-select" title="Vurgu rengi">
          <select value={editor.getAttributes("highlight").color ?? ""} onChange={(event) => { const color = event.target.value; if (color) chain().setHighlight({ color }).run(); else chain().unsetHighlight().run(); }}>
            <option value="">Vurgu</option>
            {highlightColors.map((color) => <option value={color.value} key={color.value}>{color.label}</option>)}
          </select>
        </label>
        <span className="rt-sep" />
        <button type="button" title="BÜYÜK HARF" onClick={() => transformSelection("upper")}>äA</button>
        <button type="button" title="küçük harf" onClick={() => transformSelection("lower")}>Aà</button>
        <span className="rt-sep" />
        <button type="button" title="Paragraf" className={can("paragraph") ? "on" : ""} onClick={() => chain().setParagraph().run()}>P</button>
        {[2, 3, 4, 5, 6].map((level) => (
          <button type="button" key={level} title={`Başlık ${level}`} className={can("heading", { level }) ? "on" : ""} onClick={() => chain().toggleHeading({ level: level as 2 | 3 | 4 | 5 | 6 }).run()}>H{level}</button>
        ))}
      </div>

      <EditorContent className="rt-surface" editor={editor} />
      <div className="rt-status"><span>{words} KELİME</span><span>Resim ve videoyu sağ alt köşesinden sürükleyerek boyutlandırın.</span></div>

      {(panel === "image" || panel === "video") && (
        <div className="rt-panel" aria-label={panel === "image" ? "Görsel kütüphanesi" : "Video kütüphanesi"}>
          <div className="rt-panel-head">
            <input type="search" value={mediaQuery} placeholder="Dosya adı veya açıklama ara…" onChange={(event) => setMediaQuery(event.target.value)} />
            <small>{loadingMedia ? "Yükleniyor…" : `${visibleMedia.length} sonuç`}</small>
            <button type="button" onClick={() => setPanel(null)}>Kapat</button>
          </div>
          <div className="rt-panel-grid">
            {visibleMedia.map((item) => (
              <button type="button" key={item.id} onClick={() => {
                if (panel === "image") chain().setImage({ src: item.publicUrl, alt: item.altText || item.originalName }).run();
                else chain().insertContent({ type: "video", attrs: { src: item.publicUrl } }).run();
                setPanel(null);
              }}>
                {panel === "image" ? <img src={item.publicUrl} alt={item.altText} /> : <span className="rt-video-thumb">▶</span>}
                <small>{item.originalName}</small>
              </button>
            ))}
            {!loadingMedia && visibleMedia.length === 0 && <p>Kütüphanede kayıt bulunamadı. Medya Kütüphanesi ekranından yükleyebilirsiniz.</p>}
          </div>
          {panel === "video" && (
            <div className="rt-panel-foot">
              <input type="url" placeholder="YouTube bağlantısı yapıştırın" onKeyDown={(event) => {
                if (event.key !== "Enter") return;
                event.preventDefault();
                const url = (event.target as HTMLInputElement).value.trim();
                if (url) { chain().setYoutubeVideo({ src: url }).run(); setPanel(null); }
              }} />
              <small>Bağlantıyı yapıştırıp Enter&apos;a basın.</small>
            </div>
          )}
        </div>
      )}

      {panel === "link" && (
        <div className="rt-panel rt-panel-inline" aria-label="Bağlantı">
          <input type="text" value={linkHref} placeholder="https://… veya /haber/ornek-adres" onChange={(event) => setLinkHref(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); applyLink(); } }} />
          <button type="button" onClick={applyLink}>Uygula</button>
          <button type="button" onClick={() => { chain().extendMarkRange("link").unsetLink().run(); setPanel(null); }}>Kaldır</button>
          <button type="button" onClick={() => setPanel(null)}>Vazgeç</button>
        </div>
      )}

      {panel === "source" && (
        <div className="rt-panel rt-panel-source" aria-label="HTML kaynağı">
          <textarea value={sourceHtml} rows={14} onChange={(event) => setSourceHtml(event.target.value)} />
          <div className="rt-panel-foot">
            <button type="button" onClick={() => { editor.commands.setContent(sourceHtml, { emitUpdate: true }); setPanel(null); }}>Uygula</button>
            <button type="button" onClick={() => setPanel(null)}>Vazgeç</button>
          </div>
        </div>
      )}
    </div>
  );
}
