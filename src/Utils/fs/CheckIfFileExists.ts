import fs from "promise-fs";
import { repackPromise } from "../repack-promise";

export function checkIfFileExists(path: string) {
  return repackPromise(fs.access(path, fs.constants.F_OK).then(() => true));
}
