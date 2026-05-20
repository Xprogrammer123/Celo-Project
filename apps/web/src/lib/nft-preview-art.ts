/** On-chain SVG art mirrored from LootScratch.sol — used for marketing previews */

export type NftRarityId = 0 | 1 | 2 | 3;

export const NFT_SHOWCASE = [
  { id: 0, label: "COMMON", tokenId: 42 },
  { id: 1, label: "RARE", tokenId: 7 },
  { id: 2, label: "EPIC", tokenId: 88 },
  { id: 3, label: "LEGENDARY", tokenId: 1 },
] as const;

function svgDataUri(svg: string) {
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function svgCommon(tokenId: number, uid: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><defs><pattern id="cg${uid}" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M0 0h20v20H0z" fill="none" stroke="#000" stroke-width="1"/></pattern></defs><rect width="400" height="400" fill="#ffffff"/><rect width="400" height="400" fill="url(#cg${uid})" opacity="0.12"/><rect x="120" y="170" width="160" height="60" fill="#9e9e9e" stroke="#000" stroke-width="2"/><text x="200" y="210" text-anchor="middle" font-family="monospace" font-size="22" fill="#000">COMMON</text><text x="200" y="360" text-anchor="middle" font-family="monospace" font-size="14" fill="#000">#${tokenId}</text></svg>`;
}

function svgRare(tokenId: number, uid: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><defs><pattern id="s${uid}" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="10" height="20" fill="#000"/></pattern></defs><rect width="400" height="400" fill="#ffdb33"/><rect width="400" height="400" fill="url(#s${uid})" opacity="0.15"/><rect x="40" y="40" width="320" height="320" fill="none" stroke="#0066cc" stroke-width="6"/><text x="200" y="210" text-anchor="middle" font-family="monospace" font-size="26" fill="#000">RARE</text><text x="200" y="360" text-anchor="middle" font-family="monospace" font-size="14" fill="#000">#${tokenId}</text></svg>`;
}

function svgEpic(tokenId: number, uid: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect width="400" height="400" fill="#321b1b"/><line x1="200" y1="200" x2="200" y2="40" stroke="#fff" stroke-width="2"/><line x1="200" y1="200" x2="360" y2="200" stroke="#fff" stroke-width="2"/><line x1="200" y1="200" x2="200" y2="360" stroke="#fff" stroke-width="2"/><line x1="200" y1="200" x2="40" y2="200" stroke="#fff" stroke-width="2"/><line x1="200" y1="200" x2="320" y2="80" stroke="#fff" stroke-width="2"/><line x1="200" y1="200" x2="320" y2="320" stroke="#fff" stroke-width="2"/><line x1="200" y1="200" x2="80" y2="320" stroke="#fff" stroke-width="2"/><line x1="200" y1="200" x2="80" y2="80" stroke="#fff" stroke-width="2"/><circle cx="200" cy="200" r="70" fill="none" stroke="#9c27b0" stroke-width="5"/><text x="200" y="210" text-anchor="middle" font-family="monospace" font-size="28" fill="#fff">EPIC</text><text x="200" y="360" text-anchor="middle" font-family="monospace" font-size="14" fill="#9c27b0">#${tokenId}</text></svg>`;
}

function svgLegendary(tokenId: number, uid: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><defs><pattern id="p${uid}" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="4" height="4" fill="#333"/><rect x="4" y="4" width="4" height="4" fill="#333"/></pattern></defs><rect width="400" height="400" fill="#000"/><rect x="20" y="20" width="360" height="360" fill="none" stroke="#ffd700" stroke-width="8"/><rect x="40" y="40" width="320" height="320" fill="url(#p${uid})" opacity="0.4"/><text x="200" y="190" text-anchor="middle" font-family="monospace" font-size="24" fill="#e63946">LEGENDARY</text><text x="200" y="230" text-anchor="middle" font-family="monospace" font-size="16" fill="#ffd700">#${tokenId}</text></svg>`;
}

export function nftPreviewImage(
  rarity: NftRarityId,
  tokenId: number,
  uid = "a"
): string {
  const svg =
    rarity === 3
      ? svgLegendary(tokenId, uid)
      : rarity === 2
        ? svgEpic(tokenId, uid)
        : rarity === 1
          ? svgRare(tokenId, uid)
          : svgCommon(tokenId, uid);
  return svgDataUri(svg);
}

/** Prize tiles in memory game use Epic on-chain art */
export const NFT_PRIZE_PREVIEW = nftPreviewImage(2, 88, "prize");
