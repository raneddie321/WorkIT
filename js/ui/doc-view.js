import { el, debounce, toast, confirmDialog } from "../utils.js";
import { findDoc, updateDoc, deleteDoc, evaluateFormula } from "../state.js";

const SHEET_ROWS = 30;
const SHEET_COLS = 12;

function colName(n) {
  let s = "";
  while (n > 0) { s = String.fromCharCode(64 + ((n - 1) % 26)) + s; n = Math.floor((n - 1) / 26); }
  return s;
}

function parseTableBody(body) {
  try {
    const d = JSON.parse(body || "{}");
    if (!Array.isArray(d.fields) || !Array.isArray(d.rows)) throw new Error("bad shape");
    return d;
  } catch {
    return { fields: [{ name: "Name", type: "text" }], rows: [] };
  }
}

const slideOf = (s) => ({ title: String(s?.title ?? ""), text: String(s?.text ?? "") });

export function mountDocView(root, id, backHref) {
  const doc = findDoc(id);
  if (!doc) {
    root.replaceChildren(
      el("div", { class: "empty-state card" },
        el("h2", {}, "Not found"),
        el("p", {}, "This document doesn't exist (or was deleted)."),
        el("a", { class: "btn", href: backHref || "#/" }, "Back home")));
    return () => {};
  }

  const header = el("div", { class: "editor-header" },
    el("a", { class: "btn", href: backHref || "#/" }, "← Back"),
    el("input", {
      class: "editor-title", value: doc.title, "aria-label": "Document title",
      oninput: (ev) => { updateDoc(id, { title: ev.target.value || "Untitled" }); flashSaved("title"); },
    }),
    el("button", { class: "btn danger", id: "delete-btn", type: "button" }, "Delete"),
    el("span", { class: "status-line", id: "save-status" }, "All changes saved"),
  );

  let body;
  if (doc.type === "sheet") body = renderSheet();
  else if (doc.type === "table") body = renderTable();
  else if (doc.type === "slides") body = renderSlides();
  else body = renderRichText();

  const wrap = el("div", {}, header, body);
  root.replaceChildren(wrap);

  const saveStatus = root.querySelector("#save-status");
  function flashSaved(what) {
    saveStatus.textContent = "Saving " + what + "…";
    setTimeout(() => { saveStatus.textContent = "All changes saved"; }, 500);
  }

  // ---- Doc: rich text ----
  if (doc.type === "doc") {
    const ed = root.querySelector(".doc-body");
    ed.innerHTML = doc.body || "<p><br></p>";
    const save = debounce(() => {
      updateDoc(id, { body: ed.innerHTML });
      flashSaved("document");
    }, 600);
    ed.addEventListener("input", save);

    root.querySelector(".toolbar").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-cmd]");
      if (!btn) return;
      e.preventDefault();
      document.execCommand(btn.dataset.cmd, false, btn.dataset.arg || null);
      ed.focus();
      save();
    });
    wrap.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        updateDoc(id, { body: ed.innerHTML });
        toast("Saved");
      }
    });

    const wc = root.querySelector("#word-count");
    const count = () => { wc.textContent = (ed.innerText.trim().match(/\S+/g) || []).length + " words"; };
    ed.addEventListener("input", count);
    count();
  }

  // ---- Sheet ----
  if (doc.type === "sheet") {
    const cells = { ...doc.cells };
    const selected = root.querySelector("#selected-ref");
    const bar = root.querySelector("#formula-input");
    const grid = root.querySelector("table.sheet");
    let selRef = "A1";

    const display = (ref) => {
      const raw = cells[ref];
      if (raw == null || raw === "") return "";
      if (typeof raw === "string" && raw.startsWith("=")) {
        const v = evaluateFormula(raw.slice(1), cells);
        return Number.isNaN(v) ? "#ERROR" : String(v);
      }
      return String(raw);
    };

    function repaint() {
      for (const td of grid.querySelectorAll("td[data-ref]")) {
        const v = display(td.dataset.ref);
        const input = td.querySelector("input");
        input.value = v;
        input.classList.toggle("err", v === "#ERROR");
        td.classList.toggle("num", v !== "" && v !== "#ERROR" && !Number.isNaN(Number(v)));
      }
    }
    repaint();

    function setCell(ref, value) {
      if (value === "") delete cells[ref];
      else cells[ref] = value;
      updateDoc(id, { cells });
      repaint();
      flashSaved("sheet");
    }

    grid.addEventListener("focusin", (e) => {
      const input = e.target.closest("td[data-ref] input");
      if (!input) return;
      const td = input.closest("td");
      selRef = td.dataset.ref;
      selected.textContent = selRef;
      bar.value = cells[selRef] ?? "";
      grid.querySelectorAll("td.selected").forEach((t) => { if (t !== td) t.classList.remove("selected"); });
      td.classList.add("selected");
    });
    bar.addEventListener("change", () => setCell(selRef, bar.value.trim()));
    grid.addEventListener("change", (e) => {
      const input = e.target.closest("td[data-ref] input");
      if (input) setCell(input.closest("td").dataset.ref, input.value.trim());
    });
  }

  // ---- Table ----
  if (doc.type === "table") {
    const data = parseTableBody(doc.body);
    let sortBy = null, asc = true, filter = "";
    const table = root.querySelector("table.db");

    function render() {
      let rows = data.rows.map((r, i) => ({ r, i }));
      if (filter) {
        const f = filter.toLowerCase();
        rows = rows.filter(({ r }) => r.some((v) => String(v ?? "").toLowerCase().includes(f)));
      }
      if (sortBy != null) {
        rows.sort((a, b) => {
          const x = a.r[sortBy], y = b.r[sortBy];
          const nx = Number(x), ny = Number(y);
          const cmp = Number.isFinite(nx) && Number.isFinite(ny) ? nx - ny : String(x ?? "").localeCompare(String(y ?? ""));
          return asc ? cmp : -cmp;
        });
      }

      table.querySelector("thead").replaceChildren(
        el("tr", {},
          ...data.fields.map((f, c) => el("th", {
            scope: "col", "data-col": String(c),
            "aria-sort": sortBy === c ? (asc ? "ascending" : "descending") : "none",
          }, el("button", { type: "button" }, f.name))),
          el("th", { scope: "col" }, "")));

      const bodyRows = rows.length
        ? rows.map(({ r, i }) =>
            el("tr", { "data-row": String(i) },
              ...data.fields.map((f, c) => f.type === "status"
                ? el("td", {}, el("span", { class: "pill", "data-status": String(r[c] ?? "") }, String(r[c] ?? "")))
                : el("td", {}, el("input", { value: r[c] ?? "", "data-col": String(c), "aria-label": f.name }))),
              el("td", {}, el("button", { class: "btn danger", "data-delrow": String(i), "aria-label": "Delete row", type: "button" }, "✕"))))
        : [el("tr", {}, el("td", { colspan: String(data.fields.length + 1), style: "text-align:center;color:var(--muted);padding:24px" }, "No rows match the filter."))];
      table.querySelector("tbody").replaceChildren(...bodyRows);
    }
    render();

    table.addEventListener("click", (e) => {
      const th = e.target.closest("th[data-col]");
      if (th) {
        const c = Number(th.dataset.col);
        if (sortBy === c) { if (asc) asc = false; else { sortBy = null; asc = true; } }
        else { sortBy = c; asc = true; }
        render();
        return;
      }
      const del = e.target.closest("[data-delrow]");
      if (del) {
        data.rows.splice(Number(del.dataset.delrow), 1);
        updateDoc(id, { body: JSON.stringify(data) });
        render();
        flashSaved("table");
      }
    });
    table.addEventListener("change", (e) => {
      const input = e.target.closest("td input[data-col]");
      if (!input) return;
      data.rows[Number(input.closest("tr").dataset.row)][Number(input.dataset.col)] = input.value;
      updateDoc(id, { body: JSON.stringify(data) });
      flashSaved("table");
    });
    root.querySelector("#row-add").addEventListener("click", () => {
      data.rows.push(data.fields.map(() => ""));
      updateDoc(id, { body: JSON.stringify(data) });
      render();
    });
    root.querySelector("#table-filter").addEventListener("input", (e) => { filter = e.target.value; render(); });
  }

  // ---- Slides ----
  if (doc.type === "slides") {
    const slides = doc.slides.length ? doc.slides : [{ title: "Slide 1", text: "" }];
    let idx = 0;
    const stage = root.querySelector("#slide-stage");
    const thumbs = root.querySelector(".slide-list");
    const titleIn = root.querySelector("#slide-title");
    const textIn = root.querySelector("#slide-text");

    function renderSlide() {
      const s = slideOf(slides[idx] || {});
      stage.replaceChildren(
        s.title ? el("h2", {}, s.title) : el("div", {}),
        s.text ? el("p", { style: "color:var(--muted);font-size:clamp(14px,2vw,20px)" }, s.text) : el("div", {}),
      );
      thumbs.replaceChildren(...slides.map((sl, i) => {
        const t = slideOf(sl);
        return el("button", {
          class: "slide-thumb" + (i === idx ? " active" : ""), "data-idx": String(i),
          type: "button", "aria-label": "Slide " + (i + 1),
        }, el("strong", {}, t.title || "—"), el("div", {}, t.text.slice(0, 60)));
      }));
      root.querySelector("#slide-num").textContent = "Slide " + (idx + 1) + " / " + slides.length;
    }
    function loadFields() {
      const s = slideOf(slides[idx] || {});
      titleIn.value = s.title;
      textIn.value = s.text;
    }
    function go(i) { idx = i; renderSlide(); loadFields(); }

    renderSlide();
    loadFields();

    const saveFields = debounce(() => {
      updateDoc(id, { slides });
      renderSlide();
      flashSaved("slides");
    }, 400);
    const onFieldInput = () => {
      slides[idx] = { title: titleIn.value, text: textIn.value };
      saveFields();
    };
    titleIn.addEventListener("input", onFieldInput);
    textIn.addEventListener("input", onFieldInput);

    thumbs.addEventListener("click", (e) => {
      const t = e.target.closest("[data-idx]");
      if (t) go(Number(t.dataset.idx));
    });
    root.querySelector("#slide-prev").addEventListener("click", () => { if (idx > 0) go(idx - 1); });
    root.querySelector("#slide-next").addEventListener("click", () => { if (idx < slides.length - 1) go(idx + 1); });
    root.querySelector("#slide-add").addEventListener("click", () => {
      slides.push({ title: "New slide", text: "" });
      go(slides.length - 1);
      updateDoc(id, { slides });
      flashSaved("slides");
    });
    root.querySelector("#slide-del").addEventListener("click", () => {
      if (slides.length <= 1) { toast("A deck needs at least one slide."); return; }
      slides.splice(idx, 1);
      go(Math.min(idx, slides.length - 1));
      updateDoc(id, { slides });
      flashSaved("slides");
    });
  }

  root.querySelector("#delete-btn").addEventListener("click", async () => {
    if (await confirmDialog("Delete this document?", { danger: true })) {
      deleteDoc(id);
      toast("Deleted");
      location.hash = backHref || "#/";
    }
  });

  return () => {};
}

