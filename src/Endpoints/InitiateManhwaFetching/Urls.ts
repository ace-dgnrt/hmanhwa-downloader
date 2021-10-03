import { Methods } from "@Api/types";
import { INITIATE_MANHWA_FETCH_URL } from "@Endpoints/EndpointUrls";
import { initiateManhwaFetchingHandler } from "@Endpoints/InitiateManhwaFetching/Handler";

export const initManhwaFetchRoute = {
  urlPattern: INITIATE_MANHWA_FETCH_URL,
  methods: [Methods.GET],
  handler: initiateManhwaFetchingHandler,
};
