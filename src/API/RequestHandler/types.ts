export enum DataType {
  String = "str",
  Number = "num",
  Boolean = "bool",
  Object = "obj",
  Array = "array",
  Any = "any",
  Unknown = "unknown",
}

export type MapDataType<T extends DataType> = T extends DataType.String
  ? string
  : T extends DataType.Number
  ? number
  : T extends DataType.Boolean
  ? boolean
  : T extends DataType.Object
  ? object
  : T extends DataType.Array
  ? Array<unknown>
  : T extends DataType.Any
  ? any
  : unknown;

export type StringKeysOf<O extends object> = ((k: keyof O) => void) extends (
  k: infer K
) => void
  ? K extends string
    ? K
    : never
  : never;

export type UnionToIntersection<U> = (
  U extends any ? (k: U) => void : never
) extends (k: infer I) => void
  ? I
  : never;

export type ValidatorDataInstance<V extends Validator> = Record<
  V["key"],
  MapDataType<V["type"]>
>;

export type RequiredData<V extends Validator> = V extends { required: true }
  ? ValidatorDataInstance<V>
  : never;

export type UnrequiredData<V extends Validator> = V extends { required: false }
  ? ValidatorDataInstance<V>
  : never;

export type FilterDataTypes<V extends Validator> = ((
  k: UnionToIntersection<RequiredData<V> | Partial<UnrequiredData<V>>>
) => void) extends (k: infer K) => void
  ? K extends Record<any, any>
    ? K
    : object
  : never;

export type GetUndefinedTypes<ALL extends object, PARSED extends object> = Omit<
  Partial<Record<keyof ALL, unknown>>,
  keyof PARSED
> &
  PARSED;

export type Validator<K extends string = string> = {
  readonly key: K;
  readonly required: boolean;
  readonly type: DataType;
  validateFn?: (
    field: Record<K, any>
  ) => Promise<[isValid: boolean, message: string]>;
};

export type ValidatorList<K extends object> = Validator<StringKeysOf<K>>[];

export interface FieldValidators<GD extends object, PD extends object> {
  GET?: ValidatorList<GD>;
  POST?: ValidatorList<PD>;
}
