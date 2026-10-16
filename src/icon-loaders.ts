import { categoryDataLoaders as persianLabsLoaders } from "./generated/persian-labs/loaders";
import type { IconVariantData } from "./types";

/**
 * Lazy loaders keyed by category id.
 */
export const categoryDataLoaders: Record<
  string,
  () => Promise<{ data: Record<string, IconVariantData> }>
> = {
  ...persianLabsLoaders,
  aasaam: () => import("./generated/aasaam/data"),
  "persian-simple-icons": () =>
    import("./generated/persian-simple-icons/data"),
  "logos-per-service": () => import("./generated/logos-per-service/data"),
  "logos-per-banks": () =>
    import("./generated/logos-per-banks/data/logos-per-banks"),
  "logos-per-gateways": () =>
    import("./generated/logos-per-banks/data/logos-per-gateways"),
  devicons: () => import("./generated/devicons/data"),
  crypto: () => import("./generated/crypto/data"),
  manual: () => import("./generated/manual/data"),
};
