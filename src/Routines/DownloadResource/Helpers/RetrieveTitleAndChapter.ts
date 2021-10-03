import { trim } from "lodash";

import type { HTMLElement } from "node-html-parser";

function retrieveTitle(document: HTMLElement) {
  const header = document.querySelector("#chapter-heading")?.innerText;

  if (header && header.length > 0) return header;

  const breadcrumbs = document.querySelectorAll("wp-manga-nav breadcrumb li");
  const breadcrumbTitle = breadcrumbs[breadcrumbs.length - 2].innerText;

  if (breadcrumbTitle && breadcrumbTitle.length > 0) return breadcrumbTitle;

  return "Unknown Title";
}

function retrieveChapterNumber(document: HTMLElement) {
  const removeNonNumericChars = (s: string) =>
    trim(trim(s.replace(/[^0-9,.]/g, ""), "."), ",").replace(/[.,]+/g, ".");

  const selector = document.querySelector(".selectpicker_chapter");
  const selectedOption = selector.querySelector(
    'option[selected="selected"]'
  ) as any as HTMLOptionElement;

  const optionNumber = removeNonNumericChars(selectedOption.innerText ?? "");

  if (optionNumber && optionNumber.length > 0) {
    return Number(optionNumber);
  }

  const breadcrumbs = document.querySelectorAll("wp-manga-nav breadcrumb li");
  const breadcrumbChapterNumber = removeNonNumericChars(
    breadcrumbs[breadcrumbs.length - 1]?.innerText ?? ""
  );

  if (breadcrumbChapterNumber && breadcrumbChapterNumber.length > 0)
    return Number(breadcrumbChapterNumber);

  return undefined;
}

export function retrieveTitleAndChapter(document: HTMLElement) {
  return {
    title: retrieveTitle(document),
    number: retrieveChapterNumber(document),
  };
}
