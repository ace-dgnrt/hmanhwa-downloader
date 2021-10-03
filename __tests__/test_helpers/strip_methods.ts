export function stripMethods<O extends object>(obj: O) {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, value]) => typeof value !== "function")
  );
}
