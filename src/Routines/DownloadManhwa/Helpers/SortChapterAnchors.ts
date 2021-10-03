export function sortChapters(chapters: HTMLAnchorElement[]) {
  chapters.sort((a, b) => {
    const aTitle = a.innerText;
    const bTitle = b.innerText;

    const aNumber = Number(aTitle.replace(/[^0-9]/g, ""));
    const bNumber = Number(bTitle.replace(/[^0-9]/g, ""));

    if (aNumber > bNumber) return 1;
    else if (aNumber < bNumber) return -1;
    return 0;
  });
}
