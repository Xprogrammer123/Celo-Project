/** Parse data:application/json;base64 tokenURI and return image data URI. */
export function imageFromTokenURI(tokenURI: string): string | null {
  const prefix = "data:application/json;base64,";
  if (!tokenURI.startsWith(prefix)) return null;
  try {
    const json = JSON.parse(
      atob(tokenURI.slice(prefix.length))
    ) as { image?: string };
    return json.image ?? null;
  } catch {
    return null;
  }
}
