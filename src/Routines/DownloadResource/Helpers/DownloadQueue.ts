import Queue from "async-await-queue";
import type { Result } from "error-result";

export const DownloadQueue = new Queue(10, 10);

export async function addDownloadToQueue<R>(
  download: () => Promise<Result<R>>
) {
  const queueEntryID = Symbol();
  await DownloadQueue.wait(queueEntryID, 1);
  try {
    return await download();
  } finally {
    await DownloadQueue.end(queueEntryID);
  }
}
