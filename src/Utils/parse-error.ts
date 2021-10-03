

export function parseError(e: unknown) {
  if (e instanceof Error) {
    return e;
  }

  if (typeof e === "string") {
    return Error(e);
  }

  return Error();
}
