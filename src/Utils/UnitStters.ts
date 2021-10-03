import type { PropertyInterface } from "Jsock/dist/types/hooks";
import type { Widen } from "Jsock/dist/types/types";
import type { Initializer } from "Jsock/dist/types/unit";
import { startCase } from "lodash";

type Setters<T extends Record<string, PropertyInterface<any>>> = {
  [K in keyof T as `set${Capitalize<
    K extends string ? K : ""
  >}`]: T[K] extends PropertyInterface<infer U>
    ? (v: Initializer<Widen<U>>) => void
    : never;
};

export function propertySetters<
  T extends Record<string, PropertyInterface<any>>
>(obj: T): Setters<T> {
  return Object.fromEntries(
    Object.entries(obj).map(([key, inter]) => [
      `set${startCase(key)}`,
      (v: any) => inter.set(v),
    ])
  ) as any;
}
