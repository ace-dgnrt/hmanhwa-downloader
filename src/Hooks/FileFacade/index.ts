import { Unit, useProperty } from "Jsock";
import path from "path";
import fs from "promise-fs";

import { opMove } from "@Hooks/FileFacade/operations/opMove";
import { opRead } from "@Hooks/FileFacade/operations/opRead";
import { opRename } from "@Hooks/FileFacade/operations/opRename";
import { opWrite } from "@Hooks/FileFacade/operations/opWrite";
import { repackPromise } from "@Utils/repack-promise";

export const NewFileFacade = Unit((filepath: string) => {
  const pathData = useProperty<path.ParsedPath>(path.parse(filepath));

  const filename = pathData.get().name;

  const ext = pathData.get().ext;

  const location = pathData.get().dir;

  const fullFilename = pathData.get().base;

  const fullPath = path.join(location, fullFilename);

  const write = (data: string | Uint8Array) =>
    opWrite({ filePath: fullPath, data });

  const read = <B extends boolean = false>(params?: { binary: B }) =>
    opRead({ filePath: fullPath, binary: params?.binary ?? (false as B) });

  const move = (newPath: string) =>
    opMove({
      newPath,
      currentPath: fullPath,
      setPathData: (v) => pathData.set(v),
    });

  const rename = (newName: string) =>
    opRename({
      newName,
      currentPath: fullPath,
      location,
      setPathData: (v) => pathData.set(v),
    });

  const isFileExists = (): Promise<boolean> =>
    repackPromise(fs.access(fullPath, fs.constants.F_OK)).then(
      ({ error }) => !!error
    );

  return {
    filename,
    ext,
    location,
    fullFilename,
    fullPath,
    write,
    read,
    move,
    rename,
    isFileExists,
  };
});

export type FileFacade = ReturnType<typeof NewFileFacade>;
