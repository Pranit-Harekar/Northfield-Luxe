/**
 * Google AdSense configuration.
 *
 * Both values are read from env vars (set them in `.env.local`, which is
 * git-ignored) rather than hardcoded here, so no AdSense identifiers get
 * committed to version control. See `.env.example` for the variable names.
 *
 * `AD_CLIENT` is the account's real publisher id (`NEXT_PUBLIC_ADSENSE_CLIENT_ID`).
 *
 * `HERO_AD_SLOT` is the ad-unit ("slot") id for the shop-page hero placement
 * (`NEXT_PUBLIC_ADSENSE_HERO_SLOT_ID`). Ad units are created per-placement in
 * the AdSense dashboard (Ads → By ad unit). Until a real slot id is
 * configured, AdSense will log a console warning / not fill the slot, but
 * nothing else in the app is affected.
 */
export const AD_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID ?? "";
export const HERO_AD_SLOT = process.env.NEXT_PUBLIC_ADSENSE_HERO_SLOT_ID ?? "";
