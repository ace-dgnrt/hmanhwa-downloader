import { Unit, useProperty } from "Jsock";

import { Logger } from "@Utils/Logger";

import type { Resource } from "@Data/ResourceStore/types";
export const createResourceStore = Unit(() => {
  const resources = useProperty<Resource[]>([]);

  const addResource = (r: Resource) => {
    if (r.url.length === 0) {
      Logger.error("Invalid Resource!", r);
      return;
    }

    resources.set((oldResources) => {
      if (oldResources.find((elem) => elem.hash === r.hash))
        return oldResources;
      return [...oldResources, r];
    });
  };

  const deleteResource = (resourceHash: string) => {
    resources.set((oldResources) => {
      if (oldResources.find((elem) => elem.hash === resourceHash))
        return oldResources.filter((elem) => elem.hash !== resourceHash);
      return oldResources;
    });
  };

  const clear = () => {
    resources.set([]);
  };

  const findResource = (resourceHash: string): Resource | undefined =>
    resources.get().find((elem) => elem.hash === resourceHash);

  return {
    resources: resources.get(),
    addResource,
    deleteResource,
    findResource,
    clear,
  };
});
