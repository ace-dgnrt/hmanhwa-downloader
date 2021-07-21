import { ResultingPromise } from "error-result";

export function repackPromise<T>(p: Promise<T>) {
  return ResultingPromise<T>((resolve, reject) => {
    p.then(resolve).catch(reject);
  });
}
