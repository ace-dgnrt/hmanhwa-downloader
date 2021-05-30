import path from "path";
import { opMove } from "./opMove";

export interface OpRenameParams {
  newName: string;
  location: string;
  currentPath: string;
  setPathData: (p: path.ParsedPath) => void;
}

export function opRename({
  setPathData,
  currentPath,
  location,
  newName,
}: OpRenameParams) {
  return opMove({
    newPath: path.join(location, newName),
    currentPath,
    setPathData,
  });
}
