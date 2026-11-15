const KEY = "workit.v1";
const hasLS = typeof localStorage !== "undefined";

export function loadDocs() {
  if (!hasLS) return null;
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || "null");
    if (!saved || !Array.isArray(saved.docs)) return null;
    return saved.docs.map((d) => ({
      id: String(d?.id ?? ""),
      type: String(d?.type ?? "doc"),
      title: String(d?.title ?? "Untitled").trim() || "Untitled",
      body: typeof d?.body === "string" ? d.body : d?.body ? JSON.stringify(d.body) : "",
      cells: d?.cells && typeof d?.cells === "object" ? d.cells : {},
      slides: Array.isArray(d?.slides) ? d.slides : [],
      starred: Boolean(d?.starred),
      createdAt: Number(d?.createdAt) || Date.now(),
      updatedAt: Number(d?.updatedAt) || Date.now(),
    }));
  } catch (err) {
    console.warn("Saved data unreadable; starting fresh.", err);
    return null;
  }
}

export function saveDocs(docs) {
  if (!hasLS) return false;
  try {
    localStorage.setItem(KEY, JSON.stringify({ docs }));
    return true;
  } catch (err) {
    console.warn("Could not save.", err);
    return false;
  }
}

export function loadTheme() {
  try { return localStorage.getItem("workit.theme") || null; } catch { return null; }
}
export function saveTheme(theme) {
  try { localStorage.setItem("workit.theme", theme); } catch { /* blocked in some frames */ }
}