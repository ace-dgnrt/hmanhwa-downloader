import { error, result } from "error-result";

import { RequestHandler, ValidateField } from "@Api/RequestHandler/RequestHandler";
import { DataType } from "@Api/RequestHandler/types";
import { downloadManhwa } from "@Routines/DownloadManhwa/DownloadManhwa";
import { Logger } from "@Utils/Logger";

import type { ResponseHandlerResult } from "@Api/types";
import type { Result } from "error-result";
const VALIDATORS = {
  GET: [ValidateField({ key: "url", required: true, type: DataType.String })],
};

export const initiateManhwaFetchingHandler = RequestHandler()
  .withValidation(() => VALIDATORS)
  .sendResponse(async (data): Promise<Result<ResponseHandlerResult>> => {
    const manhwaUrl = data.GET_DATA.url;

    Logger.info("Initiating download of manhwa.", { manhwaUrl });

    const processResult = await downloadManhwa(manhwaUrl);

    if (processResult.error) {
      return error(processResult.error);
    }

    return result({
      responseData: {
        download: processResult.data,
      },
    });
  });
