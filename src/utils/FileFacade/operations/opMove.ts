import path from "path";
import fs from "promise-fs";

export interface OpMoveParams {
  newPath: string;
  currentPath: string;
  setPathData: (p: path.ParsedPath) => void;
}

export function opMove({ currentPath, newPath, setPathData }: OpMoveParams) {
  return fs.rename(currentPath, newPath).then((_) => {
    setPathData(path.parse(newPath));
  });
}
