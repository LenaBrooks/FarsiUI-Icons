import type { SVGProps } from "react";

/** Category ids across all asset sources. */
export type IconCategory =
  | "app-store"
  | "automobiles"
  | "banks"
  | "business-chain-stores"
  | "detergent-hygiene"
  | "fashion-clothing"
  | "food-drink"
  | "football"
  | "household-appliances"
  | "insurance"
  | "isp"
  | "media-news"
  | "organization-departments"
  | "payment-gateways"
  | "social-media"
  | "tech-companies"
  | "transportation"
  | "tv"
  | "university"
  | "vod"
  | "website-applications"
  | "aasaam"
  | "persian-simple-icons"
  | "logos-per-service"
  | "logos-per-banks"
  | "logos-per-gateways"
  | "devicons"
  | "manual";

export type VerificationStatus = "verified" | "needs-official-svg";

export type IconVariant = "color" | "mono";

export type IconSource =
  | "persian-labs"
  | "aasaam"
  | "persian-simple-icons"
  | "logos-per-service"
  | "logos-per-banks"
  | "devicons"
  | "manual";

export interface IconProps extends SVGProps<SVGSVGElement> {
  /**
   * Square box size (width and height). Artwork is centered with
   * `preserveAspectRatio="xMidYMid meet"`. Pass `width`/`height` to override.
   */
  size?: number | string;
  /**
   * Accessible name. When set, the icon is exposed to assistive tech.
   * When omitted, the icon is treated as decorative (`aria-hidden`).
   */
  title?: string;
  /** Prefer color artwork, or mono (currentColor) marks. */
  variant?: IconVariant;
}

export interface IconGlyphData {
  viewBox: string;
  width: number;
  height: number;
  body: string;
}

export interface IconVariantData {
  color: IconGlyphData;
  mono: IconGlyphData;
}

export interface IconManifestEntry {
  id: string;
  nameFa: string;
  nameEn: string;
  componentName: string;
  category: IconCategory;
  source?: IconSource;
  sourceUrl: string;
  verificationStatus: VerificationStatus;
  notes?: string;
  viewBox: string;
  aspectRatio: number;
}

export interface IconCategoryMeta {
  id: IconCategory;
  prefix: string;
  labelEn: string;
  labelFa: string;
  count: number;
}
