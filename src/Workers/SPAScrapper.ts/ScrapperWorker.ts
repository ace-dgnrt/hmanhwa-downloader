import type { Result } from "error-result";
import { error, result } from "error-result";
import { WorkerBridge } from "node-worker-bridge";
import puppeteer from "puppeteer";
import { Worker } from "worker_threads";

import { retry } from "@Utils/retry";

export type ScrapperConfig = { selectorToWait: string };

export const scrapper = WorkerBridge(
  { file: () => new Worker(new URL("./ScrapperWorker.ts", import.meta.url)) },
  () => {
    const init = puppeteer.launch();

    const _get = async (
      url: string,
      config: ScrapperConfig
    ): Promise<Result<string>> => {
      let page: puppeteer.Page | undefined = undefined;
      try {
        const browser = await init;

        page = await browser.newPage();

        await page.goto(url);

        await page.waitForSelector(config.selectorToWait);

        const pageContent = await page.content();

        page.close();

        return result(pageContent);
      } catch (e) {
        if (page) {
          page.close();
        }
        return error(e as Error);
      }
    };

    const get = (url: string, config: ScrapperConfig) =>
      retry(() => _get(url, config), 4, 2500);

    return { get };
  }
);
