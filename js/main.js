import { startRouter, onRoute } from "./router.js";
import { loadTheme, saveTheme } from "./storage.js";
import { mountDashboard } from "./ui/dashboard.js";
import { mountList } from "./ui/list-view.js";
import { mountDocView } from "./ui/doc-view.js";
import { mountPricing } from "./ui/pricing.js";
import { getDocs } from "./state.js";

const viewRoot = document.querySelector("#view-root");
const sidebar = document.querySelector("#sidebar");
const scrim = document.querySelector("#scrim");
const menuBtn = document.querySelector("#menu-btn");
const search = document.querySelector("#global-search");

// Theme
function applyTheme(t) {
  document.documentElement.dataset.theme = t;
  document.querySelector("#theme-icon-sun").hidden = t !== "dark";
  document.querySelector("#theme-icon-moon").hidden = t === "dark";
}
applyTheme(loadTheme() || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
document.querySelector("#theme-btn").addEventListener("click", () => {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(next); saveTheme(next);
});

// Mobile drawer
menuBtn.addEventListener("click", () => {
  const open = sidebar.classList.toggle("open");
  menuBtn.setAttribute("aria-expanded", String(open));
  scrim.hidden = !open;
});
scrim.addEventListener("click", () => { sidebar.classList.remove("open"); scrim.hidden = true; menuBtn.setAttribute("aria-expanded", "false"); });
sidebar.addEventListener("click", (e) => {
  if (e.target.closest(".side-link")) { sidebar.classList.remove("open"); scrim.hidden = true; menuBtn.setAttribute("aria-expanded", "false"); }
});

// Search: filter dashboard/list via hash params
search.addEventListener("input", () => { window.dispatchEvent(new CustomEvent("workit:search", { detail: search.value })); });
addEventListener("keydown", (e) => {
  if (e.key === "/" && !e.target.closest("input,textarea,[contenteditable]")) {
    e.preventDefault(); search.focus();
  }
});

let cleanup = null;
function setView(fn, ...args) {
  if (cleanup) { try { cleanup(); } catch {} cleanup = null; }
  viewRoot.replaceChildren();
  cleanup = fn(viewRoot, ...args) || null;
  document.querySelector("#main").focus({ preventScroll: true });
  highlightNav();
}

function highlightNav() {
  const hash = location.hash || "#/";
  document.querySelectorAll(".side-link").forEach((a) => {
    const href = a.getAttribute("href");
    a.classList.toggle("active", hash === href || (href !== "#/" && hash.startsWith(href)));
  });
}

onRoute(({ key, param }) => {
  const doc = param ? getDocs().find((d) => d.id === param) : null;
  const back = { sheet: "#/sheets", table: "#/tables", slides: "#/slides", doc: "#/docs" }[doc?.type] || "#/";
  if (key === "home") setView(mountDashboard);
  else if (key === "docs") setView(mountList, "doc", "Docs");
  else if (key === "sheets") setView(mountList, "sheet", "Sheets");
  else if (key === "tables") setView(mountList, "table", "Tables");
  else if (key === "slides") setView(mountList, "slides", "Slides");
  else if (key === "pricing") setView(mountPricing);
  else if (key === "doc") setView(mountDocView, param, back);
  else setView(mountDashboard);
});

startRouter();