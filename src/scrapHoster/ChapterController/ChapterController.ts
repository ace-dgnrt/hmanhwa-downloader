import fs from "promise-fs";
import path from "path";
import { fetchChapter } from "../../routes/scrappChapter/utils";
import { CHAPTERS_DIR } from "../conf";
import { getDirName } from "..";

enum ChapterStatus {
  Uninitialized,
  Loading,
  Ready,
  Deleted,
}

function formatName(n: number | string, ext: string) {
  const name = `${n}`;
  return `${Array.from({ length: Math.max(0, 3 - name.length) }, () => 0).join(
    ""
  )}${name}${ext}`;
}

function filename(p: string) {
  return path.basename(p, path.extname(p));
}

function sortNumPathnames(arr: string[]) {
  return arr.sort((a, b) => {
    const numA = Number(filename(a));
    const numB = Number(filename(b));
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

function isEveryNameNumerical(images: string[]) {
  return images.every((img) => {
    return isPathnameNumerical(img);
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
  chapterName: string = "";
  private path: string = "";
  private hashedUrl: string = "";
  private status: ChapterStatus = ChapterStatus.Uninitialized;
  private fileList: string[] = [];

  private subscribents: Array<(chapter: Chapter | undefined) => void> = [];

  get imageDir() {
    return path.resolve(this.path, "images");
  }

  getFileList() {
    const imgdir = this.imageDir;
    return this.fileList.map((f) => path.join(imgdir, f));
  }

  private resolveSubscribents() {
    if (this.status === ChapterStatus.Ready && this.subscribents.length > 0) {
      while (this.subscribents.length > 0) {
        const sub = this.subscribents.shift()!;
        sub(this);
      }
    }
  }

  async createNew(url: string) {
    if (this.status !== ChapterStatus.Uninitialized) {
      return;
    }
    this.status = ChapterStatus.Loading;
    const chapterData = await fetchChapter(url);
    chapterData.images = chapterData.images.filter((v) =>
      isPathnameNumerical(v.name)
    );
    const dirpath = path.resolve(CHAPTERS_DIR, getDirName(url));
    const imgdir = path.resolve(dirpath, "images");
    if (fs.existsSync(dirpath)) {
      return;
    }
    await fs.mkdir(dirpath);
    await fs.mkdir(imgdir);
    const queue: Promise<void>[] = [];
    queue.push(
      fs.writeFile(
        path.resolve(dirpath, "info.json"),
        JSON.stringify({ name: chapterData.chapterTitle }),
        { encoding: "utf-8" }
      )
    );
    for (const img of chapterData.images) {
      const name = filename(img.name);
      const ext = path.extname(img.name);
      const imagePath = path.resolve(imgdir, formatName(name, ext));
      queue.push(fs.writeFile(imagePath, img.data));
      this.fileList.push(img.name);
    }

    await Promise.all(queue);

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
        this.fileList = await fs.readdir(imgdir);
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
    const files = sortNumPathnames([...this.fileList]);

    if (!isEveryNameNumerical(files)) {
      throw new Error("Invalid filenames");
    }

    if (startFrom === undefined) {
      startFrom = Number(files[0]);
    }

    const newFileList: string[] = [];

    let count = startFrom! + offset;
    const queue: Promise<any>[] = [];

    for (const f of files) {
      const ext = path.extname(f);
      const oldFPath = path.join(this.imageDir, f);
      const fname = formatName(count++, ext);
      const newFPath = path.join(this.imageDir, fname);
      newFileList.push(fname);
      queue.push(fs.rename(oldFPath, newFPath));
    }
    const nf = (await Promise.all(queue)).length;
    this.fileList = newFileList;
    return nf;
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
