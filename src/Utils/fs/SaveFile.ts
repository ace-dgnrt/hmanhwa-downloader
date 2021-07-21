import fs from "promise-fs";
import { repackPromise } from "../repack-promise";

export function saveFile(
  file: ArrayBuffer,
  path: string,
  options?: fs.WriteFileOptions
) {
  return repackPromise(fs.writeFile(path, Buffer.from(file), options));
}
