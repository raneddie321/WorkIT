export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === "class") node.className = v;
    else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v === true ? "" : String(v));
  }
  node.append(...children.flat().filter((c) => c != null && c !== false));
  return node;
}

export const escapeHtml = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export const uid = () =>
  globalThis.crypto?.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2);

export const relTime = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

export function timeAgo(ts) {
  const diff = Date.now() - Number(ts || 0);
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return relTime.format(-mins, "minute");
  const hours = Math.round(mins / 60);
  if (hours < 24) return relTime.format(-hours, "hour");
  return relTime.format(-Math.round(hours / 24), "day");
}

export function debounce(fn, ms = 300) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

export function toast(msg) {
  const region = document.querySelector("#toast-region");
  if (!region) return;
  const t = el("div", { class: "toast" }, msg);
  region.append(t);
  setTimeout(() => t.remove(), 2600);
}

export function confirmDialog(text, { danger = false } = {}) {
  return new Promise((resolve) => {
    const close = (val) => { backdrop.remove(); resolve(val); };
    const backdrop = el("div", { class: "dialog-backdrop", onclick: (e) => { if (e.target === backdrop) close(false); } },
      el("form", {
        class: "card dialog",
        onsubmit: (e) => { e.preventDefault(); close(true); },
      },
        el("h2", {}, text),
        el("div", { style: "display:flex;gap:8px;margin-top:16px" },
          el("button", { class: danger ? "btn danger" : "btn primary", type: "submit" }, "Confirm"),
          el("button", { class: "btn", type: "button", onclick: () => close(false) }, "Cancel"),
        ),
      ),
    );
    document.body.append(backdrop);
    backdrop.querySelector("button").focus();
    const onKey = (e) => { if (e.key === "Escape") { document.removeEventListener("keydown", onKey); close(false); } };
    document.addEventListener("keydown", onKey);
  });
}

export const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];