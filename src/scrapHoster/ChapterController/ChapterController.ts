import path from "path";
import fs from "promise-fs";
import { getDirName } from "..";
import type { FetchChapterResult } from "../../routes/scrappChapter/workers/fetchChapterWorker";
import { fetchChapter } from "../../routes/scrappChapter/workers/fetchChapterWorker";
import type { FileFacade } from "../../utils/FileFacade";
import { NewFileFacade } from "../../utils/FileFacade";
import { createFile } from "../../utils/FileFacade/utils/createNewFile";
import { Logger } from "../../utils/Logger";
import { sleep } from "../../utils/sleep";
import { CHAPTERS_DIR } from "../conf";

enum ChapterStatus {
  Uninitialized,
  Loading,
  Ready,
  Deleted,
}

export function formatName(n: number | string, ext: string) {
  const name = `${n}`;
  return `${Array.from({ length: Math.max(0, 4 - name.length) }, () => 0).join(
    ""
  )}${name}${ext}`;
}

function filename(p: string) {
  return path.basename(p, path.extname(p));
}

function sortNumPathnames(arr: FileFacade[]) {
  return arr.sort((a, b) => {
    const numA = Number(a.filename);
    const numB = Number(b.filename);
    if (numA > numB) {
      return 1;
    } else if (numB > numA) {
      return -1;
    }
    return 0;
  });
}

function isNumerical(s: string) {
  return /^[0-9]+$/.test(s);
}

function isPathnameNumerical(name: string) {
  return isNumerical(filename(name));
}

function isEveryNameNumerical(images: FileFacade[]) {
  return images.every((img) => {
    return isNumerical(img.filename);
  });
}

async function dirExists(path: string) {
  if (!fs.existsSync(path)) {
    return false;
  }
  const stats = await fs.lstat(path);
  return stats.isDirectory();
}

export class Chapter {
  chapterName = "";
  private path = "";
  private hashedUrl = "";
  private status: ChapterStatus = ChapterStatus.Uninitialized;
  private fileList: FileFacade[] = [];

  private subscribents: Array<(chapter: Chapter | undefined) => void> = [];

  get imageDir() {
    return path.resolve(this.path, "images");
  }

  getFileList() {
    return this.fileList;
  }

  private resolveSubscribents() {
    if (this.status === ChapterStatus.Ready) {
      while (this.subscribents.length > 0) {
        const sub = this.subscribents.shift()!;
        sub(this);
      }
    } else {
      throw new Error(
        "Cannot resolve subscribents when the files are not ready."
      );
    }
  }

  async createNew(url: string) {
    if (this.status !== ChapterStatus.Uninitialized) {
      return;
    }
    this.status = ChapterStatus.Loading;

    let chapterData: FetchChapterResult;

    let c = 0;
    while (true) {
      c++;
      try {
        chapterData = (await fetchChapter(url)) as FetchChapterResult;
        break;
      } catch (e) {
        if (c > 15) {
          throw new Error(`Unable to retrieve resource from url: [${url}]`);
        }
        await sleep(5000);
        Logger.warning("Worker exited with error", e.message);
      }
    }

    const numericalNamedImages = chapterData.images.filter((v) =>
      isPathnameNumerical(v.name)
    );
    if (numericalNamedImages.length !== chapterData.images.length) {
      Logger.warning("Not all images have numerical names", url);
      throw new Error();
    }

    const dirpath = path.resolve(CHAPTERS_DIR, getDirName(url));
    const imgdir = path.resolve(dirpath, "images");
    if (fs.existsSync(dirpath)) {
      Logger.warning("Chapter already exists!", { url });
      return;
    }
    await fs.mkdir(dirpath);
    await fs.mkdir(imgdir);
    const queue: Promise<FileFacade>[] = [];
    await fs.writeFile(
      path.resolve(dirpath, "info.json"),
      JSON.stringify({
        name: chapterData.chapterTitle,
        files: numericalNamedImages.length,
        url,
      }),
      { encoding: "utf-8" }
    );
    Logger.debug(
      "Numerical Named Images",
      numericalNamedImages.map((n) => n.name)
    );

    for (const img of numericalNamedImages) {
      const ext = path.extname(img.name);
      const name = formatName(filename(img.name), ext);
      const imagePath = path.resolve(imgdir, name);
      queue.push(createFile(img.data, imagePath));
    }

    await Promise.all(queue).then((files) => {
      const ffacadList = files;
      Logger.debug(
        "File pushed to list",
        ffacadList.map((f) => f.fullFilename)
      );
      this.fileList.push(...ffacadList);
    });

    this.path = dirpath;
    this.chapterName = chapterData.chapterTitle;
    this.hashedUrl = getDirName(url);
    this.status = ChapterStatus.Ready;

    this.resolveSubscribents();

    return this;
  }

