import { error, result } from "error-result";
import path from "path";
import { RESOURCE_DIR } from "../../../Data/Constants";
import type { FileFacade } from "../../../Utils/FileFacade";
import { createFile } from "../../../Utils/FileFacade/utils/CreateNewFile";
import { readDir } from "../../../Utils/FileFacade/utils/ReadDir";
import { checkIfFileExists } from "../../../Utils/fs/CheckIfFileExists";
import { createDirIfNotExists } from "../../../Utils/fs/CreateDirIfNotExists";
import { deleteDir } from "../../../Utils/fs/DeleteDir";
import { Logger } from "../../../Utils/Logger";

function sortFileFacades(files: FileFacade[]): FileFacade[] {
  return [...files].sort((a, b) => {
    const aSymbol = Number(a.filename.replace(/[^0-9]/g, "")) ?? 0;
    const bSymbol = Number(b.filename.replace(/[^0-9]/g, "")) ?? 0;

    if (aSymbol > bSymbol) return 1;
    else if (aSymbol < bSymbol) return -1;
    else return 0;
  });
}

async function saveImage(
  image: ArrayBuffer,
  ext: string,
  dir: string,
  index: number
) {
  const file = await createFile(image, path.resolve(dir, `${index}.${ext}`));

  if (file.error) return error(file.error);

  return result(file.data);
}

export async function saveImagesToDisk(
  images: { data: ArrayBuffer; extension: string }[],
  associatedHash: string
) {
  const mkResDir = await createDirIfNotExists(RESOURCE_DIR);

  if (mkResDir.error) return error(mkResDir.error);

  const hashDir = path.resolve(RESOURCE_DIR, associatedHash);

  const hashDirExists = await checkIfFileExists(hashDir);

  if (hashDirExists.data === true) {
    const files = await readDir(hashDir);
    if (files.error) return error(files.error);
    if (files.data.length !== images.length)
      return error(
        new Error(
          `Directory of name [${hashDir}] already exists, and it's contents do not match the remote.`
        )
      );
    return result(sortFileFacades(files.data));
  }

  const mkHashDir = await createDirIfNotExists(hashDir);

  if (mkHashDir.error) return error(mkHashDir.error);

  const files = await Promise.all(
    images.map((img, index) =>
      saveImage(img.data, img.extension, hashDir, index)
    )
  );

  for (const f of files) {
    if (f.error) {
      const deletion = await deleteDir(hashDir);
      if (deletion.error) {
        Logger.warning(`Unable to remove directory [${hashDir}].`);
      }
      return error(f.error);
    }
  }

  return result(sortFileFacades(files.map((f) => f.data as FileFacade)));
}
