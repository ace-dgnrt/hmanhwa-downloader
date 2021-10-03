import { error, result } from "error-result";
import fs from "fs/promises";

import { repackPromise } from "@Utils/repack-promise";

import type { Result } from "error-result";
export interface OpWriteParams {
  filePath: string;
  data: string | Uint8Array;
}

export async function opWrite<P extends OpWriteParams>({
  filePath,
  data,
}: P): Promise<Result<undefined>> {
  const r = await repackPromise(fs.writeFile(filePath, data));

  if (r.error) {
    return error(r.error);
  }

  return result(undefined);
}
