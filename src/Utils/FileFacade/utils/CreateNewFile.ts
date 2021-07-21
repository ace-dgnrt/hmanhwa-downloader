import { ResultingPromise } from "error-result";
import fs from "promise-fs";
import type { FileFacade } from "..";
import { NewFileFacade } from "..";

export function createFile(
  file: ArrayBuffer,
  filePath: string,
  options?: fs.WriteFileOptions
) {
  return ResultingPromise<FileFacade>((resolve, reject) => {
    fs.writeFile(filePath, Buffer.from(file), options)
      .then(() => {
        resolve(NewFileFacade(filePath));
      })
      .catch(reject);
  });
}
