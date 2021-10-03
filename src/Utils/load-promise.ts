import type { Result } from "error-result";
import { ResultingPromise } from "error-result";

export type LoadPromise = {
  resolve: () => void;
  reject: (e: string | Error) => void;
  promise: Promise<Result<void>>;
};

export function createLoadPromise(): LoadPromise {
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
