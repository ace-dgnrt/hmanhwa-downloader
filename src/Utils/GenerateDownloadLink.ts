import type { Manhwa } from "@Data/Manhwa/CreateManhwaEntry";
import type { Resource } from "@Data/Resource/CreateResource";
import { DOWNLOAD_CHAPTER_URL, DOWNLOAD_MANHWA_URL } from "@Endpoints/EndpointUrls";

export function generateManhwaDownloadLink(manhwa: Manhwa) {
  const link = `${DOWNLOAD_MANHWA_URL}/${manhwa.hash}`;
  return link;
}

export function generateChapterDownloadLink(resource: Resource) {
  const link = `${DOWNLOAD_CHAPTER_URL}/${resource.hash}`;
  return link;
}
