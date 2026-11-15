import { el, timeAgo, toast } from "../utils.js";
import { getDocs, createDoc, toggleStar, subscribe } from "../state.js";

function docCard(doc) {
  return el("div", { class: "doc-card", "data-id": doc.id },
    el("a", { href: `#/d/${doc.id}`, style: "display:block;color:inherit;text-decoration:none" },
      el("div", { class: "title" }, doc.title),
      el("div", { class: "meta" }, `${doc.type[0].toUpperCase() + doc.type.slice(1)} · edited ${timeAgo(doc.updatedAt)}`)),
    el("button", {
      class: "star" + (doc.starred ? " on" : ""), "data-action": "star",
      "aria-label": (doc.starred ? "Unstar" : "Star") + " " + doc.title,
      }, el("svg", { viewBox: "0 0 24 24", "aria-hidden": "true" },
        el("path", { d: "M12 3l2.7 5.6 6.1.8-4.5 4.3 1.1 6L12 16.8 6.6 19.7l1.1-6L3.2 9.4l6.1-.8z" }))));
  }

function docGrid(docs, emptyTitle, emptyText, action) {
  if (!docs.length) {
    const box = el("div", { class: "empty-state card" },
      el("h2", {}, emptyTitle),
      el("p", {}, emptyText));
    if (action) box.append(action);
    return box;
  }
  return el("div", { class: "doc-grid" }, docs.map(docCard));
}

export function mountDashboard(root) {
  let query = "";
  let wrap = null;
  const matches = (d) => !query || d.title.toLowerCase().includes(query);

  function render() {
    const docs = getDocs();
    const starred = docs.filter((d) => d.starred && matches(d));
    const recent = docs.filter(matches).sort((a, b) => b.updatedAt - a.updatedAt).slice(0, query ? 100 : 8);

    wrap = el("div");
    wrap.replaceChildren(
      el("h1", {}, "Good day, Eddie"),
      el("p", { style: "color:var(--muted)" },
        query ? `Search results for “${query}”` : "Everything you're working on, in one place."),

      el("div", { class: "kpi-row" },
        [["Documents", docs.filter((d) => d.type === "doc").length],
         ["Spreadsheets", docs.filter((d) => d.type === "sheet").length],
         ["Tables", docs.filter((d) => d.type === "table").length],
         ["Starred", starred.length]].map(([label, value]) =>
          el("div", { class: "card kpi" }, el("div", { class: "value" }, String(value)), el("div", { class: "label" }, label)))),

      el("div", { class: "template-row" },
        [["Blank doc", "doc"], ["Budget sheet", "sheet"], ["Project table", "table"], ["Pitch deck", "slides"]].map(([t, type]) =>
          el("a", { class: "template-chip", href: "#", "data-create": type },
            el("svg", { viewBox: "0 0 24 24", "aria-hidden": "true" }, el("path", { d: "M12 5v14M5 12h14" })), "New " + t))),

      el("div", { class: "section-head" }, el("h2", {}, "Starred")),
      docGrid(starred,
        query ? "No starred documents match your search" : "No starred documents yet",
        query ? "Try a different term or clear the search." : "Click the star on a document to pin it here."),

      el("div", { class: "section-head" }, el("h2", {}, "Recent"), el("a", { href: "#/docs" }, "All Docs →")),
      docGrid(recent,
        query ? "No documents match your search" : "Nothing here yet",
        query ? "Try a different term." : "Create your first document to get started.",
        query ? null : el("a", { class: "btn primary", href: "#/docs" }, "Open Docs")),
    );
    wrap.addEventListener("click", onClick);
    root.replaceChildren(wrap);
  }

  function onClick(e) {
    const star = e.target.closest('[data-action="star"]');
    if (star) { e.preventDefault(); toggleStar(star.closest("[data-id]").dataset.id); return; }
    const create = e.target.closest("[data-create]");
    if (create) {
      e.preventDefault();
      const type = create.dataset.create;
      const doc = createDoc({ type, title: "Untitled " + type });
      toast("Created " + doc.title);
      location.hash = "#/d/" + doc.id;
    }
  }

  render();
  const onSearch = (e) => { query = String(e.detail ?? ""); render(); };
  addEventListener("workit:search", onSearch);
  const unsub = subscribe(render);
  return () => { unsub(); removeEventListener("workit:search", onSearch); };
}