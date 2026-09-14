/* Yalnız test sunucusuna --import ile yüklenir. Üretim kodunda test bayrağı veya özel uç yoktur. */
import { readFile } from "node:fs/promises";
const xml = await readFile(new URL("./youtube-feed.xml", import.meta.url), "utf8");
const originalFetch = globalThis.fetch;
globalThis.fetch = (input, init) => String(input) === "https://www.youtube.com/feeds/videos.xml?channel_id=UC4Ohyy56H4EZAy0Pagsv3iA"
  ? Promise.resolve(process.env.KOZA_TEST_YOUTUBE_FAILURE === "1" ? new Response("Kesinti", { status: 503 }) : new Response(xml, { headers: { "content-type": "application/atom+xml" } }))
  : originalFetch(input, init);
