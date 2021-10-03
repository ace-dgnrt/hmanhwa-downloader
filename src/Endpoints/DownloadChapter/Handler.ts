import { error, result } from "error-result";
import fs from "fs";

import { ContentType, Header } from "@Api/Headers";
import { RequestHandler, ValidateField } from "@Api/RequestHandler/RequestHandler";
import { DataType } from "@Api/RequestHandler/types";
import { resourceStore } from "@Data/Resources";

import type { ResponseHandlerResult } from "@Api/types";
import type { Result } from "error-result";
const VALIDATORS = {
  GET: [ValidateField({ key: "hash", required: true, type: DataType.String })],
};

export const downloadChapterHandler = RequestHandler()
  .withValidation(() => VALIDATORS)
  .sendResponse(async (api): Promise<Result<ResponseHandlerResult>> => {
    const chapterHash = api.GET_DATA.hash;

    const chapter = resourceStore.findResource(chapterHash);

    if (!chapter) {
      return error("Invalid URL");
    }

    const exists = await chapter.isResourceExist();

    if (!exists) {
      return error("Resource is not ready yet.");
    }

    const file = await chapter.getFile();

    api.response.setHeader(Header.ContentType, ContentType.ZIP);
    api.response.setHeader(
      Header.ContentDisposition,
      `attachment; filename="${
        chapter.title.replace('"', "'") ?? "package"
      }.zip"`
    );

    return result({
      stream: fs.createReadStream(file.data),
      options: { isStream: true },
    });
  });
