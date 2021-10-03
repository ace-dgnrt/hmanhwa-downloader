import type { AxiosRequestConfig, AxiosResponse } from "axios";

import { PromiseWT } from "@Utils/PromiseWithTimeout";
import { downloader } from "@Workers/DownloadWorker/DownloadWorker";

export function startDownloadWorker<T = void>(
  url: string,
  config: AxiosRequestConfig = {}
) {
  return PromiseWT<AxiosResponse<T>>(30000, (resolve, reject) => {
    const downloaderInstance = downloader.spawn();

    downloaderInstance
      .download(url, config)
      .then((r) => {
        if (r.error) reject(r.error);
        else resolve(r.data as AxiosResponse<T>);
      })
      .catch(reject);
  });
}
