import { error, result } from "error-result";
import fs from "fs/promises";

import { RESOURCE_CONF_FILE_NAME } from "@Data/Resource/ConfigFile";
import { createResource } from "@Data/Resource/CreateResource";
import { resourceStore } from "@Data/Resources";
import { NewFileFacade } from "@Hooks/FileFacade";
import { deleteDir } from "@Utils/fs/DeleteDir";
import { repackPromise } from "@Utils/repack-promise";

import type { Result } from "error-result";
export async function initiateResource(
  dirPath: string
): Promise<Result<undefined>> {
  const files = await repackPromise(fs.readdir(dirPath));

  if (files.error) {
    return error(files.error);
  }

  const fileFacades = files.data.map((f) => NewFileFacade(f));

  const configFile = fileFacades.find(
    (ff) => ff.filename !== RESOURCE_CONF_FILE_NAME
  );

  if (!configFile) {
    deleteDir(dirPath);
    return error("Missing config file in Resource directory.");
  }

  const resource = createResource(configFile.fullPath);

  resourceStore.addResource(resource);

  return result(undefined);
}
