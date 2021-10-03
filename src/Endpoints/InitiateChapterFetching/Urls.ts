import { Methods } from "@Api/types";
import { INITIATE_CHAPTER_FETCH_URL } from "@Endpoints/EndpointUrls";
import { initiateChapterFetchingHandler } from "@Endpoints/InitiateChapterFetching/Handler";

export const initChapterFetchRoute = {
  urlPattern: INITIATE_CHAPTER_FETCH_URL,
  methods: [Methods.GET],
  handler: initiateChapterFetchingHandler,
};
