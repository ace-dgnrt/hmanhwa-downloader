import type { Result } from "error-result";

class CumulativeError extends Error {
  errors: Error[];

  constructor(errors: Error[]) {
    super("Multiple errors were thrown!");
    this.errors = errors;
  }
}

export async function checkResultsListForErrors(
  results: Promise<Result<any>>[] | Result<any>[]
) {
  const resultList = await Promise.all(results);

  const errors: Error[] = [];

  for (const result of resultList) {
    if (result.error) {
      errors.push(result.error);
    }
  }

  return errors.length > 0 ? new CumulativeError(errors) : undefined;
}
