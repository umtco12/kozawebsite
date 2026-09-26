/** Güncellenen listede görünür haber duruyorsa onu korur; kaldırıldıysa en yeni habere geçer. */
export function reconcileBreakingId(items, currentId) {
  if (!items.length) return null;
  return items.some((item) => item.id === currentId) ? currentId : items[0].id;
}

/** Son haberde yeniden ilk habere dönen kararlı rotasyon. */
export function nextBreakingId(items, currentId) {
  if (!items.length) return null;
  const currentIndex = items.findIndex((item) => item.id === currentId);
  return items[(currentIndex + 1 + items.length) % items.length].id;
}
