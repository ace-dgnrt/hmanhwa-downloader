import { error, result } from "error-result";
import fs from "fs/promises";

import { MANHWA_CONF_FILE_NAME } from "@Data/Manhwa/ConfigFile";
import { createManhwaEntry } from "@Data/Manhwa/CreateManhwaEntry";
import { manhwaStore } from "@Data/Resources";
import { NewFileFacade } from "@Hooks/FileFacade";
import { deleteDir } from "@Utils/fs/DeleteDir";
import { repackPromise } from "@Utils/repack-promise";

export async function initiateManhwa(dirPath: string) {
  const files = await repackPromise(fs.readdir(dirPath));

  if (files.error) {
    return error(files.error);
  }

  const fileFacades = files.data.map((f) => NewFileFacade(f));

  const configFile = fileFacades.find(
    (ff) => ff.filename !== MANHWA_CONF_FILE_NAME
  );

  if (!configFile) {
    deleteDir(dirPath);
    return error("Missing config file in Manhwa directory.");
  }

  const manhwa = createManhwaEntry(configFile.fullPath);

  manhwaStore.addManhwa(manhwa);

  return result(undefined);
}
