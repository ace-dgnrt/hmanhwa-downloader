import { sleep } from "@Utils/images";
import { createLoadPromise } from "@Utils/load-promise";

describe("createLoadPromise()", () => {
  it("correctly resolves", async () => {
    const callWhenLoadingResolves = jest.fn();

    const loading = createLoadPromise();

    loading.promise.then(() => callWhenLoadingResolves());

    expect(callWhenLoadingResolves).toBeCalledTimes(0);

    loading.resolve();

    await sleep(0);

    expect(callWhenLoadingResolves).toBeCalledTimes(1);
  });
});
