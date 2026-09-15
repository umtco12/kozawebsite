/* Only canonical provider URLs are persisted; pasted scripts/iframe attributes are discarded. */
export function parseSocialEmbed(input) {
  const text = String(input ?? '').trim();
  if (!text || text.length > 20000) return null;
  const candidates = text.startsWith('<')
    ? [...text.matchAll(/\b(?:href|src)\s*=\s*["']([^"']+)["']/gi)].map(m => m[1].replace(/&amp;/gi, '&'))
    : [text];
  for (const candidate of candidates) {
    let u; try { u = new URL(candidate); } catch { continue; }
    if (u.protocol !== 'https:' || u.username || u.password || u.port) continue;
    const host = u.hostname.toLowerCase();
    if (['x.com','www.x.com','twitter.com','www.twitter.com','mobile.twitter.com'].includes(host)) {
      const m = u.pathname.match(/^\/([A-Za-z0-9_]{1,15})\/status\/(\d{1,25})(?:\/|$)/);
      if (m) return { type:'twitter', id:m[2], url:`https://x.com/${m[1]}/status/${m[2]}` };
    }
    if (['youtube.com','www.youtube.com','m.youtube.com','youtube-nocookie.com','www.youtube-nocookie.com','youtu.be'].includes(host)) {
      const id = host === 'youtu.be' ? u.pathname.slice(1) : u.pathname === '/watch' ? u.searchParams.get('v') : u.pathname.match(/^\/(?:embed|shorts|live)\/([^/]+)\/?$/)?.[1];
      if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) return {type:'youtube', id, url:`https://www.youtube.com/watch?v=${id}`};
    }
  }
  return null;
}
