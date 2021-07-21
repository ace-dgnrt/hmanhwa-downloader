import { Unit, useProperty } from "Jsock";
import type { Resource } from "./types";

export const createResourceStore = Unit(() => {
  const [resources, setResources] = useProperty<Resource[]>([]);

  const addResource = (r: Resource) => {
    setResources((oldResources) => {
      if (oldResources.find((elem) => elem.hash === r.hash))
        return oldResources;
      return [...oldResources, r];
    });
  };

  const deleteResource = (resourceHash: string) => {
    setResources((oldResources) => {
      if (oldResources.find((elem) => elem.hash === resourceHash))
        return oldResources.filter((elem) => elem.hash !== resourceHash);
      return oldResources;
    });
  };

  const findResource = (resourceHash: string) =>
    resources.find((elem) => elem.hash === resourceHash);

  return {
    resources,
    addResource,
    deleteResource,
    findResource,
  };
});
