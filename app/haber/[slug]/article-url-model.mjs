export function activeArticleAt(articles, line) {
  if (!articles.length) return null;
  let active = articles[0];
  for (const article of articles) {
    if (article.top > line) break;
    active = article;
  }
  return active;
}

export function syncArticleLocation({ articles, line, location, history, document }) {
  const active = activeArticleAt(articles, line);
  if (!active || !/^\/haber\/[a-z0-9-]+$/.test(active.path) || !active.title?.trim()) return false;
  if (location.pathname === active.path) return false;
  history.replaceState(history.state, "", active.path);
  document.title = `${active.title} | Koza TV`;
  return true;
}
