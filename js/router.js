const routes = [
  { pattern: /^\/$/, key: "home" },
  { pattern: /^\/docs$/, key: "docs" },
  { pattern: /^\/sheets$/, key: "sheets" },
  { pattern: /^\/tables$/, key: "tables" },
  { pattern: /^\/slides$/, key: "slides" },
  { pattern: /^\/pricing$/, key: "pricing" },
  { pattern: /^\/d\/([^/]+)$/, key: "doc", param: "id" },
];
const subs = new Set();

function parse() {
  const hash = location.hash.replace(/^#/, "") || "/";
  for (const r of routes) {
    const m = hash.match(r.pattern);
    if (m) return { key: r.key, param: r.param ? m[1] : null };
  }
  return { key: "home", param: null };
}

export function startRouter() {
  const emit = () => subs.forEach((fn) => fn(parse()));
  addEventListener("hashchange", emit);
  emit();
}

export function onRoute(fn) { subs.add(fn); }

export function go(path) { location.hash = path; }