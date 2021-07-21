import { error, result } from "error-result";
import md5 from "md5";
import { createResource } from "../../Data/Resource/CreateResource";
import { resourceStore } from "../../Data/Resources";
import { createLoadPromise } from "../../Utils/load-promise";
import { downloadResourceImages } from "./Helpers/DownloadResourceImages";
import { downloadResourceInfo } from "./Helpers/DownloadResourceInfo";
import { saveImagesToDisk } from "./Helpers/SaveImagesToDisk";

export async function downloadResource(url: string) {
  const hash = md5(url);

  const existingResource = resourceStore.findResource(hash);

  if (existingResource) {
    return result(existingResource);
  }

  const loading = createLoadPromise();

  const resource = createResource();
  resource.setUrl(url);
  resource.setLoadPromise(loading.promise);

  resourceStore.addResource(resource);

  const onResourceLoadFail = (e: Error | string) => {
    loading.reject(e);
    resourceStore.deleteResource(resource.hash);
  };

  const info = await downloadResourceInfo(url);

  if (info.error) {
    onResourceLoadFail(info.error);
    return error(info.error);
  }

  const images = await downloadResourceImages(info.data.images);

  if (images.error) {
    onResourceLoadFail(images.error);
    return error(images.error);
  }

  const files = await saveImagesToDisk(images.data, resource.hash);

  if (files.error) {
    onResourceLoadFail(files.error);
    return error(files.error);
  }

  resource.setTitle(info.data.title);
  resource.setImages(files.data);

  loading.resolve();

  return result(resource);
}
