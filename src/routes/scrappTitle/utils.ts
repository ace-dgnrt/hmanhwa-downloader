import fetch from "node-fetch";
import { Methods } from "../../API/types";
import { getCurrentHoster } from "../../scrapHoster";
import HTMLParser from "node-html-parser";
import { fetchChapter } from "../scrappChapter/utils";
import path from "path";
import {
  Chapter,
  getChapterController,
} from "../../scrapHoster/ChapterController/ChapterController";
import { fetchRetry } from "../../utils/images";

type ImageList = Array<
  Array<{
    data: Buffer;
    name: string;
  }>
>;

function isNumerical(name: string) {
  const basename = path.basename(name);
  return /^[0-9]+$/.test(basename);
}

function isEveryNameNumerical(images: ImageList) {
  return images.every((imageList) => {
    return imageList.every((image) => {
      const name = image.name;
      return isNumerical(name);
    });
  });
}

function shiftNames(images: ImageList) {
  let nameOffset = 0;
  let lastNameNumber = 0;
  for (const list of images) {
    for (const index in list) {
      const basename = path.basename(list[index].name);
      const ext = path.extname(list[index].name);

      const n = Number(basename);

      lastNameNumber = n + nameOffset;
      const newname = lastNameNumber.toString();
      list[index].name = `${newname}${ext}`;
    }
    nameOffset = lastNameNumber;
  }
}

function generateNewNames(images: ImageList) {
  let lastNameNumber = 0;
  for (const list of images) {
    for (const index in list) {
      const ext = path.extname(list[index].name);
      lastNameNumber++;
      list[index].name = `${lastNameNumber}${ext}`;
    }
  }
}

export async function fetchTitle(url: string) {
  const chapterController = getChapterController();
  const rawHtml = await fetchRetry(url, { method: Methods.GET }).then((data) =>
    data.text()
  );

  const document = HTMLParser(rawHtml);

  const chaptersAnchors: HTMLAnchorElement[] = document
    .querySelectorAll(".wp-manga-chapter > a")
    .reverse() as any;

  const breadcrumbs = document.querySelectorAll("ol.breadcrumb > li");
  const title =
    breadcrumbs[breadcrumbs.length - 1].querySelector("a").innerText || "";

  const imagesPromiseList: Promise<Chapter>[] = [];

  for (const anchor of chaptersAnchors) {
    const chapterUrl = anchor.getAttribute("href");
    if (!chapterUrl) continue;
    // console.log("getting chapter ", chapterUrl);

    imagesPromiseList.push(
      new Promise(async (resolve, reject) => {
        try {
          const chapter = await (async () => {
            // console.log("looking for chapter, ", chapterUrl);

            const c = chapterController.getChapter(chapterUrl);
            if (c) {
              return c;
            }
            return await chapterController.addChapter(chapterUrl);
          })();

          // console.log("got chapter instance, waiting for load end");

          chapter.onLoad((chapter) => {
            // console.log("loaded");

            if (chapter) {
              resolve(chapter);
            } else {
              reject();
              // console.log("Rejecting load on " + chapterUrl);
            }
          });
        } catch (e) {
          reject(e);
        }
      })
    );
  }

  const chapters = await Promise.all(imagesPromiseList);

  let offset = 0;
  for (const chap of chapters) {
    const l = await chap.shiftNames(offset, 1);
    offset += l;
  }

  // const finalImageList = images.reduce((acc: ImageList[number], val) => {
  //   acc.push(...val);
  //   return acc;
  // }, []);

  return { chapters, title };
}

export async function getTitleEntry(url: string) {
  const hoster = getCurrentHoster();
  const existingEntry = hoster.getByUrl(url);

  if (existingEntry) {
    return existingEntry;
  }

  const title = await fetchTitle(url);

  const entry = await hoster.addNewEntry(title.chapters, title.title, url);

  return entry;
}
