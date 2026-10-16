import {
  persianLabsCategories,
  persianLabsManifest,
} from "./generated/persian-labs/catalog";
import {
  aasaamCategory,
  aasaamManifest,
} from "./generated/aasaam/catalog";
import {
  persianSimpleIconsCategory,
  persianSimpleIconsManifest,
} from "./generated/persian-simple-icons/catalog";
import {
  logosPerServiceCategory,
  logosPerServiceManifest,
} from "./generated/logos-per-service/catalog";
import {
  logosPerBanksCategories,
  logosPerBanksManifest,
} from "./generated/logos-per-banks/catalog";
import {
  deviconsCategory,
  deviconsManifest,
} from "./generated/devicons/catalog";
import {
  cryptoCategory,
  cryptoManifest,
} from "./generated/crypto/catalog";
import {
  manualCategory,
  manualManifest,
} from "./generated/manual/catalog";
import type { IconCategoryMeta, IconManifestEntry } from "./types";

/**
 * Full catalog of icons shipped in this package.
 */
export const iconManifest: IconManifestEntry[] = [
  ...persianLabsManifest,
  ...aasaamManifest,
  ...persianSimpleIconsManifest,
  ...logosPerServiceManifest,
  ...logosPerBanksManifest,
  ...deviconsManifest,
  ...cryptoManifest,
  ...manualManifest,
];

export const iconCategories: IconCategoryMeta[] = [
  ...persianLabsCategories,
  aasaamCategory,
  persianSimpleIconsCategory,
  logosPerServiceCategory,
  ...logosPerBanksCategories,
  deviconsCategory,
  cryptoCategory,
  manualCategory,
];

export function getIconManifestEntry(
  idOrComponent: string,
): IconManifestEntry | undefined {
  return iconManifest.find(
    (entry) =>
      entry.id === idOrComponent || entry.componentName === idOrComponent,
  );
}

export function getCategoryMeta(
  id: string,
): IconCategoryMeta | undefined {
  return iconCategories.find((c) => c.id === id);
}
