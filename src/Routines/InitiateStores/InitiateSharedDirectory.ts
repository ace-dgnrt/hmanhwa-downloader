import { SHARED_RES_DIR } from "@Data/Constants";
import { createDirIfNotExists } from "@Utils/fs/CreateDirIfNotExists";
import { Logger } from "@Utils/Logger";

export async function initiateSharedDirectory() {
  const op = await createDirIfNotExists(SHARED_RES_DIR);

  if (op.error) {
    Logger.error("Unable to create the Resource Shared Directory.");
    process.exit(-1);
  }
}
