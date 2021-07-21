import { Unit, useProperty, useSideEffect } from "Jsock";
import md5 from "md5";
import type { FileFacade } from "../../Utils/FileFacade";
import { repackPromise } from "../../Utils/repack-promise";

export const createResource = Unit(() => {
  const [url, setUrl] = useProperty<string>("");
  const [title, setTitle] = useProperty<string>("");
  const [hash, setHash] = useProperty<string>("");
  const [images, setImages] = useProperty<FileFacade[]>([]);
  const [loadPromise, setLoadPromise] = useProperty(
    repackPromise<void>(Promise.reject())
  );

  useSideEffect(() => {
    setHash(md5(url));
  }, [url]);

  return {
    url,
    title,
    images,
    hash,
    loadPromise,
    setUrl,
    setTitle,
    setImages,
    setLoadPromise,
  };
});
