import type { Result } from "error-result";
import type { FileFacade } from "../../Utils/FileFacade";

export interface Resource {
  images: FileFacade[];
  title: string;
  hash: string;
  loadPromise: Promise<Result<void>>;
}