  async loadExisting(dirpath: string) {
    if (this.status !== ChapterStatus.Uninitialized) {
      return this;
    }
    if (await dirExists(dirpath)) {
      this.status = ChapterStatus.Loading;
      const imgdir = path.resolve(dirpath, "images");
      const infopath = path.resolve(dirpath, "info.json");
      if ((await dirExists(imgdir)) && fs.existsSync(infopath)) {
        this.path = dirpath;
        this.hashedUrl = path.basename(dirpath);
        const info: { name: string } = JSON.parse(
          await fs.readFile(infopath, { encoding: "utf-8" })
        );
        this.chapterName = info.name;
        this.fileList = await (
          await fs.readdir(imgdir)
        ).map((file) => NewFileFacade(path.join(imgdir, file)));
        this.status = ChapterStatus.Ready;
        this.resolveSubscribents();
      }
    } else {
      this.status = ChapterStatus.Deleted;
    }
    return this;
  }

  onLoad(callback: (chapter: Chapter | undefined) => void) {
    switch (this.status) {
      case ChapterStatus.Loading:
        this.subscribents.push(callback);
        break;
      case ChapterStatus.Ready:
        callback(this);
        break;
      case ChapterStatus.Uninitialized:
      case ChapterStatus.Deleted:
        callback(undefined);
        break;
    }
  }

  isValid() {
    return this.status !== ChapterStatus.Deleted;
  }

  async shiftNames(offset: number, startFrom?: number) {
    // const files = sortNumPathnames([...this.fileList]);
    // Logger.debug(
    //   "Shifting names",
    //   files.map((f) => f.fullFilename)
    // );
    // if (!isEveryNameNumerical(files)) {
    //   throw new Error("Invalid filenames");
    // }
    // if (startFrom === undefined) {
    //   startFrom = Number(files[0].filename);
    // }
    // let count = startFrom! + offset;
    // const queue: Array<() => Promise<void>> = [];
    // for (const f of files) {
    //   const newName = formatName(count++, f.ext);
    //   queue.unshift(async () => {
    //     await f.rename(newName);
    //   });
    // }
    // for (const renameAction of queue) {
    //   await renameAction();
    // }
    // // Logger.debug(
    // //   "Shifting done",
    // //   files.map((f) => f.fullFilename)
    // // );
    // return queue.length;
  }

  isUrl(url: string) {
    return this.hashedUrl === getDirName(url);
  }

  isPath(p: string) {
    return path.normalize(p) === path.normalize(this.path);
  }

  async remove() {
    if (this.path) {
      if (fs.existsSync(this.path)) {
        return await fs.rmdir(this.path);
      }
    }
  }
}

class ChapterController {
  private savedChapters: Array<Chapter> = [];
  isReady = false;
  constructor() {
    if (!fs.existsSync(CHAPTERS_DIR)) {
      fs.mkdir(CHAPTERS_DIR).then(() => this.init());
    } else {
      this.init();
    }
  }

  async init() {
    if (this.isReady) {
      return;
    }
    const chapDirs = await fs.readdir(CHAPTERS_DIR);
    const queue: Promise<Chapter>[] = [];
    for (const chap of chapDirs) {
      const c = new Chapter();
      queue.push(c.loadExisting(path.resolve(CHAPTERS_DIR, chap)));
    }
    const chapters = (await Promise.all(queue)).filter((chapter) => {
      const isValid = chapter.isValid();
      return isValid;
    });
    this.savedChapters.push(...chapters);
    this.isReady = true;
  }

  removeChapter(identifier: { url: string } | { path: string }) {
    if ("url" in identifier) {
      this.savedChapters.find((c) => c.isUrl(identifier.url))?.remove();
      this.savedChapters = this.savedChapters.filter(
        (c) => !c.isUrl(identifier.url)
      );
    } else {
      this.savedChapters.find((c) => c.isPath(identifier.path))?.remove();
      this.savedChapters = this.savedChapters.filter(
        (c) => !c.isPath(identifier.path)
      );
    }
  }

  async addChapter(url: string) {
    const existingChap = this.savedChapters.find((c) => c.isUrl(url));
    if (existingChap) {
      return existingChap;
    }
    const chapter = new Chapter();
    this.savedChapters.push(chapter);
    chapter.createNew(url);
    chapter.onLoad((chapt) => {
      if (!chapt) {
        this.removeChapter({ url });
      }
    });
    return chapter;
  }

  getChapter(url: string) {
    return this.savedChapters.find((c) => c.isUrl(url));
  }
}

const chapterController = new ChapterController();

export function getChapterController() {
  return chapterController;
}
