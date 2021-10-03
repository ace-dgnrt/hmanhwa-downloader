import Queue from "async-await-queue";
import { error, result } from "error-result";
import { useProperty, useSideEffect } from "Jsock";

import { NewFileFacade } from "@Hooks/FileFacade";
import { attempt } from "@Utils/attempt";
import { merge } from "@Utils/merge";

import type { FileFacade } from "@Hooks/FileFacade";
import type { PartialDeep } from "@Utils/TSUtils";
import type { Result } from "error-result";
import type { UseJSONFileResult } from "@Hooks/UseJSONFile/types";
import { retry } from "@Utils/retry";

export function useJSONFile<T extends object>(
  filePath?: string
): UseJSONFileResult<T> {
  const fileFacade = useProperty<FileFacade | null>(null);
  const accessQueue = useProperty<Queue>(() => new Queue(1, 0));

  const getDataUnsafe = async (): Promise<Result<T>> => {
    const ff = fileFacade.get();

    if (!ff) {
      return error("JSON file is not set.");
    }

    const file = await ff.read();

    if (file.error) {
      return error(file.error);
    }

    const data = attempt((): T => JSON.parse(file.data));

    if (data.error) {
      return error(data.error);
    }

    return result(data.data);
  };

  const getData = async (): Promise<Result<T>> => {
    const id = Symbol();
    accessQueue.get().wait(id);

    const r = getDataUnsafe();

    accessQueue.get().end(id);

    return r;
  };

  const setData = async (d: PartialDeep<T>): Promise<Result<undefined>> => {
    const id = Symbol();
    await accessQueue.get().wait(id);

    const ff = fileFacade.get();

    if (!ff) {
      return error("JSON file is not set.");
    }

    const current = await getDataUnsafe();

    const currentData = current.data ?? {};

    const fileData = attempt(() => {
      const newJSONObject = merge(currentData, d);
      return JSON.stringify(newJSONObject);
    });

    if (fileData.error) {
      accessQueue.get().end(id);
      return error(fileData.error);
    }

    const writeOp = await ff.write(fileData.data);

    accessQueue.get().end(id);

    if (writeOp.error) {
      return error(writeOp.error);
    }

    return result(undefined);
  };

  const setFilePath = (fpath: string) => {
    fileFacade.set(NewFileFacade(fpath));
  };

  const isFileExists = async () =>
    fileFacade.get() ? await fileFacade.get()!.isFileExists() : false;

  useSideEffect(() => {
    if (filePath) {
      fileFacade.set(NewFileFacade(filePath));
    }
  }, []);

  return {
    location: fileFacade.get()?.location,
    getData,
    setData,
    setFilePath,
    isFileExists,
  };
}
