import type { AxiosRequestConfig } from "axios";
import { Worker } from "worker_threads";
import type { WorkerMessage } from "../WorkersMessages";
import { waitForWorkerMessage } from "../WorkersMessages";

export type DownloadWorkerMessage = WorkerMessage<string>;

export function startDownloadWorker<T = void>(
  url: string,
  config: AxiosRequestConfig = {}
) {
  const w = new Worker(new URL("./DownloadWorker.ts", import.meta.url), {
    workerData: { url, config },
  });

  return waitForWorkerMessage<T>(w);
}
