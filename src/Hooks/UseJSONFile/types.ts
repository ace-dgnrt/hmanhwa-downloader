import type { PartialDeep } from "@Utils/TSUtils";
import type { Result } from "error-result";

export type UseJSONFileResult<T extends object> = {
  location: string | undefined;
  getData: () => Promise<Result<T>>;
  setData: (d: PartialDeep<T>) => Promise<Result<undefined>>;
  setFilePath: (fpath: string) => void;
  isFileExists: () => Promise<boolean>;
};
