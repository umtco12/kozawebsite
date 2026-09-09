import type { ContentBlock } from "../../../db";

function youtubeUrl(value: string) { try { const url = new URL(value); const isYoutube = url.hostname === "youtube.com" || url.hostname.endsWith(".youtube.com"); const id = url.hostname === "youtu.be" ? url.pathname.slice(1) : isYoutube ? url.searchParams.get("v") ?? url.pathname.split("/").pop() : ""; return id && /^[\w-]{6,20}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : ""; } catch { return ""; } }
function vimeoUrl(value: string) { try { const url = new URL(value); if (url.hostname !== "vimeo.com" && !url.hostname.endsWith(".vimeo.com")) return ""; const id = url.pathname.split("/").filter(Boolean).findLast((part) => /^\d+$/.test(part)); return id ? `https://player.vimeo.com/video/${id}` : ""; } catch { return ""; } }
function safeMedia(value: string) { return value.startsWith("/media/") || value.startsWith("/news/") || /^https:\/\//i.test(value); }

export function ArticleVideoPlayer({ src, title = "Haber videosu" }: { src: string; title?: string }) {
  const youtube = youtubeUrl(src);
  if (youtube) return <iframe className="article-video-player" src={youtube} title={title} loading="lazy" allow="accelerometer; autoplay; encrypted-media; picture-in-picture" allowFullScreen />;
  const vimeo = vimeoUrl(src);
  if (vimeo) return <iframe className="article-video-player" src={vimeo} title={title} loading="lazy" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen />;
  if (!safeMedia(src)) return null;
  return <video className="article-video-player" src={src} controls playsInline preload="metadata"><track kind="captions" src="/empty-captions.vtt" srcLang="tr" label="Türkçe" default /></video>;
}

export function ArticleBlocks({ blocks, excludeVideoUrl = "" }: { blocks: ContentBlock[]; excludeVideoUrl?: string }) {
  return <>{blocks.map((block) => {
    if (!block.content.trim()) return null;
    if (block.type === "heading") return <h2 key={block.id}>{block.content}</h2>;
    if (block.type === "quote") return <blockquote key={block.id}>{block.content}</blockquote>;
    if (block.type === "list") return <ul key={block.id}>{block.content.split("\n").filter(Boolean).map((item) => <li key={item}>{item}</li>)}</ul>;
    if (block.type === "image" && safeMedia(block.content)) return <figure className="article-inline-media" key={block.id}><img src={block.content} alt={block.caption || "Haber görseli"} />{block.caption && <figcaption>{block.caption}</figcaption>}</figure>;
    if (block.type === "video") { if (excludeVideoUrl && block.content === excludeVideoUrl) return null; return <ArticleVideoPlayer key={block.id} src={block.content} title={block.caption || "Haber videosu"} />; }
    if (block.type === "embed" && /^https:\/\//i.test(block.content)) return <p className="article-embed" key={block.id}><a href={block.content} target="_blank" rel="noreferrer nofollow">Sosyal medya içeriğini görüntüle →</a></p>;
    return block.type === "paragraph" ? <p key={block.id}>{block.content}</p> : null;
  })}</>;
}
