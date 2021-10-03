import axios from "axios";
import { error, result } from "error-result";

import { addDownloadToQueue } from "@Utils/DownloadQueue";
import { repackPromise } from "@Utils/repack-promise";

async function downloadImage(src: string) {
  const image = await addDownloadToQueue(() =>
    repackPromise(
      axios
        .get<ArrayBuffer>(src, { responseType: "arraybuffer" })
        .then((r) => r.data)
    )
  );

  if (image.error) {
    return error(image.error);
  }

  const [name] = src.split("/").reverse();

  const [ext] = name.split(".").reverse();

  let extension = "jpg";
  if (/^(jpg|jpeg|webp|gif|png)$/.test(ext)) {
    extension = ext;
  }

  return result({ data: image.data, extension });
}

export async function downloadResourceImages(imagesSrc: string[]) {
  const allImages = await Promise.all(imagesSrc.map(downloadImage));

  for (const image of allImages) {
    if (image.error) {
      return error(image.error);
    }
  }

  return result(allImages.map((elem) => elem.data!));
}
