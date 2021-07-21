import axios from "axios";
import { isMainThread, workerData } from "worker_threads";
import { repackPromise } from "../../Utils/repack-promise";
import { postWorkerMessage } from "../WorkersMessages";

async function main() {
  if (!isMainThread) {
    const url = workerData.url;
    const config = workerData.config ?? {};

    if (!url)
      return postWorkerMessage({
        event: "error",
        data: "Missing url parameter",
      });

    const result = await repackPromise(axios.get(url, config));

    if (result.error) {
      return postWorkerMessage({
        event: "error",
        data: result.error,
      });
    }

    return postWorkerMessage({
      event: "message",
      data: result.data.data,
    });
  }
}

main();
