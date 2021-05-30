import fs from "promise-fs";
import type { FileFacade } from "..";
import { NewFileFacade } from "..";

export function createFile(file: Buffer, filePath: string) {
  return new Promise<FileFacade>((resolve, reject) => {
    fs.writeFile(filePath, file)
      .then(() => {
        resolve(NewFileFacade(filePath));
      })
      .catch(reject);
  });
}
