import { Methods } from "@Api/types";
import { downloadManhwaHandler } from "@Endpoints/DownloadManhwa/Handler";
import { DOWNLOAD_MANHWA_URL } from "@Endpoints/EndpointUrls";

export const downloadManhwaRoute = {
  urlPattern: DOWNLOAD_MANHWA_URL,
  methods: [Methods.GET],
  handler: downloadManhwaHandler,
};
