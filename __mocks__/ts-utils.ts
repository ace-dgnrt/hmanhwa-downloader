export type Ret<F> = F extends (...args: any[]) => infer R ? R : never;

export type Args<F> = F extends (...args: infer A) => any ? [...A] : never;

export type Mocked<T> = {
  [K in keyof T]: T[K] extends Function
    ? jest.Mock<Ret<T[K]>, Args<T[K]>>
    : T[K];
};
