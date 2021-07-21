import { ResultingPromise } from "error-result";
import rimraf from "rimraf";

export function deleteDir(dirPath: string) {
  return ResultingPromise<void>((resolve, reject) =>
    rimraf(dirPath, (e) => {
      if (e) reject(e);
      else resolve();
    })
  );
}
