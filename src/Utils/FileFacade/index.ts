import { Unit, useProperty } from "Jsock";
import path from "path";
import fs from "promise-fs";
import { repackPromise } from "../repack-promise";
import { opMove } from "./operations/opMove";
import { opRename } from "./operations/opRename";

export const NewFileFacade = Unit((filepath: string) => {
  const [pathData, setPathData] = useProperty<path.ParsedPath>(
    path.parse(filepath)
  );

  const filename = pathData.name;

  const ext = pathData.ext;

  const location = pathData.dir;

  const fullFilename = pathData.base;

  const fullPath = path.join(location, fullFilename);

  const move = (newPath: string) =>
    opMove({ newPath, currentPath: fullPath, setPathData });

  const rename = (newName: string) =>
    opRename({
      newName,
      currentPath: fullPath,
      location,
      setPathData,
    });

  const isFileExists = () =>
    repackPromise(fs.access(fullPath, fs.constants.F_OK).then(() => true));

  return {
    filename,
    ext,
    location,
    fullFilename,
    fullPath,
    move,
    rename,
    isFileExists,
  };
});

export type FileFacade = ReturnType<typeof NewFileFacade>;
