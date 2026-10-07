"use client";

import { useEffect } from "react";
import { syncArticleLocation } from "./article-url-model.mjs";

export function ArticleUrlSync() {
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const articles = Array.from(document.querySelectorAll<HTMLElement>("article[data-article-path]"), (element) => ({
        path: element.dataset.articlePath ?? "",
        title: element.dataset.articleTitle ?? "",
        top: element.getBoundingClientRect().top,
      }));
      syncArticleLocation({ articles, line: window.innerHeight * 0.35, location: window.location, history: window.history, document });
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("pageshow", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("pageshow", schedule);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
