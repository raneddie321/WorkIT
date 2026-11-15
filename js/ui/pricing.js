import { el } from "../utils.js";

export function mountPricing(root) {
  const plans = [
    { name: "Free", price: "$0", per: "forever", feat: ["5 GB storage", "Docs, Sheets, Tables, Slides", "3 documents per type", "Community support"], cta: "Current plan", featured: false },
    { name: "Pro", price: "$9.99", per: "per month", feat: ["Unlimited documents", "50 GB storage", "Version history", "Priority support"], cta: "Upgrade to Pro", featured: true },
    { name: "Business", price: "$19.99", per: "per user / month", feat: ["Everything in Pro", "Team workspaces", "Real-time collaboration", "Admin controls"], cta: "Contact sales", featured: false },
    { name: "Enterprise", price: "Custom", per: "annual", feat: ["Everything in Business", "SSO & audit logs", "End-to-end encryption", "Dedicated success manager"], cta: "Contact sales", featured: false },
  ];
  root.replaceChildren(
    el("h1", {}, "Plans for every team"),
    el("p", { style: "color:var(--muted)" }, "Start free, upgrade when your team grows."),
    el("div", { class: "price-grid" }, plans.map((p) =>
      el("div", { class: "card price-card" + (p.featured ? " featured" : "") },
        el("h2", {}, p.name),
        el("div", { class: "price" }, p.price),
        el("div", { style: "color:var(--muted);font-size:13px" }, p.per),
        el("ul", {}, p.feat.map((f) => el("li", {}, f))),
        el(p.featured || p.name === "Free" ? "button" : "a",
          { class: "btn primary", ...(p.name !== "Free" && !p.featured ? { href: "mailto:sales@workit.app" } : {}) },
          p.cta)))),
    el("p", { style: "margin-top:32px;font-size:13px;color:var(--muted)" },
      "Payments open once the cloud backend goes live — your local workspace stays free."),
  );
}