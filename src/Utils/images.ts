export function extractSrc(img: HTMLImageElement) {
  const srcAttribValue = img.getAttribute("src") ?? "";
  const src = srcAttribValue.match(
    /http(s){0,1}:\/\/.+?.(jpeg|jpg|png|webp|gif)/i
  );
  if (src && src.length > 0) {
    return src[0];
  } else return undefined;
}

export async function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(() => resolve(), ms);
  });
}
