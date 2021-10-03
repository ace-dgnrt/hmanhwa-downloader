import { error, result } from "error-result";
import md5 from "md5";

import { RequestHandler, ValidateField } from "@Api/RequestHandler/RequestHandler";
import { DataType } from "@Api/RequestHandler/types";
import { resourceStore } from "@Data/Resources";
import { downloadResource } from "@Routines/DownloadResource/DownloadResource";
import { generateChapterDownloadLink } from "@Utils/GenerateDownloadLink";

import type { ResponseHandlerResult } from "@Api/types";
import type { Result } from "error-result";
const VALIDATORS = {
  GET: [ValidateField({ key: "url", required: true, type: DataType.String })],
};

export const initiateChapterFetchingHandler = RequestHandler()
  .withValidation(() => VALIDATORS)
  .sendResponse(async (data): Promise<Result<ResponseHandlerResult>> => {
    const chapterUrl = data.GET_DATA.url;

    const resource = resourceStore.findResource(md5(chapterUrl));

    if (resource) {
      const resourceLoadingResult = await resource.wait();

      if (resourceLoadingResult.error) {
        return error(resourceLoadingResult.error);
      }

      return result({
        responseData: {
          download: generateChapterDownloadLink(resource),
        },
      });
    }

    const processResult = await downloadResource(chapterUrl); // TODO: add the chapter number for chapters downloaded through here

    if (processResult.error) {
      return error(processResult.error);
    }

    return result({
      responseData: {
        download: generateChapterDownloadLink(processResult.data),
      },
    });
  });
