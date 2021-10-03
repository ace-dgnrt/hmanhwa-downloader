import Queue from "async-await-queue";

import { retry } from "@Utils/retry";

import type { Result } from "error-result";

export const DownloadQueue = new Queue(8, 250);

export async function addDownloadToQueue<R>(
  download: () => Promise<Result<R>>
) {
  const queueEntryID = Symbol();
  await DownloadQueue.wait(queueEntryID, 1);
  try {
    const result = await retry(() => download(), 5, 5000);
    return result;
  } finally {
    await DownloadQueue.end(queueEntryID);
  }
}
