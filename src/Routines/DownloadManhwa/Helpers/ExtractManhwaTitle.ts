import type { HTMLElement } from "node-html-parser";

export function extractManhwaTitle(document: HTMLElement) {
  const breadcrumbs = document.querySelectorAll("ol.breadcrumb > li");
  if (breadcrumbs.length === 0) return "Unknown";
  const lastBreadcrumb = breadcrumbs[breadcrumbs.length - 1];
  const anchor = lastBreadcrumb.querySelector("a");
  if (!anchor) return "Unknown";
  const text = anchor.innerText;
  const title = text.replace(/[^0-9a-zA-Z,.?!':\s]/g, "");
  return title;
}
