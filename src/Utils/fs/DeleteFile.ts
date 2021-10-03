import fs from "fs/promises";

import { repackPromise } from "@Utils/repack-promise";

export function deleteFile(path: string) {
  return repackPromise(fs.rm(path));
}
