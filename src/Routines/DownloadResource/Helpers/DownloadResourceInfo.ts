import { error, result } from "error-result";
import HTMLParser from "node-html-parser";

import {
  retrieveTitleAndChapter,
} from "@Routines/DownloadResource/Helpers/RetrieveTitleAndChapter";
import { extractSrc } from "@Utils/images";
import { startScrapperWorker } from "@Workers/SPAScrapper.ts/StartScrapperWorker";

export async function downloadResourceInfo(url: string, index: number) {
  const htmlResults = await startScrapperWorker(url, {
    selectorToWait: "#wp-manga-current-chap",
  });

  if (htmlResults.error) {
    return error(htmlResults.error);
  }

  if (typeof htmlResults.data !== "string") {
    return error("Fetched data is not a proper string data.");
  }

  const document = HTMLParser(htmlResults.data);

  const chapter = retrieveTitleAndChapter(document);

  const images = document.querySelectorAll(
    "img.wp-manga-chapter-img"
  ) as any as HTMLImageElement[];

  return result({
    title: chapter.title,
    number: chapter.number ?? index + 1,
    images: images
      .reverse()
      .map(extractSrc)
      .filter((elem): elem is string => elem !== undefined),
  });
}
