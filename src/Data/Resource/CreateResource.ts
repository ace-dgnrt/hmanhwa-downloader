import { result } from "error-result";
import { Unit, useProperty, useSideEffect } from "Jsock";
import { cloneDeep } from "lodash";
import { DateTime } from "luxon";
import md5 from "md5";
import path from "path";

import { INITIAL_RESOURCE_CONFIG } from "@Data/Resource/ConfigFile";
import { NewFileFacade } from "@Hooks/FileFacade";
import { useJSONFile } from "@Hooks/UseJSONFile/UseJSONFile";
import { createLoadPromise } from "@Utils/load-promise";
import { Logger } from "@Utils/Logger";
import { propertyAccessors } from "@Utils/UnitAccessors";

import type { ResourceConfigFile } from "@Data/Resource/ConfigFile";
import type { FileFacade } from "@Hooks/FileFacade";
import type { LoadPromise } from "@Utils/load-promise";
import type { PartialDeep } from "@Utils/TSUtils";
export type Resource = ReturnType<typeof createResource>;

export const createResource = Unit((jsonFile: string) => {
  const configFile = useJSONFile<ResourceConfigFile>(jsonFile);

  const url = useProperty<string>("");
  const title = useProperty<string>("");
  const chapterNumber = useProperty<number>(-1);
  const hash = useProperty<string>("");
  const images = useProperty<FileFacade[]>([]);
  const resourceInvalid = useProperty<boolean>(false);
  const loadPromise = useProperty<LoadPromise>(() => createLoadPromise());
  const isReady = useProperty<boolean>(false);

  const wait = () => loadPromise.get().promise;

  const setLoaded = () => {
    loadPromise.get().resolve();
    isReady.set(true);
    updateConfigFile({ loadingFinished: true });
  };

  const setLoadFailed = (e: Error) => {
    resourceInvalid.set(true);
    isReady.set(false);
    loadPromise.get().reject(e);
  };

  const isResourceExist = async () => {
    if (!isReady.get()) return false;

    for (const image of images.get()) {
      if (!(await image.isFileExists())) {
        return false;
      }
    }

    return true;
  };

  const getFile = async () => {
    return result("");
  }; // TODO: implement

  const parseConfigFile = (config: ResourceConfigFile) => {
    const location = configFile.location;

    if (!location) return; // TODO handle error

    if (!config.loadingFinished) {
      return resourceInvalid.set(true);
    }

    url.set(config.url);
    title.set(config.title);
    chapterNumber.set(config.chapterNumber);
    hash.set(config.hash);
    images.set(
      config.images.map((imageFileName) => {
        const fpath = path.resolve(location, imageFileName);
        return NewFileFacade(fpath);
      })
    );

    if (config.loadingFinished) {
      loadPromise.get().resolve();
    }
  };

  const syncWithConfigFile = async () => {
    const config = await configFile.getData();

    if (config.error) {
      // TODO: handle error
      Logger.error("Error while parsing config file.", config.error);
      return;
    }

    parseConfigFile(config.data);
  };

  const updateConfigFile = async (d: PartialDeep<ResourceConfigFile>) => {
    d.updatedAtUTC = DateTime.now().toUTC().toMillis();
    const confSaveOp = await configFile.setData(d);

    if (confSaveOp.error) {
      Logger.error("Error while saving config file.", confSaveOp.error);
    }
  };

  const setUrl = (u: string) => {
    const h = md5(u);

    hash.set(h);
    url.set(u);

    updateConfigFile({ url: u, hash: h });
  };

  const setTitle = (t: string) => {
    title.set(t);

    updateConfigFile({ title: t });
  };

  const setChapterNumber = (cn: number) => {
    chapterNumber.set(cn);

    updateConfigFile({ chapterNumber: cn });
  };

  const setImages = (i: FileFacade[]) => {
    images.set(i);

    updateConfigFile({ images: i.map((img) => img.filename) });
  };

  useSideEffect(
    () =>
      (async function () {
        configFile.setFilePath(jsonFile);
        const fileExists = await configFile.isFileExists();

        if (!fileExists) {
          const initConfigFile = cloneDeep(INITIAL_RESOURCE_CONFIG);
          initConfigFile.createdAtUTC = DateTime.now().toUTC().toMillis();
          updateConfigFile(initConfigFile);
          return;
        }

        syncWithConfigFile();
      })(),
    []
  );

  return {
    ...propertyAccessors({
      url,
      title,
      chapterNumber,
      images,
      hash,
      resourceInvalid,
    }),
    setUrl,
    setTitle,
    setChapterNumber,
    setImages,
    setLoadFailed,
    setLoaded,
    wait,
    getFile,
    isResourceExist,
  };
});
