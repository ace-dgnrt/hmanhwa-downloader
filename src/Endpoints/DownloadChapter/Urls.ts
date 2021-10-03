import { Methods } from "@Api/types";
import { downloadChapterHandler } from "@Endpoints/DownloadChapter/Handler";
import { DOWNLOAD_CHAPTER_URL } from "@Endpoints/EndpointUrls";

export const downloadChapterRoute = {
  urlPattern: DOWNLOAD_CHAPTER_URL,
  methods: [Methods.GET],
  handler: downloadChapterHandler,
};
