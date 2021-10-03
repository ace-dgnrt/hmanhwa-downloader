import { error, result } from "error-result";
import fs from "fs/promises";

import { repackPromise } from "@Utils/repack-promise";

import type { Result } from "error-result";
export interface OpReadParams {
  filePath: string;
  binary?: boolean;
}

export type OpReadResults<P extends OpReadParams> = P extends { binary: true }
  ? Buffer
  : string;

export async function opRead<P extends OpReadParams>({
  filePath,
  binary = false,
}: P): Promise<Result<OpReadResults<P>>> {
  const r = await repackPromise(
    fs.readFile(filePath, binary ? undefined : { encoding: "utf8" })
  );

  if (r.error) {
    return error(r.error);
  }

  return result(r.data as any);
}
