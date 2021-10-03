type GetMethodNames<O extends object> = Exclude<
  {
    [K in keyof O]: O[K] extends Function ? K : undefined;
  }[keyof O],
  undefined
>;

type ArrayType<A extends any[]> = A extends Array<infer T> ? T : never;

export type StripMethods<O extends object> = {
  [K in keyof Omit<O, GetMethodNames<O>>]: O[K] extends any[]
    ? StripMethods<ArrayType<O[K]>>[]
    : O[K] extends object
    ? StripMethods<O[K]>
    : O[K];
};

export function stripMethods<O extends object>(
  obj: O,
  referenceSet = new Set<any>()
): StripMethods<O> {
  const strippedObject = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "object" && value !== null) {
      if (referenceSet.has(value)) continue;
      referenceSet.add(value);
    }

    if (Array.isArray(value)) {
      const newArray: unknown[] = [];

      for (const elem of value) {
        switch (typeof elem) {
          case "object": {
            if (elem !== null) {
              const newElem = stripMethods(elem, referenceSet);
              newArray.push(newElem);
            }
            break;
          }
          case "function":
            break;
          default:
            newArray.push(elem);
            break;
        }
      }

      Object.assign(strippedObject, { [key]: newArray });

      continue;
    }

    switch (typeof value) {
      case "object": {
        if (value !== null) {
          const newObject = stripMethods(value, referenceSet);
          Object.assign(strippedObject, { [key]: newObject });
        }
        break;
      }
      case "function":
        break;
      default:
        Object.assign(strippedObject, { [key]: value });
        break;
    }
  }

  return strippedObject as any;
}
