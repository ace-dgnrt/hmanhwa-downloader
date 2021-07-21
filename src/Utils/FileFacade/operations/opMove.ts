import { error, result } from "error-result";
import path from "path";
import fs from "promise-fs";
import { repackPromise } from "../../repack-promise";

export interface OpMoveParams {
  newPath: string;
  currentPath: string;
  setPathData: (p: path.ParsedPath) => void;
}

export async function opMove({
  currentPath,
  newPath,
  setPathData,
}: OpMoveParams) {
  const r = await repackPromise(fs.rename(currentPath, newPath));

  if (r.error) {
    return error(r.error);
  }

  setPathData(path.parse(newPath));

  return result(true);
}
