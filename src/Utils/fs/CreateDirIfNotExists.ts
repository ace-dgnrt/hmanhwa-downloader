import fs from "promise-fs";

import { repackPromise } from "@Utils/repack-promise";

export function createDirIfNotExists(path: string) {
  return repackPromise(fs.mkdir(path, { recursive: true }));
}
