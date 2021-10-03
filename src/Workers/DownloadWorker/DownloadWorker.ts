import type { AxiosRequestConfig } from "axios";
import axios from "axios";
import { error } from "error-result";
import { WorkerBridge } from "node-worker-bridge";
import { Worker } from "worker_threads";

import { repackPromise } from "@Utils/repack-promise";
import { stripMethods } from "@Utils/StrinpMethods";

export const downloader = WorkerBridge(
  { file: () => new Worker(new URL("./DownloadWorker.ts", import.meta.url)) },
  () => {
    const download = async <T>(url: string, config: AxiosRequestConfig) => {
      try {
        const result = await repackPromise(axios.get<T>(url, config));

        const strippedResult = stripMethods(result);

        return strippedResult;
      } catch (e) {
        return error(e as Error);
      }
    };

    return { download };
  }
);
