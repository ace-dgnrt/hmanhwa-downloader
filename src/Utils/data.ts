import { DataType } from "../API/RequestHanlder/types";
import type { ApiRouteInterface } from "../API/types";
import { Methods } from "../API/types";

// export enum DataType {
//   Any = 0,
//   Number = 1,
//   String = 2,
//   Array = 3,
//   Disctionary = 4,
// }

export function checkKey(
  a: ApiRouteInterface,
  key: string,
  method: Methods.GET | Methods.POST,
  type: DataType = DataType.Any
) {
  let value;
  switch (method) {
    case Methods.POST:
      value = a.POST(key);
      break;
    case Methods.GET:
      value = a.GET(key);
      break;
  }
  if (value === undefined) {
    return false;
  }
  switch (type) {
    case DataType.Number:
      return typeof value === "number";
    case DataType.String:
      return typeof value === "string";
    case DataType.Array:
      return Array.isArray(value);
    case DataType.Object:
      return (
        typeof value === "object" && value !== null && !Array.isArray(value)
      );
    default:
      return true;
  }
}

export function checkPostKeys(
  api: ApiRouteInterface,
  checkList: Array<{ key: string; type?: DataType }>
) {
  return checkList.every((c) => checkKey(api, c.key, Methods.POST, c.type));
}

export function checkGetKeys(
  api: ApiRouteInterface,
  checkList: Array<{ key: string; type?: DataType }>
) {
  return checkList.every((c) => checkKey(api, c.key, Methods.GET, c.type));
}
