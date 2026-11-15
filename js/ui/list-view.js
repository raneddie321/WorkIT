import { el, timeAgo } from "../utils.js";
import { getDocs, createDoc, toggleStar, subscribe } from "../state.js";

const typeLabel = { doc: "Doc", sheet: "Sheet", table: "Table", slides: "Slides" };

export function mountList(root, type, label) {
  let query = "";
  let wrap = null;

  function docCard(d) {
    return el("div", { class: "doc-card", "data-id": d.id },
      el("a", { href: `#/d/${d.id}`, style: "display:block;color:inherit;text-decoration:none" },
        el("div", { class: "title" }, d.title),
        el("div", { class: "meta" }, `${typeLabel[d.type]} · edited ${timeAgo(d.updatedAt)}`)),
      el("button", {
        class: "star" + (d.starred ? " on" : ""), "data-action": "star",
        "aria-label": (d.starred ? "Unstar" : "Star") + " " + d.title,
      }, el("svg", { viewBox: "0 0 24 24", "aria-hidden": "true" },
        el("path", { d: "M12 3l2.7 5.6 6.1.8-4.5 4.3 1.1 6L12 16.8 6.6 19.7l1.1-6L3.2 9.4l6.1-.8z" }))));
  }

  function render() {
    const docs = getDocs()
      .filter((d) => d.type === type && (!query || d.title.toLowerCase().includes(query)))
      .sort((a, b) => b.updatedAt - a.updatedAt);

    wrap = el("div");
    wrap.replaceChildren(
      el("div", { class: "editor-header" },
        el("h1", { style: "flex:1;margin:0" }, label),
        el("button", { class: "btn primary", type: "button", "data-new": type }, "+ New")),
      docs.length
        ? el("div", { class: "doc-grid" }, docs.map(docCard))
        : el("div", { class: "empty-state card" },
            el("h2", {}, query ? `No ${label.toLowerCase()} match “${query}”` : `No ${label.toLowerCase()} yet`),
            el("p", {}, query ? "Try a different search term." : "Create one to get started."),
            el("a", { class: "btn primary", href: "#/" }, "Go Home →")));
    wrap.addEventListener("click", onClick);
    root.replaceChildren(wrap);
  }

  function onClick(e) {
    const star = e.target.closest('[data-action="star"]');
    if (star) { e.preventDefault(); toggleStar(star.closest("[data-id]").dataset.id); return; }
    const newBtn = e.target.closest("[data-new]");
    if (newBtn) {
      const doc = createDoc({ type, title: "Untitled " + typeLabel[type] });
      location.hash = "#/d/" + doc.id;
    }
  }

  render();
  const onSearch = (e) => { query = String(e.detail ?? ""); render(); };
  addEventListener("workit:search", onSearch);
  const unsub = subscribe(render);
  return () => { unsub(); removeEventListener("workit:search", onSearch); };
}