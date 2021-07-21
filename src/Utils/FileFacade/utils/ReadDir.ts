import { error, result } from "error-result";
import fs from "promise-fs";
import { NewFileFacade } from "..";
import { repackPromise } from "../../repack-promise";

export async function readDir(dirPath: string) {
  const files = await repackPromise(fs.readdir(dirPath));

  if (files.error) return error(files.error);

  return result(files.data.map((f) => NewFileFacade(f)));
}
