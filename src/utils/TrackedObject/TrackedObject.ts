export function TrackedObject<T>(value: T, callback?: (value: T) => void) {
  const object = new Proxy(
    {
      value,
      onChange: () => {},
    },
    {
      set(target, property, value) {
        if (property === "onChange" && typeof value === "function") {
          callback = value;
          return true;
        }
        Object.assign(target, { [property]: value });
        if (callback) callback(value);
        return true;
      },
    }
  );
  return object;
}
