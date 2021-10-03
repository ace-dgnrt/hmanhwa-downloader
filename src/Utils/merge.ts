import { cloneDeep, merge as lodashMerge } from "lodash";

export function merge<O1 extends object, O2 extends object>(
  obj1: O1,
  obj2: O2
) {
  return lodashMerge(cloneDeep(obj1), cloneDeep(obj2));
}
