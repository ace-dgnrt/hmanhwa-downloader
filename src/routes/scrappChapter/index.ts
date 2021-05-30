import {
  RequestHandler,
  ValidateField,
} from "../../API/RequestHanlder/RequestHandler";
import { DataType } from "../../API/RequestHanlder/types";
import { ResponseCode } from "../../API/types";
import { constructDownloadUrl } from "../../scrapHoster";
import { Logger } from "../../utils/Logger";
import { getChapterEntry } from "./utils";

const ScrapChapterValidators = {
  GET: [ValidateField({ key: "url", required: true, type: DataType.String })],
};

export default RequestHandler()
  .withValidation(() => ScrapChapterValidators)
  .sendResponse(async (api) => {
    const url = api.GET_DATA.url;
    try {
      const entry = await getChapterEntry(url);

      if (!entry) {
        api.response.statusCode = ResponseCode.BAD_REQUEST;
        return {};
      }

      return {
        responseData: [
          {
            download: constructDownloadUrl(entry, api.baseUrl),
            name: entry.getName(),
          },
        ],
      };
    } catch (e) {
      api.response.statusCode = ResponseCode.SERVER_ERROR;
      Logger.warning(e.message, e);
    }
    return {};
  });
