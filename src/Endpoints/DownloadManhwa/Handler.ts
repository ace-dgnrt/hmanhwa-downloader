import { error, result } from "error-result";
import fs from "fs";

import { ContentType, Header } from "@Api/Headers";
import { RequestHandler, ValidateField } from "@Api/RequestHandler/RequestHandler";
import { DataType } from "@Api/RequestHandler/types";
import { manhwaStore } from "@Data/Resources";

import type { ResponseHandlerResult } from "@Api/types";
import type { Result } from "error-result";
const VALIDATORS = {
  GET: [ValidateField({ key: "hash", required: true, type: DataType.String })],
};

export const downloadManhwaHandler = RequestHandler()
  .withValidation(() => VALIDATORS)
  .sendResponse(async (api): Promise<Result<ResponseHandlerResult>> => {
    const manhwaHash = api.GET_DATA.hash;

    const manhwa = manhwaStore.findManhwa(manhwaHash);

    if (!manhwa) {
      return error("Invalid URL");
    }

    const file = await manhwa.getFile();

    if (file.error) {
      return error(file.error);
    }

    api.response.setHeader(Header.ContentType, ContentType.ZIP);
    api.response.setHeader(
      Header.ContentDisposition,
      `attachment; filename="${
        manhwa.title.replace('"', "'") ?? "package"
      }.zip"`
    );

    return result({
      stream: fs.createReadStream(file.data),
      options: { isStream: true },
    });
  });
