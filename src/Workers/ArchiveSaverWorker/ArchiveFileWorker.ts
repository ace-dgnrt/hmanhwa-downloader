import AdmZip from "adm-zip";
import { error, ResultingPromise } from "error-result";
import fsCallback from "fs";
import { WorkerBridge } from "node-worker-bridge";
import { Worker } from "worker_threads";

import { formatName } from "@Utils/FormatFileName";

import type { StripMethods } from "@Utils/StrinpMethods";
import type { Resource } from "@Data/Resource/CreateResource";
import type { Result } from "error-result";

type StrippedResource = StripMethods<Resource>;

export const archiver = WorkerBridge(
  {
    file: () => new Worker(new URL("./ArchiveFileWorker.ts", import.meta.url)),
  },
  () => {
    const create = (filePath: string, resources: StrippedResource[]) => {
      return saveArchiveFile(filePath, resources);
    };

    return { create };
  }
);

const resourceSorter = (a: StrippedResource, b: StrippedResource) => {
  if (a.chapterNumber > b.chapterNumber) return 1;
  if (a.chapterNumber < b.chapterNumber) return -1;
  return 0;
};

async function saveArchiveFile(
  filePath: string,
  resources: StrippedResource[]
): Promise<Result<string>> {
  if (fsCallback.existsSync(filePath)) {
    return error("Archive file already exists.");
  }

  const sortedResources = [...resources].sort(resourceSorter);

  const zip = new AdmZip();

  let nextImageNumber = 1;
  for (const res of sortedResources) {
    for (const resImage of res.images) {
      const filename = formatName(nextImageNumber, resImage.ext);
      zip.addLocalFile(resImage.fullPath, "", filename);
      nextImageNumber++;
    }
  }

  return ResultingPromise((resolve, reject) => {
    zip.writeZip(filePath, (e) => {
      if (e) return reject(e);
      return resolve(filePath);
    });
  });
}
