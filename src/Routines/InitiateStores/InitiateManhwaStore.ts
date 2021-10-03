import { error, result } from "error-result";
import fs from "fs/promises";

import { MANHWA_DIR } from "@Data/Constants";
import { initiateManhwa } from "@Routines/InitiateStores/Helpers/InitiateManhwa";
import { checkResultsListForErrors } from "@Utils/CheckResultsListForErrors";
import { Logger } from "@Utils/Logger";
import { repackPromise } from "@Utils/repack-promise";

export async function InitiateManhwaStore() {
  const dirExists = await repackPromise(fs.access(MANHWA_DIR));

  if (dirExists.error) {
    const mkResourceDirOp = await repackPromise(fs.mkdir(MANHWA_DIR));
    if (mkResourceDirOp.error) {
      Logger.error("Unable to create the Manhwa Directory.");
      process.exit(-1);
    } else {
      return result(undefined);
    }
  }

  const manhwaConfigs = await repackPromise(fs.readdir(MANHWA_DIR));

  if (manhwaConfigs.error) {
    Logger.error("Unable to access the Resource Directory.");
    process.exit(-1);
  }

  const initOps = manhwaConfigs.data.map((fpath) => initiateManhwa(fpath));

  const operationsErrors = await checkResultsListForErrors(initOps);

  if (operationsErrors) {
    return error(operationsErrors);
  }

  return result(undefined);
}
