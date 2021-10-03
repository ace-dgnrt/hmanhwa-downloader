import { error, result } from "error-result";
import { Unit, useProperty, useSideEffect } from "Jsock";
import { cloneDeep } from "lodash";
import { DateTime } from "luxon";
import md5 from "md5";
import path from "path";

import { SHARED_RES_DIR, UNDEFINED_VALUE } from "@Data/Constants";
import { INITIAL_MANHWA_CONFIG } from "@Data/Manhwa/ConfigFile";
import { useManhwaFile } from "@Data/Manhwa/ManhwaFile";
import { resourceStore } from "@Data/Resources";
import { useJSONFile } from "@Hooks/UseJSONFile/UseJSONFile";
import { propertyAccessors } from "@Utils/UnitAccessors";

import type { PartialDeep } from "@Utils/TSUtils";
import type { Resource } from "@Data/Resource/CreateResource";
import type { ManhwaConfigFile } from "@Data/Manhwa/ConfigFile";

export type Manhwa = ReturnType<typeof createManhwaEntry>;

export const createManhwaEntry = Unit((jsonFilePath: string) => {
  const url = useProperty<string>("");
  const title = useProperty<string>("");
  const hash = useProperty<string>("");
  const relatedResources = useProperty<{ hash: string; url: string }[]>([]);

  const configFile = useJSONFile<ManhwaConfigFile>(jsonFilePath);

  const manhwaArchiveFile = useManhwaFile();

  const getResources = () => {
    const availableResources: Resource[] = [];
    const unavailableResources: { hash: string; url: string }[] = [];

    for (const resRef of relatedResources.get()) {
      const resource = resourceStore.findResource(resRef.hash);

      if (resource) {
        availableResources.push(resource);
      } else {
        unavailableResources.push(resRef);
      }
    }

    return { availableResources, unavailableResources };
  };

  const addResourceRelation = (resourceUrl: string) => {
    const hash = md5(resourceUrl);

    if (relatedResources.get().some((resource) => resource.hash === hash)) {
      return;
    }

    relatedResources.set((oldResources) => {
      const newRelResList = [...oldResources, { hash, url: resourceUrl }];

      updateConfigFile({ relatedResources: newRelResList });

      return newRelResList;
    });
  };

  const getFile = async () => {
    if (manhwaArchiveFile.isFileContainsAllResources(relatedResources.get())) {
      return result(manhwaArchiveFile.filePath);
    }

    const resources = relatedResources
      .get()
      .map((r) => resourceStore.findResource(r.hash));

    for (const res of resources) {
      if (res === undefined) {
        return error("One of the related resources does not exist.");
      }
      const resExists = await res.isResourceExist();
      if (!resExists) {
        return error("One of the related resources is not ready yet.");
      }
    }

    const archiveFileName = `${hash}.zip`;
    const containedResources = resources.map((r) => r!.hash);

    const res = await manhwaArchiveFile.createNewFile(
      path.resolve(SHARED_RES_DIR, archiveFileName),
      resources as Resource[]
    );

    if (res.error) {
      return error(res.error);
    }

    updateConfigFile({
      archiveFile: { fileName: archiveFileName, containedResources },
    });

    return result(res.data);
  };

  const updateConfigFile = (d: PartialDeep<ManhwaConfigFile>) => {
    d.updatedAtUTC = DateTime.now().toUTC().toMillis();
    configFile.setData(d);
  };

  const syncConfigFile = async () => {
    const config = await configFile.getData();

    if (config.error) {
      return; // TODO: handle error
    }

    url.set(config.data.url);
    title.set(config.data.title);
    hash.set(config.data.hash);
    relatedResources.set(config.data.relatedResources);

    if (config.data.archiveFile.fileName !== UNDEFINED_VALUE)
      manhwaArchiveFile.setFile(
        config.data.archiveFile.fileName,
        config.data.archiveFile.containedResources
      );
  };

  const setUrl = (u: string) => {
    const h = md5(u);

    url.set(u);
    hash.set(h);

    updateConfigFile({ hash: h, url: u });
  };

  const setTitle = (t: string) => {
    title.set(t);

    updateConfigFile({ title: t });
  };

  useSideEffect(
    () =>
      (async () => {
        const fileExists = await configFile.isFileExists();

        if (!fileExists) {
          const initConfig = cloneDeep(INITIAL_MANHWA_CONFIG);
          initConfig.createdAtUTC = DateTime.now().toUTC().toMillis();
          updateConfigFile(initConfig);
          return;
        }

        syncConfigFile();
      })(),
    []
  );

  return {
    ...propertyAccessors({ url, title, relatedResources, hash }),
    setUrl,
    setTitle,
    addResourceRelation,
    getResources,
    getFile,
  };
});
