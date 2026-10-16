export type {
  IconCategory,
  IconCategoryMeta,
  IconGlyphData,
  IconManifestEntry,
  IconProps,
  IconSource,
  IconVariant,
  IconVariantData,
  VerificationStatus,
} from "./types";

export type { DisplayGroupId, DisplayGroupMeta } from "./display-groups";
export {
  displayGroups,
  getDisplayGroupId,
  getDisplayGroupMeta,
} from "./display-groups";

export {
  iconManifest,
  iconCategories,
  getIconManifestEntry,
  getCategoryMeta,
} from "./manifest";

export { createIcon } from "./create-icon";
export { createPersianLabsIcon } from "./create-persian-labs-icon";
export {
  LogoIcon,
  preloadIconCategory,
  preloadAllIconData,
  type LogoIconProps,
} from "./logo-icon";

/** Named icon components — `import { BankMelliIcon } from "@farsiui/icons"` */
export * from "./named-icons";

export {
  persianLabsCategories,
  persianLabsManifest,
} from "./generated/persian-labs/catalog";
export {
  aasaamCategory,
  aasaamManifest,
} from "./generated/aasaam/catalog";
export {
  persianSimpleIconsCategory,
  persianSimpleIconsManifest,
} from "./generated/persian-simple-icons/catalog";
export {
  logosPerServiceCategory,
  logosPerServiceManifest,
} from "./generated/logos-per-service/catalog";
export {
  logosPerBanksCategories,
  logosPerBanksManifest,
} from "./generated/logos-per-banks/catalog";
export {
  cryptoCategory,
  cryptoManifest,
} from "./generated/crypto/catalog";
export { categoryDataLoaders } from "./icon-loaders";
