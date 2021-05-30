import AdmZip from "adm-zip";
import type http from "http";
import md5 from "md5";
import path from "path";
import fs from "promise-fs";
import { ContentType, Header } from "../API/Headers";
import {
  RequestHandler,
  ValidateField,
} from "../API/RequestHanlder/RequestHandler";
import { DataType } from "../API/RequestHanlder/types";
import { ResponseCode } from "../API/types";
import type { FileFacade } from "../utils/FileFacade";
import { Logger } from "../utils/Logger";
import type { Chapter } from "./ChapterController/ChapterController";
import { formatName } from "./ChapterController/ChapterController";
import { downloadPathname } from "./urls";

const PACKAGE_FILENAME = "package.zip";
const PACKAGE_INFO = "info.json";

interface InfoFileStructure {
  name: string;
}

export function getDirName(url: string) {
  return md5(
    url
      .replace(/^http(s){0,1}:\/\//, "")
      .split("/")
      .filter((e) => e)
      .join("/")
  );
}

async function prepareTrashbin(container: string) {
  const trash = path.resolve(container, ".trash");
  if (!fs.existsSync(trash)) {
    await fs.mkdir(trash);
  }
  const trashStats = await fs.lstat(trash);
  if (!trashStats.isDirectory()) {
    fs.rmSync(trash, { force: true });
    await fs.mkdir(trash);
  }
  return trash;
}

async function removeFile(p: string) {
  if (/\.trash/.test(p)) {
    return p;
  }
  const container = path.dirname(p);
  const trash = await prepareTrashbin(container);
  const newPath = path.resolve(trash, path.basename(p));
  if (fs.existsSync(newPath)) {
    fs.rmSync(newPath, { force: true, recursive: true });
  }
  await fs.rename(p, newPath);
  return newPath;
}

function nameToNumber(name: string) {
  const numericalString = name
    .replace(/[^0-9.,]/g, "")
    .replace(/^[.,]+/, "")
    .replace(/[.,]+$/, "");
  return Number(numericalString);
}

function sortChapters(chapters: Chapter[]) {
  return chapters.sort((a, b) => {
    const aNumber = nameToNumber(a.chapterName);
    const bNumber = nameToNumber(b.chapterName);
    if (aNumber > bNumber) return 1;
    else if (aNumber < bNumber) return -1;
    return 0;
  });
}

function sortFiles(files: FileFacade[]) {
  return files.sort((a, b) => {
    const aNumber = nameToNumber(a.filename);
    const bNumber = nameToNumber(b.filename);
    if (aNumber > bNumber) return 1;
    else if (aNumber < bNumber) return -1;
    return 0;
  });
}

export class HosterEntry {
  parent: Hoster;
  dirName: string;
  package: string;
  private isReady: boolean;
  private onReadyChange: Array<(success: boolean) => void> = [];
  private name = "";
  constructor(parent: Hoster, dirName: string, name?: string, pack?: string) {
    this.parent = parent;
    this.dirName = dirName;
    this.package = pack || "";
    this.isReady = false;
    if (name) this.setName(name);
  }

  get dirFullPath() {
    return path.resolve(this.parent.containingDir, this.dirName);
  }

  get packagePath() {
    return path.resolve(this.dirFullPath, this.package);
  }
  async createPackage(chapters: Chapter[]) {
    Logger.info(`Creating archive for ${this.getName()}`);
    const zip = new AdmZip();
    const chapterList = [...chapters];
    sortChapters(chapterList);

    let i = 1;
    for (const chapter of chapterList) {
      const files = [...chapter.getFileList()];
      sortFiles(files);
      for (const file of files) {
        const newName = formatName(i++, file.ext);
        zip.addLocalFile(file.fullPath, "", newName);
      }
    }

    // const files = chapterList.reduce((acc: FileFacade[], val) => {
    //   const flist = val.getFileList();
    //   acc.push(...flist);
    //   return acc;
    // }, []);
    // for (const f of files) {
    //   zip.addLocalFile(f.fullPath, "");
    // }
    return new Promise<void>((resolve, reject) => {
      if (fs.existsSync(this.packagePath)) {
        this.setReady(true);
        resolve();
        return;
      }
      zip.writeZip(this.packagePath, (e) => {
        Logger.info(`Archive created for ${this.getName()}`);
        this.setReady(!e);
        if (e) {
          reject(e);
        }
        resolve();
      });
    });
  }
  waitUntilReady() {
    return new Promise<void>((resolve, reject) => {
      if (this.isReady) {
        resolve();
      } else {
        this.onReadyChange.push((success) => {
          if (success) {
            resolve();
          } else {
            reject();
          }
        });
      }
    });
  }
  setReady(success: boolean) {
    this.isReady = success;
    for (
      const fn = this.onReadyChange.shift()!;
      this.onReadyChange.length > 0;

    ) {
      fn(success);
    }
  }
  getName() {
    return this.name;
  }
  setName(name: string) {
    this.name = name?.replace(/([^a-zA-Z0-9.-?\s]|\n)/g, "") || "";
  }
  exists() {
    const packagePath = path.resolve(this.dirFullPath, this.package);
    return fs.existsSync(packagePath);
  }
  async stream(response: http.ServerResponse) {
    await this.waitUntilReady();
    const packagePath = path.resolve(
      this.parent.containingDir,
      this.dirName,
      this.package
    );
    const exists = fs.existsSync(packagePath);
    if (exists) {
      response.setHeader(Header.ContentType, ContentType.ZIP);
      response.setHeader(
        Header.ContentDisposition,
        `attachment; filename="${this.name || "package"}.zip"`
      );
      response.statusCode = ResponseCode.SUCCESS;
      return fs.createReadStream(packagePath);
    } else {
      throw new Error(`File doesn't exists: ${packagePath}`);
    }
  }
}

export class Hoster {
  containingDir: string;
  private entries: Array<HosterEntry> = [];
  constructor(dir: string) {
    this.containingDir = dir;
    if (fs.existsSync(dir)) {
      fs.readdir(dir, {}).then((v) => {
        for (const subDir of v as string[]) {
          this.addExistingEntry(path.resolve(dir, subDir));
        }
      });
    } else {
      fs.mkdir(dir, {}).catch((e) => {
        throw e;
      });
    }
  }

  private async addExistingEntry(dirpath: string) {
    const entry = new HosterEntry(this, path.basename(dirpath));
    const stats = await fs.lstat(dirpath);
    if (!stats.isDirectory()) {
      return;
    }
    const files = (await fs.readdir(dirpath)) as string[];
    if (!files.includes(PACKAGE_FILENAME) || !files.includes(PACKAGE_INFO)) {
      removeFile(dirpath);
      return;
    }
    entry.package = PACKAGE_FILENAME;
    fs.readFile(path.resolve(dirpath, PACKAGE_INFO), {
      encoding: "utf-8",
    }).then((b) => {
      const info: InfoFileStructure = JSON.parse(b.toString());
      entry.setName(info.name || "");
      entry.setReady(true);
      this.entries.push(entry);
    });
  }

  async addNewEntry(chapters: Chapter[], entryName: string, sourceUrl: string) {
    entryName = entryName.replace(/[^a-zA-Z0-9.-?\s]/g, "");
    return new Promise<HosterEntry>(async (resolve, reject) => {
      const entryDirName = getDirName(sourceUrl);
      const entryDirPath = path.resolve(this.containingDir, entryDirName);
      const existingEntry = this.entries.find(
        (e) => e.dirName === entryDirName
      );
      const hosterEntry = new HosterEntry(
        this,
        entryDirName,
        entryName,
        PACKAGE_FILENAME
      );
      if (existingEntry) {
        return resolve(existingEntry);
      }
      if (fs.existsSync(entryDirPath)) {
        fs.rmSync(entryDirPath, { recursive: true, force: true });
      }
      await fs.mkdir(entryDirPath).catch(reject);
      const infoFileData: InfoFileStructure = {
        name: entryName,
      };
      await fs
        .writeFile(
          path.resolve(this.containingDir, entryDirPath, PACKAGE_INFO),
          JSON.stringify(infoFileData),
          { encoding: "utf-8" }
        )
        .catch(reject);
      this.entries.push(hosterEntry);
      await hosterEntry.createPackage(chapters);
      resolve(hosterEntry);
    });
  }

  getByUrl(url: string) {
    const dirname = getDirName(url);
    const existingEntry = this.entries.find((e) => e.dirName === dirname);
    if (existingEntry && !existingEntry.exists()) {
      this.entries = this.entries.filter(
        (e) => e.dirName !== existingEntry.dirName
      );
      return undefined;
    }
    return existingEntry;
  }

  getByHash(dirname: string) {
    const existingEntry = this.entries.find((e) => e.dirName === dirname);
    if (existingEntry && !existingEntry.exists()) {
      this.entries = this.entries.filter(
        (e) => e.dirName !== existingEntry.dirName
      );
      return undefined;
    }
    return existingEntry;
  }
}

export function constructDownloadUrl(entry: HosterEntry, baseUrl: string) {
  if (baseUrl[baseUrl.length - 1] === "/") {
    baseUrl = baseUrl.slice(0, -1);
  }
  return `${baseUrl}${downloadPathname}?id=${entry.dirName}`;
}

const hoster = new Hoster(path.resolve("./dist/entries"));

export function getCurrentHoster() {
  return hoster;
}

const PackageHostValidators = {
  GET: [
    ValidateField({
      key: "id",
      required: true,
      type: DataType.String,
      validateFn: async (field) => {
        if (!hoster.getByHash(field.id)) {
          return [false, "Invalid [id] value."];
        }
        return [true, ""];
      },
    }),
  ],
};

export default RequestHandler()
  .withValidation(() => PackageHostValidators)
  .sendResponse(async (api) => {
    const entry = hoster.getByHash(api.GET_DATA.id)!;
    const stream = await entry.stream(api.response);
    return { stream, options: { isStream: true } };
  });
