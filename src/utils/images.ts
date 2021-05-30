import type { RequestInit, Response } from "node-fetch";
import fetch from "node-fetch";
import { Logger } from "./Logger";

export function extractSrc(img: HTMLImageElement) {
  const srcAttribValue = img.getAttribute("src") || "";
  const src = srcAttribValue.match(
    /http(s){0,1}:\/\/.+?.(jpeg|jpg|png|webp|gif)/i
  );
  if (src && src.length > 0) {
    return src[0];
  } else return "";
}

export async function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(() => resolve(), ms);
  });
}

function promiseWithTimeout<T>(callback: () => Promise<T>, ms?: number) {
  return new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject("Timeout");
    }, 25 * 1000);
    callback()
      .then(resolve)
      .catch(reject)
      .finally(() => {
        clearTimeout(timeout);
      });
  });
}

interface RequestConf {
  url: string;
  options?: RequestInit;
}

interface QueueEntry extends RequestConf {
  onSuccess: (result: any) => void;
  onError: (e: any) => void;
}

class FetchQueue {
  static MAX_ACTIVE_FETCHES = 10;
  private queue: QueueEntry[] = [];
  private processing: QueueEntry[] = [];

  addToQueue(conf: RequestConf) {
    return new Promise<any>((resolve, reject) => {
      this.queue.push({ ...conf, onSuccess: resolve, onError: reject });
      this.processQueue();
    });
  }

  processQueue() {
    const toProcess: QueueEntry[] = [];
    while (true) {
      if (this.queue.length === 0) {
        break;
      }
      if (
        toProcess.length + this.processing.length >=
        FetchQueue.MAX_ACTIVE_FETCHES
      ) {
        break;
      }
      toProcess.push(this.queue.shift()!);
    }
    for (const fetchReq of toProcess) {
      this.processing.push(fetchReq);
      promiseWithTimeout(() => fr(fetchReq.url, { ...fetchReq.options }))
        .then(fetchReq.onSuccess)
        .catch((e) => {
          fetchReq.onError(e);
        })
        .finally(() => {
          this.processing = this.processing.filter((e) => e !== fetchReq);
          this.processQueue();
        });
    }
  }
}

const fetchQueue = new FetchQueue();

export function fetchRetry(url: string, options?: RequestInit) {
  return fetchQueue.addToQueue({ url, options });
}

export async function fr(
  url: string,
  options?: RequestInit,
  retryCount = 0
): Promise<Response> {
  return new Promise<Response>((resolve, reject) => {
    fetch(url, options)
      .then(resolve)
      .catch((e) => {
        if (retryCount < 10) {
          sleep(2000).then(() => {
            fr(url, options, retryCount + 1)
              .then(resolve)
              .catch(reject);
          });
        } else {
          Logger.warning("Error fetching resources", { url });
          reject(e);
        }
      });
  });
}
