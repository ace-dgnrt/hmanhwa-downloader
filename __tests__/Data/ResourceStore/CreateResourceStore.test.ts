import { Unit, useProperty, useSideEffect } from "Jsock";
import { createResourceStore } from "../../../src/Data/ResourceStore/CreateResourceStore";

describe("createResourceStore()", () => {
  it("", () => {
    const store = createResourceStore();

    store.addResource({
      hash: "hash",
      images: [],
      title: "title",
      loadPromise: Promise.resolve(),
    });

    expect(store.resources.length).toEqual(1);
  });
  it("", () => {
    const testUnit = Unit(() => {
      const [v, setV] = useProperty<string>("");
      const [hash, setHash] = useProperty<string>("");

      useSideEffect(() => {
        setHash(v);
      }, [v]);

      return {
        v,
        hash,
        setV,
      };
    });

    const u = testUnit();

    u.setV("123");

    expect(u.v).toEqual("123");
    expect(u.hash).toEqual("123");
  });
});
