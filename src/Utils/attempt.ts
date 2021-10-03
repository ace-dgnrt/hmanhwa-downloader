import type { Result } from "error-result";
import { error, result } from "error-result";

export function attempt<R>(fn: () => R): Result<R> {
  try {
    const res = fn();
    return result(res);
  } catch (e) {
    return error(e as Error);
  }
}