function renderRichText() {
  function toolBtn(label, cmd, arg) {
    return el("button", { class: "tool-btn", type: "button", "data-cmd": cmd, ...(arg ? { "data-arg": arg } : {}), title: cmd }, label);
  }
  return el("div", {},
    el("div", { class: "toolbar", role: "toolbar", "aria-label": "Formatting" },
      toolBtn("B", "bold"), toolBtn("I", "italic"), toolBtn("U", "underline"),
      el("span", { class: "tool-sep" }),
      toolBtn("H2", "formatBlock", "h2"), toolBtn("P", "formatBlock", "p"),
      el("span", { class: "tool-sep" }),
      toolBtn("• List", "insertUnorderedList"), toolBtn("1. List", "insertOrderedList"),
      toolBtn("❝", "formatBlock", "blockquote"),
      el("span", { class: "tool-sep" }),
      toolBtn("Clear", "removeFormat")),
    el("div", { class: "doc-body", contenteditable: "true", role: "textbox", "aria-multiline": "true", "aria-label": "Document body" }),
    el("div", { class: "status-line" }, el("span", { id: "word-count" }), el("span", {}, "Ctrl+S saves")));
}

function renderSheet() {
  const head = el("tr", {},
    el("th", { class: "row-head", scope: "col" }, ""),
    ...Array.from({ length: SHEET_COLS }, (_, i) => el("th", { scope: "col" }, colName(i + 1))));
  const rows = Array.from({ length: SHEET_ROWS }, (_, r) =>
    el("tr", {},
      el("th", { class: "row-head", scope: "row" }, String(r + 1)),
      ...Array.from({ length: SHEET_COLS }, (_, c) =>
        el("td", { "data-ref": colName(c + 1) + (r + 1) },
          el("input", { "aria-label": colName(c + 1) + " row " + (r + 1) })))));
  return el("div", {},
    el("div", { class: "formula-bar" },
      el("span", { class: "cellref", id: "selected-ref" }, "A1"),
      el("input", { id: "formula-input", placeholder: "Value or =SUM(A1:A5)", "aria-label": "Formula" })),
    el("div", { class: "sheet-wrap" }, el("table", { class: "sheet" }, el("thead", {}, head), el("tbody", {}, rows))));
}

