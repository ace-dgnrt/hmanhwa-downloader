import { Unit, useProperty, useSideEffect } from "Jsock";
import path from "path";
import fs from "promise-fs";
import { opMove } from "./operations/opMove";
import { opRename } from "./operations/opRename";

// interface FileFacadeInterface {
//   readonly filename: string;
// }

// export class FileFacade implements FileFacadeInterface {
//   private pathData: path.ParsedPath;

//   static createFile(file: Buffer, filePath: string) {
//     return new Promise<FileFacade>((resolve, reject) => {
//       fs.writeFile(filePath, file)
//         .then(() => {
//           resolve(new FileFacade(filePath));
//         })
//         .catch(reject);
//     });
//   }

//   constructor(filepath: string) {
//     if (!fs.existsSync(filepath)) {
//       throw new Error(`File '${filepath}' doesn't exists.`);
//     }
//     this.pathData = path.parse(filepath);
//   }

//   get filename() {
//     return this.pathData.name;
//   }

//   get ext() {
//     return this.pathData.ext;
//   }

//   get location() {
//     return this.pathData.dir;
//   }

//   get fullFilename() {
//     return this.pathData.base;
//   }

//   get fullPath() {
//     return path.join(this.location, this.fullFilename);
//   }

//   move(newPath: string) {
//     return fs.rename(this.fullPath, newPath).then((_) => {
//       this.pathData = path.parse(newPath);
//     });
//   }

//   rename(newName: string) {
//     return this.move(path.join(this.location, newName));
//   }
// }

function assureFileExists(filepath: string) {
  if (!fs.existsSync(filepath)) {
    throw new Error(`File '${filepath}' doesn't exists.`);
  }
}

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

  useSideEffect(() => {
    assureFileExists(fullPath);
  }, [fullPath]);

  return {
    filename,
    ext,
    location,
    fullFilename,
    fullPath,
    move,
    rename,
  };
});

export type FileFacade = ReturnType<typeof NewFileFacade>;
