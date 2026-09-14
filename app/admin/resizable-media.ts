import { DOMSerializer, type Node as ProseMirrorNode } from "@tiptap/pm/model";
import type { NodeViewRendererProps } from "@tiptap/core";
import { clampMediaWidth, MIN_MEDIA_WIDTH } from "./media-size-model.mjs";

function renderNodeDom(node: ProseMirrorNode) {
  const toDOM = node.type.spec.toDOM;
  if (!toDOM) throw new Error(`${node.type.name} düğümü DOM'a çevrilemiyor`);
  const dom = DOMSerializer.renderSpec(document, toDOM(node)).dom as HTMLElement;
  const sized = dom.matches("img,video,iframe") ? dom : dom.querySelector("img,video,iframe");
  (sized as HTMLElement | null)?.style.removeProperty("width");
  (sized as HTMLElement | null)?.style.removeProperty("height");
  return dom;
}
function sameSource(left: ProseMirrorNode, right: ProseMirrorNode) {
  const strip = (node: ProseMirrorNode) => JSON.stringify({ ...node.attrs, width: null, height: null });
  return left.type === right.type && strip(left) === strip(right);
}

export function resizableMediaView(className: string, ratio?: number) {
  return ({ node, editor, getPos }: NodeViewRendererProps) => {
    let current = node;
    let destroyed = false;
    let cancelDrag: (() => void) | undefined;
    const dom = document.createElement("div");
    dom.className = `rt-media ${className}`;
    dom.contentEditable = "false";
    let media = renderNodeDom(current);
    dom.append(media);
    const grip = document.createElement("button");
    grip.type = "button";
    grip.className = "rt-media-grip";
    grip.title = "Sürükleyerek boyutlandırın · Ok tuşlarıyla küçültün/büyütün";
    grip.setAttribute("role", "slider");
    grip.setAttribute("aria-label", className === "rt-media-image" ? "Görsel genişliği" : "Video genişliği");
    grip.setAttribute("aria-orientation", "horizontal");
    grip.disabled = !editor.isEditable;
    dom.append(grip);
    const maxWidth = () => {
      const parent = dom.parentElement;
      if (!parent) return 640;
      const style = getComputedStyle(parent);
      return Math.max(1, parent.clientWidth - parseFloat(style.paddingLeft || "0") - parseFloat(style.paddingRight || "0"));
    };
    const applyWidth = (value: number) => {
      if (value > 0) { dom.style.width = `${value}px`; dom.dataset.width = `${value}px`; }
      else { dom.style.removeProperty("width"); delete dom.dataset.width; }
      grip.setAttribute("aria-valuemin", String(Math.min(MIN_MEDIA_WIDTH, maxWidth())));
      grip.setAttribute("aria-valuemax", String(Math.round(maxWidth())));
      grip.setAttribute("aria-valuenow", String(Math.round(Math.min(value || dom.getBoundingClientRect().width || maxWidth(), maxWidth()))));
      grip.setAttribute("aria-valuetext", `${grip.getAttribute("aria-valuenow")} piksel`);
    };
    const commit = (width: number) => {
      if (destroyed || editor.isDestroyed || !editor.isEditable) return;
      const position = getPos();
      if (typeof position !== "number" || editor.state.doc.nodeAt(position)?.type !== current.type) return;
      // Resim ve yerel video kendi oranını korur; YouTube 16:9 olarak saklanır.
      const height = ratio ? Math.round(width / ratio) : null;
      editor.view.dispatch(editor.state.tr.setNodeMarkup(position, undefined, { ...current.attrs, width, height }));
    };
    applyWidth(Number(current.attrs.width) || 0);

    const onPointerDown = (event: PointerEvent) => {
      if (!editor.isEditable || event.button !== 0 || destroyed) return;
      event.preventDefault(); event.stopPropagation(); cancelDrag?.();
      const startX = event.clientX;
      const startWidth = dom.getBoundingClientRect().width;
      let width = Math.round(startWidth);
      const pointerId = event.pointerId;
      dom.classList.add("rt-media-resizing");
      // Capture, iframe üzerinden geçerken de sürüklemeyi tutamakta tutar.
      grip.setPointerCapture(pointerId);
      const move = (next: PointerEvent) => {
        if (next.pointerId !== pointerId) return;
        width = clampMediaWidth(startWidth + next.clientX - startX, maxWidth()); applyWidth(width);
      };
      const cleanup = () => {
        window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", finish);
        window.removeEventListener("pointercancel", cancel); window.removeEventListener("keydown", escape); window.removeEventListener("blur", cancel);
        if (grip.hasPointerCapture(pointerId)) grip.releasePointerCapture(pointerId);
        dom.classList.remove("rt-media-resizing"); cancelDrag = undefined;
      };
      const cancel = () => { cleanup(); applyWidth(Number(current.attrs.width) || 0); };
      const finish = (next: PointerEvent) => { if (next.pointerId !== pointerId) return; cleanup(); if (width !== Math.round(startWidth)) commit(width); };
      const escape = (next: KeyboardEvent) => { if (next.key === "Escape") { next.preventDefault(); cancel(); } };
      cancelDrag = cancel;
      window.addEventListener("pointermove", move); window.addEventListener("pointerup", finish);
      window.addEventListener("pointercancel", cancel); window.addEventListener("keydown", escape); window.addEventListener("blur", cancel);
    };
    grip.addEventListener("pointerdown", onPointerDown);
    const onKeyDown = (event: KeyboardEvent) => {
      if (!editor.isEditable || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault(); event.stopPropagation();
      const step = event.shiftKey ? 50 : 10;
      const width = dom.getBoundingClientRect().width;
      commit(clampMediaWidth(event.key === "Home" ? MIN_MEDIA_WIDTH : event.key === "End" ? maxWidth() : width + (event.key === "ArrowLeft" ? -step : step), maxWidth()));
    };
    grip.addEventListener("keydown", onKeyDown);
    return {
      dom,
      update(updated: ProseMirrorNode) {
        if (updated.type !== current.type) return false;
        if (!sameSource(current, updated)) { cancelDrag?.(); const next = renderNodeDom(updated); media.replaceWith(next); media = next; }
        current = updated; grip.disabled = !editor.isEditable; applyWidth(Number(updated.attrs.width) || 0); return true;
      },
      selectNode() { dom.classList.add("rt-media-selected"); },
      deselectNode() { dom.classList.remove("rt-media-selected"); },
      stopEvent: (event: Event) => event.target === grip,
      ignoreMutation: () => true,
      destroy() { destroyed = true; cancelDrag?.(); grip.removeEventListener("pointerdown", onPointerDown); grip.removeEventListener("keydown", onKeyDown); },
    };
  };
}
