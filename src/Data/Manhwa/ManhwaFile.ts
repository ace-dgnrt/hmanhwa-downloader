import type { ResultFailure, ResultSuccess } from "error-result";
import { error, result } from "error-result";
import { useProperty } from "Jsock";

import { NewFileFacade } from "@Hooks/FileFacade";
import { deleteFile } from "@Utils/fs/DeleteFile";
import { startSaveArchiveFileWorker } from "@Workers/ArchiveSaverWorker/StartArchiveFileWorker";

import type { FileFacade } from "@Hooks/FileFacade";
import type { Resource } from "@Data/Resource/CreateResource";

export type UseManhwaFileResult = {
  filePath: string;
  isFileContainsAllResources: (
    requiredResources: {
      hash: string;
    }[]
  ) => boolean;
  createNewFile: (
    filePath: string,
    resources: Resource[]
  ) => Promise<ResultFailure | ResultSuccess<string>>;
  setFile: (filePath: string, containedResources: string[]) => void;
};

export const useManhwaFile = (filePath?: string): UseManhwaFileResult => {
  const fileFacade = useProperty<FileFacade>(() =>
    NewFileFacade(filePath ?? "")
  );
  const containedResourcesRefs = useProperty<string[]>([]);

  const isFileContainsAllResources = (
    requiredResources: { hash: string }[]
  ) => {
    for (const required of requiredResources) {
      if (!containedResourcesRefs.get().includes(required.hash)) return false;
    }
    return true;
  };

  const createNewFile = async (filePath: string, resources: Resource[]) => {
    if (await fileFacade.get().isFileExists()) {
      const del = await deleteFile(fileFacade.get().fullPath);
      if (del.error) {
        return error(del.error);
      }
    }

    const newFileFacade = NewFileFacade(filePath);

    const createOp = await startSaveArchiveFileWorker(
      newFileFacade.fullPath,
      resources
    );

    if (createOp.error) {
      return error(createOp.error);
    }

    containedResourcesRefs.set(resources.map((r) => r.hash));
    fileFacade.set(newFileFacade);

    return result(filePath);
  };

  const setFile = (filePath: string, containedResources: string[]) => {
    fileFacade.set(NewFileFacade(filePath));
    containedResourcesRefs.set(containedResources);
  };

  return {
    filePath: fileFacade.get().fullPath,
    isFileContainsAllResources,
    createNewFile,
    setFile,
  };
};
