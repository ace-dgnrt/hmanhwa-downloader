import { error, result } from "error-result";
import HTMLParser from "node-html-parser";

import { extractManhwaTitle } from "@Routines/DownloadManhwa/Helpers/ExtractManhwaTitle";
import { sortChapters } from "@Routines/DownloadManhwa/Helpers/SortChapterAnchors";
import { startScrapperWorker } from "@Workers/SPAScrapper.ts/StartScrapperWorker";

export async function downloadManhwaInfo(url: string) {
  const pageHtml = await startScrapperWorker(url, {
    selectorToWait: ".wp-manga-chapter",
  });

  if (pageHtml.error) {
    return error(pageHtml.error);
  }

  const document = HTMLParser(pageHtml.data);

  const chapters: HTMLAnchorElement[] = document
    .querySelectorAll(".wp-manga-chapter > a")
    .reverse() as any;

  sortChapters(chapters);

  const title = extractManhwaTitle(document);

  return result({ title, chapters });
}
