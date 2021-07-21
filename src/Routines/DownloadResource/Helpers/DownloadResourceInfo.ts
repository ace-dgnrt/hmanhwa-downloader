import { error, result } from "error-result";
import HTMLParser from "node-html-parser";
import { extractSrc } from "../../../Utils/images";
import { startDownloadWorker } from "../../../Workers/DownloadWorker/StartDownloadWorker";
import { addDownloadToQueue } from "./DownloadQueue";

export async function downloadResourceInfo(url: string) {
  const htmlResults = await addDownloadToQueue(() =>
    startDownloadWorker<string>(url)
  );

  if (htmlResults.error) {
    return error(htmlResults.error);
  }

  if (typeof htmlResults.data !== "string") {
    return error("Fetched data is not a proper string data.");
  }

  const document = HTMLParser(htmlResults.data);

  const chapterTitle =
    document.querySelector("#chapter-heading")?.innerText || "";

  const images = document.querySelectorAll(
    "img.wp-manga-chapter-img"
  ) as any as HTMLImageElement[];

  return result({
    title: chapterTitle,
    images: images
      .reverse()
      .map(extractSrc)
      .filter((elem): elem is string => elem !== undefined),
  });
}
