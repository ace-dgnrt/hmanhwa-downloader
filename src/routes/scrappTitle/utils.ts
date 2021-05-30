import HTMLParser from "node-html-parser";
import path from "path";
import { Methods } from "../../API/types";
import { getCurrentHoster } from "../../scrapHoster";
import type { Chapter } from "../../scrapHoster/ChapterController/ChapterController";
import { getChapterController } from "../../scrapHoster/ChapterController/ChapterController";
import { fetchRetry } from "../../utils/images";
import { Logger } from "../../utils/Logger";

type ImageList = Array<
  Array<{
    data: Buffer;
    name: string;
  }>
>;

type HTMLElement = ReturnType<typeof HTMLParser>;

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

function sortChapters(chapters: HTMLAnchorElement[]) {
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

function getTitle(doc: HTMLElement) {
  const breadcrumbs = doc.querySelectorAll("ol.breadcrumb > li");
  if (breadcrumbs.length === 0) return "";
  const lastBreadcrumb = breadcrumbs[breadcrumbs.length - 1];
  const anchor = lastBreadcrumb.querySelector("a");
  if (!anchor) return "";
  const text = anchor.innerText;
  const title = text.replace(/[^0-9a-zA-Z,.?!':]/g, "");
  return title;
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

  sortChapters(chaptersAnchors);

  const title = getTitle(document);

  const imagesPromiseList: Promise<Chapter>[] = [];

  const chapters: Chapter[] = [];
  let i = 1;
  for (const anchor of chaptersAnchors) {
    const chapterUrl = anchor.getAttribute("href");
    if (!chapterUrl) continue;

    imagesPromiseList.push(
      new Promise(async (resolve, reject) => {
        try {
          const chapter = await (async () => {
            const c = chapterController.getChapter(chapterUrl);
            if (c) {
              return c;
            }

            Logger.info(`  Fetching chapter ${chapterUrl}`);
            return await chapterController.addChapter(chapterUrl);
          })();

          chapter.onLoad((chapter) => {
            Logger.info(`  Finished fetching chapter ${chapterUrl}`);
            if (chapter) {
              resolve(chapter);
            } else {
              reject();
            }
          });
        } catch (e) {
          reject(e);
        }
      })
    );

    if (i++ % 5 === 0) {
      const r = await Promise.all(imagesPromiseList);
      chapters.push(...r);
      imagesPromiseList.splice(0, imagesPromiseList.length);
    }
  }

  const r = await Promise.all(imagesPromiseList);
  chapters.push(...r);

  // const chapters = await Promise.all(imagesPromiseList);

  // let offset = 0;
  // for (const chap of chapters) {
  //   const l = await chap.shiftNames(offset, 1);
  //   offset += l;
  // }

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

  Logger.info(`Fetching chapters from ${url}`);
  const title = await fetchTitle(url);
  Logger.info(`All chapters fetched from ${url}`);

  const entry = await hoster.addNewEntry(title.chapters, title.title, url);

  return entry;
}
