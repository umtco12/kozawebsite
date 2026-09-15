"use client";
import { useEffect } from "react";
import { parseSocialEmbed } from "../db/social-embed.mjs";

type TwitterWindow = Window & { twttr?: {
  ready?: (callback: () => void) => void;
  widgets?: { createTweet: (id: string, element: HTMLElement, options: Record<string, unknown>) => Promise<HTMLElement | undefined> };
} };

/* Only the fixed provider script runs. The persisted link remains if X is unavailable. */
export function TwitterWidgets({ html }: { html: string }) {
  useEffect(() => {
    if (!html.includes('twitter-tweet')) return;
    let cancelled = false;
    const containers: HTMLElement[] = [];
    const posts = [...document.querySelectorAll<HTMLElement>('.rich-body blockquote.twitter-tweet, .rich-body blockquote.koza-twitter-post:not([hidden])')];
    posts.forEach(post => { post.classList.replace('twitter-tweet', 'koza-twitter-post'); });
    const render = () => {
      if (cancelled) return;
      const widgets = (window as TwitterWindow).twttr?.widgets;
      if (!widgets) return;
      posts.forEach(post => {
        if (!post.isConnected || post.dataset.embedState) return;
        const embed = [...post.querySelectorAll<HTMLAnchorElement>('a[href]')].map(link => parseSocialEmbed(link.href)).find(item => item?.type === 'twitter');
        if (!embed) return;
        post.dataset.embedState = 'loading';
        const container = document.createElement('div');
        container.className = 'koza-twitter-render'; post.after(container); containers.push(container);
        widgets.createTweet(embed.id, container, { dnt: true, align: 'center', conversation: 'none' }).then(element => {
          if (cancelled || !post.isConnected) { container.remove(); return; }
          if (element) { post.dataset.embedState = 'ready'; post.hidden = true; }
          else { container.remove(); post.dataset.embedState = 'unavailable'; }
        }).catch(() => { container.remove(); post.dataset.embedState = 'unavailable'; });
      });
    };
    const load = () => {
      const twitter = (window as TwitterWindow).twttr;
      if (twitter?.ready) twitter.ready(render); else render();
    };
    if ((window as TwitterWindow).twttr?.widgets) load();
    let script = document.querySelector<HTMLScriptElement>('script[data-koza-twitter]');
    if (!script) {
      script = document.createElement('script');
      script.src = 'https://platform.x.com/widgets.js'; script.async = true; script.dataset.kozaTwitter = 'true';
      script.addEventListener('load', load); document.head.appendChild(script);
    } else script.addEventListener('load', load);
    return () => {
      cancelled = true;
      script?.removeEventListener('load', load);
      containers.forEach(container => container.remove());
      posts.forEach(post => { delete post.dataset.embedState; post.hidden = false; });
    };
  }, [html]);
  return null;
}
