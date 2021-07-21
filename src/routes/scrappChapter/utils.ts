import { getCurrentHoster } from "../../scrapHoster";
import type { Chapter } from "../../scrapHoster/ChapterController/ChapterController";
import { getChapterController } from "../../scrapHoster/ChapterController/ChapterController";

export const getChapterEntry = async (url: string) => {
  const hoster = getCurrentHoster();
  const existingEntry = hoster.getByUrl(url);

  if (existingEntry) {
    return existingEntry;
  }

  const chapterController = getChapterController();

  const chapter = await (async () => {
    const chap = chapterController.getChapter(url);
    if (chap) {
      return chap;
    }
    const c = await chapterController.addChapter(url);

    return await new Promise<Chapter>((resolve, reject) => {
      c.onLoad((chapter) => {
        if (chapter) {
          resolve(chapter);
        } else {
          reject();
        }
      });
    });
  })();

  const entry = await hoster.addNewEntry([chapter], chapter.chapterName, url);

  return entry;
};
