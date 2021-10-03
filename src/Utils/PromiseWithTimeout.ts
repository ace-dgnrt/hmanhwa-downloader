import { ResultingPromise } from "error-result";

export function PromiseWT<T>(
  ms: number,
  executor: (
    resolve: (c: T) => void,
    reject: (e: string | Error) => void
  ) => void,
  timeoutMsg?: string
) {
  return ResultingPromise<T>((success, failure) => {
    const timeout = setTimeout(
      () => failure(`Promise timed out. ${timeoutMsg ?? ""}`),
      ms
    );

    executor(
      (c) => {
        clearTimeout(timeout);
        success(c);
      },
      (e) => {
        clearTimeout(timeout);
        failure(e);
      }
    );
  });
}
