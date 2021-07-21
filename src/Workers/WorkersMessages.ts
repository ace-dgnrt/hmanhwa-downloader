import { ResultingPromise } from "error-result";
import type { Worker } from "worker_threads";
import { parentPort } from "worker_threads";

export type WorkerMessage<T = void> =
  | {
      event: "message";
      data: T;
    }
  | {
      event: "error";
      data: unknown;
    };

export function postWorkerMessage<T>(msg: WorkerMessage<T>) {
  parentPort?.postMessage(msg);
}

export function waitForWorkerMessage<T>(w: Worker, timeout = 30_000) {
  type Msg = WorkerMessage<T>;
  return ResultingPromise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("Worker is not responding."));
    }, timeout);

    w.on("message", (d: Msg) => {
      clearTimeout(timer);
      if (d.event === "error") {
        reject(d.data as Error);
      } else {
        resolve(d.data);
      }
    });
    w.on("error", (e) => {
      clearTimeout(timer);
      reject(e);
    });
    w.on("messageerror", (e) => {
      clearTimeout(timer);
      reject(e);
    });
    w.on("exit", () => {
      clearTimeout(timer);
      reject(new Error("Worker exited without returning a message."));
    });
  });
}
