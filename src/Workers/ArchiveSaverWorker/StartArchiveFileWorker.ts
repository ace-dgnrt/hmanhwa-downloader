import { PromiseWT } from "@Utils/PromiseWithTimeout";
import { stripMethods } from "@Utils/StrinpMethods";
import { archiver } from "@Workers/ArchiveSaverWorker/ArchiveFileWorker";

import type { Resource } from "@Data/Resource/CreateResource";

const archiverPool = archiver.createPool(4);

export function startSaveArchiveFileWorker(
  filePath: string,
  resources: Resource[]
) {
  return PromiseWT<string>(
    5 * 60 * 1000,
    (resolve, reject) => {
      archiverPool
        .create(
          filePath,
          resources.map((r) => stripMethods(r))
        )
        .then((r) => {
          if (r.error) reject(r.error);
          else resolve(r.data);
        })
        .catch(reject);
    },
    "Archiver has timed out."
  );
}
