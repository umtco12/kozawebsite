import type { ContentBlock } from "../../../db";

function youtubeUrl(value: string) { try { const url = new URL(value); const id = url.hostname === "youtu.be" ? url.pathname.slice(1) : url.hostname.endsWith("youtube.com") ? url.searchParams.get("v") ?? url.pathname.split("/").pop() : ""; return id && /^[\w-]{6,20}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : ""; } catch { return ""; } }
function safeMedia(value: string) { return value.startsWith("/media/") || value.startsWith("/news/") || /^https:\/\//i.test(value); }

export function ArticleBlocks({ blocks }: { blocks: ContentBlock[] }) {
  return <>{blocks.map((block) => {
    if (!block.content.trim()) return null;
    if (block.type === "heading") return <h2 key={block.id}>{block.content}</h2>;
    if (block.type === "quote") return <blockquote key={block.id}>{block.content}</blockquote>;
    if (block.type === "list") return <ul key={block.id}>{block.content.split("\n").filter(Boolean).map((item) => <li key={item}>{item}</li>)}</ul>;
    if (block.type === "image" && safeMedia(block.content)) return <figure className="article-inline-media" key={block.id}><img src={block.content} alt={block.caption || "Haber görseli"} />{block.caption && <figcaption>{block.caption}</figcaption>}</figure>;
    if (block.type === "video") { const embed = youtubeUrl(block.content); if (embed) return <iframe className="article-video" key={block.id} src={embed} title={block.caption || "Haber videosu"} loading="lazy" allow="accelerometer; autoplay; encrypted-media; picture-in-picture" allowFullScreen />; if (safeMedia(block.content)) return <video className="article-video" key={block.id} src={block.content} controls preload="metadata"><track kind="captions" src="/empty-captions.vtt" srcLang="tr" label="Türkçe" default /></video>; }
    if (block.type === "embed" && /^https:\/\//i.test(block.content)) return <p className="article-embed" key={block.id}><a href={block.content} target="_blank" rel="noreferrer nofollow">Sosyal medya içeriğini görüntüle →</a></p>;
    return block.type === "paragraph" ? <p key={block.id}>{block.content}</p> : null;
  })}</>;
}
