import { error, result } from "error-result";
import fs from "fs/promises";

import { RESOURCE_DIR } from "@Data/Constants";
import { initiateResource } from "@Routines/InitiateStores/Helpers/InitiateResource";
import { checkResultsListForErrors } from "@Utils/CheckResultsListForErrors";
import { Logger } from "@Utils/Logger";
import { repackPromise } from "@Utils/repack-promise";

export async function initiateResourceStore() {
  const dirExists = await repackPromise(fs.access(RESOURCE_DIR));

  if (dirExists.error) {
    const mkResourceDirOp = await repackPromise(fs.mkdir(RESOURCE_DIR));
    if (mkResourceDirOp.error) {
      Logger.error("Unable to create the Resource Directory.");
      process.exit(-1);
    } else {
      return result(undefined);
    }
  }

  const dirs = await repackPromise(fs.readdir(RESOURCE_DIR));

  if (dirs.error) {
    Logger.error("Unable to access the Resource Directory.");
    process.exit(-1);
  }

  const initOps = dirs.data.map((fpath) => initiateResource(fpath));

  const operationsErrors = await checkResultsListForErrors(initOps);

  if (operationsErrors) {
    return error(operationsErrors);
  }

  return result(undefined);
}
