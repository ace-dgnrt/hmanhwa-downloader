import HTMLParser from "node-html-parser";
import path from "path";
import { isMainThread, parentPort, Worker, workerData } from "worker_threads";
import { Methods } from "../../../API/types";
import { extractSrc, fetchRetry } from "../../../utils/images";

export type FetchChapterResult = {
  images: {
    data: Buffer;
    name: string;
  }[];
  chapterTitle: string;
};

async function _fetchChapter(chapterUrl: string): Promise<FetchChapterResult> {
  const rawHtml = await fetchRetry(chapterUrl, {
    method: Methods.GET,
  }).then((data) => data.text());

  const document = HTMLParser(rawHtml);
  const chapterTitle =
    document.querySelector("#chapter-heading")?.innerText || "";
  const images = document.querySelectorAll(
    "img.wp-manga-chapter-img"
  ) as any as HTMLImageElement[];

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
          reject(e);
        }
      })
    );
  }

  const results = await Promise.all(imageList);

  if (results.length !== imagesSrc.length) {
    throw new Error("Not all images have been fetched");
  }

  return { images: results, chapterTitle };
}

export function fetchChapter(chapterUrl: string) {
  if (isMainThread) {
    const worker = new Worker(__filename, { workerData: { chapterUrl } });
    const p = new Promise<FetchChapterResult>((resolve, reject) => {
      let isMessageReceived = false;

      worker.on("message", (data) => {
        isMessageReceived = true;
        resolve(data);
      });
      worker.on("error", (err) => {
        isMessageReceived = true;
        reject(err);
      });
      worker.on("messageerror", (err) => {
        isMessageReceived = true;
        reject(err);
      });

      setTimeout(() => {
        if (!isMessageReceived) {
          reject(`Worker not responding! Url used: ${chapterUrl}`);
        }
      }, 30_000);
    });

    return p;
  }
}

if (!isMainThread && workerData.chapterUrl) {
  _fetchChapter(workerData.chapterUrl)
    .then((results) => {
      parentPort?.postMessage(results);
    })
    .catch((e) => {
      parentPort?.emit("messageerror", e);
    });
}