function renderTable() {
  return el("div", {},
    el("div", { style: "display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap" },
      el("input", { id: "table-filter", class: "global-search", style: "max-width:280px;flex:1", type: "search", placeholder: "Filter rows…", "aria-label": "Filter rows" }),
      el("button", { class: "btn primary", id: "row-add", type: "button" }, "+ Row")),
    el("div", { style: "overflow:auto;border-radius:12px" },
      el("table", { class: "db" }, el("thead", {}), el("tbody", {}))),
    el("p", { style: "font-size:13px;color:var(--muted);margin-top:8px" }, "Click a column header to sort. Values save automatically."));
}

function renderSlides() {
  return el("div", {},
    el("div", { class: "slide-view", id: "slide-stage", role: "region", "aria-label": "Slide preview" }),
    el("div", { style: "display:flex;gap:8px;align-items:center;margin:12px 0;flex-wrap:wrap" },
      el("button", { class: "btn", id: "slide-prev", type: "button" }, "← Prev"),
      el("button", { class: "btn", id: "slide-next", type: "button" }, "Next →"),
      el("span", { id: "slide-num", style: "font-size:13px;color:var(--muted)" }),
      el("span", { style: "flex:1" }),
      el("button", { class: "btn", id: "slide-add", type: "button" }, "+ Slide"),
      el("button", { class: "btn danger", id: "slide-del", type: "button" }, "Delete slide")),
    el("div", { style: "display:grid;gap:8px;max-width:480px" },
      el("label", {}, el("span", { style: "font-size:13px;color:var(--muted)" }, "Slide title"),
        el("input", { id: "slide-title", style: "display:block;width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:8px;background:var(--surface)", "aria-label": "Slide title" })),
      el("label", {}, el("span", { style: "font-size:13px;color:var(--muted)" }, "Slide text"),
        el("input", { id: "slide-text", style: "display:block;width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:8px;background:var(--surface)", "aria-label": "Slide text" }))),
    el("div", { class: "slide-list", "aria-label": "Slides" }));
}