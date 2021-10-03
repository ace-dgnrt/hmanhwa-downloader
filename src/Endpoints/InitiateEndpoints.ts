import type Api from "@Api/api";
import type { Result } from "error-result";
import { result } from "error-result";

import { Methods } from "@Api/types";
import { downloadChapterRoute } from "@Endpoints/DownloadChapter/Urls";
import { downloadManhwaRoute } from "@Endpoints/DownloadManhwa/Urls";
import { initChapterFetchRoute } from "@Endpoints/InitiateChapterFetching/Urls";
import { initManhwaFetchRoute } from "@Endpoints/InitiateManhwaFetching/Urls";
import { Logger } from "@Utils/Logger";

import type { ApiRoute, ResponseHandlerResult } from "@Api/types";

async function apiEndpointsHandler(): Promise<Result<ResponseHandlerResult>> {
  return result({
    responseData: ROUTES.map((r) => ({
      route: r.urlPattern,
      methods: r.methods,
    })),
  });
}

const apiEndpointsRoute: ApiRoute = {
  handler: apiEndpointsHandler,
  methods: [Methods.GET],
  urlPattern: "/endpoints",
};

const ROUTES: ApiRoute[] = [
  initManhwaFetchRoute,
  initChapterFetchRoute,
  downloadManhwaRoute,
  downloadChapterRoute,
  apiEndpointsRoute,
];

export function initiateEndpoints(API: Api) {
  for (const config of ROUTES) {
    Logger.debug(`Initiating endpoint for pattern [${config.urlPattern}].`);
    API.register(config);
  }
}
