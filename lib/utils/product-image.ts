/**
 * The seeded catalog shares one generic placehold.co image for every product
 * (see lib/db/seed.ts). Its light-gray background looks jarring against a
 * dark theme, so swap in a dark-appropriate color pair for that specific
 * placeholder URL when the site is in dark mode. Any other image URL
 * (e.g. a real product photo) is returned unchanged.
 */
const PLACEHOLD_CO_PATTERN = /^https:\/\/placehold\.co\/(\d+x\d+)\/[0-9a-fA-F]{3,6}\/[0-9a-fA-F]{3,6}(\?.*)?$/;

const DARK_COLORS = "27272a/a1a1aa";

export function themedProductImageSrc(src: string, isDark: boolean): string {
  if (!isDark) return src;
  const match = PLACEHOLD_CO_PATTERN.exec(src);
  if (!match) return src;
  const [, size, query = ""] = match;
  return `https://placehold.co/${size}/${DARK_COLORS}${query}`;
}
