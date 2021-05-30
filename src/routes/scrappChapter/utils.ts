import HTMLParser from "node-html-parser";
import path from "path";
import { Methods } from "../../API/types";
import { getCurrentHoster } from "../../scrapHoster";
import type { Chapter } from "../../scrapHoster/ChapterController/ChapterController";
import { getChapterController } from "../../scrapHoster/ChapterController/ChapterController";
import { extractSrc, fetchRetry } from "../../utils/images";
import { Logger } from "../../utils/Logger";

export async function fetchChapter(chapterUrl: string) {
  const rawHtml = await fetchRetry(chapterUrl, {
    method: Methods.GET,
  }).then((data) => data.text());

  const document = HTMLParser(rawHtml);
  const chapterTitle =
    document.querySelector("#chapter-heading")?.innerText || "";
  const images = (document.querySelectorAll(
    "img.wp-manga-chapter-img"
  ) as any) as HTMLImageElement[];

  if (images.length < 1) {
    return { images: [], chapterTitle };
  }

  const imagesSrc = images.map(extractSrc);

  const imageList: Array<Promise<{ data: Buffer; name: string }>> = [];

  for (const imageIndex in imagesSrc) {
    const imageUrl = imagesSrc[imageIndex];
    imageList.push(
      new Promise(async (resolve, reject) => {
        try {
          const data = await fetchRetry(imageUrl, {
            method: Methods.GET,
          });
          const urlParts = imageUrl.split("/");
          const name = urlParts[urlParts.length - 1];
          resolve({
            data: await data.buffer(),
            name: `${Number(imageIndex) + 1}${path.extname(name)}`,
          });
        } catch (e) {
          Logger.warning(e.message, e);
          reject(e);
        }
      })
    );
  }

  const results = await Promise.all(imageList);
  console.assert(
    results.length === imagesSrc.length,
    "Not all images have been fetched",
    results,
    imagesSrc
  );

  return { images: results, chapterTitle };
}

export const getChapterEntry = async (url: string) => {
  const hoster = getCurrentHoster();
  const existingEntry = hoster.getByUrl(url);

  if (existingEntry) {
    return existingEntry;
  }

  const chapterController = getChapterController();

  const chapter = await (async () => {
    const chap = chapterController.getChapter(url);
    if (chap) {
      return chap;
    }
    const c = await chapterController.addChapter(url);

    return await new Promise<Chapter>((resolve, reject) => {
      c.onLoad((chapter) => {
        if (chapter) {
          resolve(chapter);
        } else {
          reject();
        }
      });
    });
  })();

  const entry = await hoster.addNewEntry([chapter], chapter.chapterName, url);

  return entry;
};
