const managedPlacements = ["slider", "side", "below"];
const allPlacements = [...managedPlacements, "latest"];

export function homepageLayoutSignature(board) {
  if (!board) return "";
  return JSON.stringify(managedPlacements.map((placement) => [placement, board[placement].map((article) => article.id)]));
}

export function moveHomepageLayoutCard(board, id, target, targetIndex, limits) {
  const source = allPlacements.find((placement) => board[placement].some((article) => article.id === id));
  if (!source || !allPlacements.includes(target)) return board;
  if (source === "latest" && target === "latest") return board;

  const article = board[source].find((item) => item.id === id);
  if (!article) return board;

  const next = Object.fromEntries(
    allPlacements.map((placement) => [placement, board[placement].filter((item) => item.id !== id)]),
  );
  const requestedIndex = Number.isFinite(targetIndex) ? targetIndex : next[target].length;
  const index = Math.max(0, Math.min(requestedIndex, next[target].length));
  next[target].splice(index, 0, article);

  if (target !== "latest" && next[target].length > limits[target]) {
    const displaced = next[target].pop();
    if (displaced) {
      next.latest = [displaced, ...next.latest.filter((item) => item.id !== displaced.id)].slice(0, limits.latest);
    }
  }

  return next;
}
