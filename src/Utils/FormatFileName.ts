export function formatName(n: number | string, ext: string) {
  const name = `${n}`;
  return `${Array.from({ length: Math.max(0, 4 - name.length) }, () => 0).join(
    ""
  )}${name}${ext}`;
}
