import { ResultingPromise } from "error-result";

export function createLoadPromise() {
  let resolve: () => void = () => {
    throw new Error("resolve() method has not been initialized yet.");
  };
  let reject: (e: string | Error) => void = () => {
    throw new Error("resolve() method has not been initialized yet.");
  };
  const promise = ResultingPromise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return {
    resolve,
    reject,
    promise,
  };
}
