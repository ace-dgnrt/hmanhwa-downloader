import { error, result } from "error-result";

import { parseError } from "@Utils/parse-error";

import type { Result } from "error-result";

export async function retry<R>(
  action: () => Result<R> | Promise<Result<R>>,
  maxRetries: number,
  interval = 0
): Promise<Result<R>> {
  const handleError = async (err: unknown): Promise<Result<R>> => {
    if (maxRetries === 0) {
      return error(parseError(err));
    }

    return new Promise<Result<R>>((res) => {
      setTimeout(() => {
        retry(action, maxRetries - 1, interval)
          .then((r) => {
            res(r);
          })
          .catch((e) => {
            res(error(parseError(e)));
          });
      }, interval);
    });
  };

  try {
    const res: Result<R> | R = await action();
    if ("data" in res && "error" in res) {
      if (res.error) {
        return handleError(res.error);
      }
      return res;
    }
    return result(res);
  } catch (e) {
    return handleError(e);
  }
}
