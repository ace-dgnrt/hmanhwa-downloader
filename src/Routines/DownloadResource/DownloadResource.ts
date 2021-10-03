import { error, result } from "error-result";
import md5 from "md5";
import path from "path";

import { RESOURCE_DIR } from "@Data/Constants";
import { RESOURCE_CONF_FILE_NAME } from "@Data/Resource/ConfigFile";
import { createResource } from "@Data/Resource/CreateResource";
import { resourceStore } from "@Data/Resources";
import { downloadResourceImages } from "@Routines/DownloadResource/Helpers/DownloadResourceImages";
import { downloadResourceInfo } from "@Routines/DownloadResource/Helpers/DownloadResourceInfo";
import { saveImagesToDisk } from "@Routines/DownloadResource/Helpers/SaveImagesToDisk";
import { Logger } from "@Utils/Logger";

export async function downloadResource(url: string, index = -1) {
  Logger.info("Downloading resource.", { url });

  const hash = md5(url);

  const existingResource = resourceStore.findResource(hash);

  if (existingResource) {
    return result(existingResource);
  }

  const dir = path.resolve(RESOURCE_DIR, hash);

  const resource = createResource(path.resolve(dir, RESOURCE_CONF_FILE_NAME));

  resource.setUrl(url);

  resourceStore.addResource(resource);

  const onResourceLoadFail = (e: Error) => {
    resource.setLoadFailed(e);
    resourceStore.deleteResource(resource.hash);
  };

  const info = await downloadResourceInfo(url, index);

  if (info.error) {
    Logger.error("Downloading resource info has failed.", info.error);
    onResourceLoadFail(info.error);
    return error(info.error);
  }

  const images = await downloadResourceImages(info.data.images);

  if (images.error) {
    Logger.error("Downloading images has failed.", images.error);
    onResourceLoadFail(images.error);
    return error(images.error);
  }

  Logger.info("Resource downloaded, saving to disk.", { url });

  const files = await saveImagesToDisk(images.data, resource.hash);

  if (files.error) {
    Logger.error("Saving images has failed.", files.error);
    onResourceLoadFail(files.error);
    return error(files.error);
  }

  resource.setTitle(info.data.title);
  resource.setChapterNumber(info.data.number);
  resource.setImages(files.data);

  resource.setLoaded();

  Logger.info("Successfully downloaded resource.", { url });

  return result(resource);
}
