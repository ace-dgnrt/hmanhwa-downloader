export type PartialDeep<T extends object> = {
  [K in keyof T]?: T[K] extends object ? PartialDeep<T[K]> : T[K];
};
