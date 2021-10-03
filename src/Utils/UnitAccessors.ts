import type { PropertyInterface } from "Jsock/dist/types/hooks";

type Accessors<T extends Record<string, PropertyInterface<any>>> = {
  [K in keyof T]: T[K] extends PropertyInterface<infer U> ? U : never;
};

export function propertyAccessors<
  T extends Record<string, PropertyInterface<any>>
>(accessors: T): Accessors<T> {
  return Object.fromEntries(
    Object.entries(accessors).map(([key, inter]) => [key, inter.get()])
  ) as any;
}
