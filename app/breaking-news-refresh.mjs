import { isBreakingItems } from "../db/breaking-feed-model.mjs";

export const BREAKING_REFRESH_MS = 60_000;

/** Eşzamanlı istekleri birleştirir; hatalı yanıtta görünür haberler korunur. */
export function createBreakingRefresh({ onItems, fetcher = fetch }) {
  let pending;
  let stopped = false;
  let controller;
  return {
    refresh() {
      if (stopped) return Promise.resolve();
      if (pending) return pending;
      controller = new AbortController();
      const timer = setTimeout(() => controller?.abort(), 8000);
      pending = (async () => {
        try {
          const response = await fetcher("/api/breaking-news", { cache: "no-store", signal: controller.signal });
          if (!response.ok) return;
          const data = await response.json();
          if (!stopped && isBreakingItems(data.items)) onItems(data.items);
        } catch { /* Bağlantı geri geldiğinde tekrar denenir; mevcut liste silinmez. */ }
        finally { clearTimeout(timer); pending = undefined; }
      })();
      return pending;
    },
    stop() { stopped = true; controller?.abort(); },
  };
}
