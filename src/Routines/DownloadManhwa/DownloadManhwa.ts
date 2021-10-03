import { error, result } from "error-result";
import md5 from "md5";
import path from "path";

import { MANHWA_DIR } from "@Data/Constants";
import { MANHWA_CONF_FILE_NAME } from "@Data/Manhwa/ConfigFile";
import { createManhwaEntry } from "@Data/Manhwa/CreateManhwaEntry";
import { manhwaStore } from "@Data/Resources";
import { downloadManhwaInfo } from "@Routines/DownloadManhwa/Helpers/DownloadManhwaInfo";
import {
  prepareAllManhwaResources,
} from "@Routines/DownloadManhwa/Helpers/PrepareAllManhwaResources";
import { generateManhwaDownloadLink } from "@Utils/GenerateDownloadLink";
import { Logger } from "@Utils/Logger";

export async function downloadManhwa(url: string) {
  const hash = md5(url);

  let manhwa = manhwaStore.findManhwa(hash);

  if (!manhwa) {
    manhwa = createManhwaEntry(
      path.resolve(MANHWA_DIR, hash, MANHWA_CONF_FILE_NAME)
    );

    manhwaStore.addManhwa(manhwa);
  }

  const info = await downloadManhwaInfo(url);

  Logger.info("Info fetched.", info);

  if (info.error) {
    Logger.error("Fetching info has failed.", info.error);
    return error(info.error);
  }

  if (manhwa.title !== info.data.title) manhwa.setTitle(info.data.title);

  for (const chapter of info.data.chapters) {
    const href = chapter.getAttribute("href");
    if (href) manhwa.addResourceRelation(href);
  }

  const resources = await prepareAllManhwaResources(manhwa);

  if (resources.error) {
    Logger.error("Downloading resources has failed.", resources.error);
    return error(resources.error);
  }

  return result(generateManhwaDownloadLink(manhwa));
}
