import { PromiseWT } from "@Utils/PromiseWithTimeout";
import { scrapper } from "@Workers/SPAScrapper.ts/ScrapperWorker";

import type { ScrapperConfig } from "@Workers/SPAScrapper.ts/ScrapperWorker";

const scrapperPool = scrapper.createPool(4);

export function startScrapperWorker(
  url: string,
  config: ScrapperConfig = { selectorToWait: "body" }
) {
  return PromiseWT<string>(
    120000,
    (resolve, reject) => {
      scrapperPool
        .get(url, config)
        .then((r) => {
          if (r.error) reject(r.error);
          else resolve(r.data);
        })
        .catch(reject);
    },
    "Puppeteer scrapper has timed out."
  );
}
