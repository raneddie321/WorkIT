import { loadDocs, saveDocs } from "./storage.js";
import { uid } from "./utils.js";
import { seedDocs } from "./seed.js";

let docs = loadDocs();
if (!docs) { docs = seedDocs(); saveDocs(docs); }

export const getDocs = () => docs;

export function findDoc(id) {
  return docs.find((d) => d.id === id) || null;
}

function touch(list) {
  docs = list;
  saveDocs(docs);
  notify();
}

export function createDoc({ type = "doc", title = "Untitled", body = "", cells = {}, slides = [] }) {
  const doc = { id: uid(), type, title, body, cells, slides, starred: false, createdAt: Date.now(), updatedAt: Date.now() };
  touch([doc, ...docs]);
  return doc;
}

export function updateDoc(id, patch) {
  touch(docs.map((d) => (d.id === id ? { ...d, ...patch, updatedAt: Date.now() } : d)));
}

export function deleteDoc(id) {
  touch(docs.filter((d) => d.id !== id));
}

export function toggleStar(id) {
  touch(docs.map((d) => (d.id === id ? { ...d, starred: !d.starred, updatedAt: d.updatedAt } : d)));
}

const listeners = new Set();
export function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }
function notify() { [...listeners].forEach((fn) => fn(docs)); }

/** Evaluate a spreadsheet formula. Supports ranges, basic arithmetic and common functions. */
export function evaluateFormula(expr, cells) {
  const cache = new Map();
  function cellValue(ref) {
    if (cache.has(ref)) return cache.get(ref);
    cache.set(ref, 0); // guard cycles
    const raw = cells[ref];
    let v = 0;
    if (typeof raw === "string" && raw.startsWith("=")) v = toNumber(evalExpr(raw.slice(1).trim()));
    else v = toNumber(raw);
    cache.set(ref, v);
    return v;
  }
  const toNumber = (v) => {
    if (v === "" || v == null) return 0;
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };
  function rangeValues(a, b) {
    const [ca, ra] = [a.match(/[A-Z]+/)[0], Number(a.match(/\d+/)[0])];
    const [cb, rb] = [b.match(/[A-Z]+/)[0], Number(b.match(/\d+/)[0])];
    const vals = [];
    for (let c = colToIdx(ca); c <= colToIdx(cb); c++) {
      for (let r = Math.min(ra, rb); r <= Math.max(ra, rb); r++) vals.push(cellValue(idxToCol(c) + r));
    }
    return vals;
  }
  const colToIdx = (s) => s.split("").reduce((n, ch) => n * 26 + (ch.charCodeAt(0) - 64), 0);
  const idxToCol = (n) => { let s = ""; while (n > 0) { s = String.fromCharCode(65 + ((n - 1) % 26)) + s; n = Math.floor((n - 1) / 26); } return s; };

  function evalFn(name, args) {
    const nums = [];
    for (const raw of args) {
      const a = raw.toUpperCase();
      if (/[A-Z]+\d+:[A-Z]+\d+/.test(a)) nums.push(...rangeValues(a.split(":")[0], a.split(":")[1]));
      else if (/^[A-Z]+\d+$/.test(a)) nums.push(cellValue(a));
      else nums.push(Number(a));
    }
    const f = {
      SUM: () => nums.reduce((s, n) => s + n, 0),
      AVERAGE: () => (nums.length ? nums.reduce((s, n) => s + n, 0) / nums.length : 0),
      MIN: () => (nums.length ? Math.min(...nums) : 0),
      MAX: () => (nums.length ? Math.max(...nums) : 0),
      COUNT: () => nums.filter((n) => Number.isFinite(n)).length,
      PRODUCT: () => nums.reduce((p, n) => p * n, 1),
    }[name.toUpperCase()];
    return f ? f() : NaN;
  }

  function evalExpr(src) {
    // replace function calls then refs then numbers; left-to-right arithmetic
    let s = src;
    s = s.replace(/(SUM|AVERAGE|MIN|MAX|COUNT|PRODUCT)\(([^()]*)\)/gi, (m, name, argstr) =>
      String(evalFn(name, argstr.split(",").map((a) => a.trim()))));
    s = s.replace(/([A-Z]+)(\d+)((?::)([A-Z]+)(\d+))?/g, (m) => m); // ranges inside arithmetic
    s = s.replace(/\b([A-Za-z]+)(\d+)\b/g, (m) => String(cellValue(m.toUpperCase())));
    if (!/^[-+*/().\d\s]*$/.test(s)) return NaN;
    try {
      const val = Function(`"use strict"; return (${s || 0})`)();
      return Number.isFinite(val) ? val : NaN;
    } catch { return NaN; }
  }

  const out = evalExpr(expr);
  return Number.isFinite(out) ? Math.round(out * 1e10) / 1e10 : NaN;
}