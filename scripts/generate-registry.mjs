/**
 * Builds registry/ for the CLI (GitHub / jsDelivr).
 * Reads generated catalogs + icon data — does not re-parse SVGs.
 */
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const gen = join(root, "src", "generated");
const outRoot = join(root, "registry");
const outIcons = join(outRoot, "icons");

/** Catalog TS files that export a *Manifest array. */
const CATALOG_FILES = [
  "persian-labs/catalog.ts",
  "aasaam/catalog.ts",
  "persian-simple-icons/catalog.ts",
  "logos-per-service/catalog.ts",
  "logos-per-banks/catalog.ts",
  "devicons/catalog.ts",
  "crypto/catalog.ts",
  "social/catalog.ts",
  "manual/catalog.ts",
];

/**
 * category id → relative path under src/generated to a data module.
 */
const DATA_BY_CATEGORY = {
  "app-store": "persian-labs/data/app-store.ts",
  automobiles: "persian-labs/data/automobiles.ts",
  banks: "persian-labs/data/banks.ts",
  "business-chain-stores": "persian-labs/data/business-chain-stores.ts",
  "detergent-hygiene": "persian-labs/data/detergent-hygiene.ts",
  "fashion-clothing": "persian-labs/data/fashion-clothing.ts",
  "food-drink": "persian-labs/data/food-drink.ts",
  football: "persian-labs/data/football.ts",
  "household-appliances": "persian-labs/data/household-appliances.ts",
  insurance: "persian-labs/data/insurance.ts",
  isp: "persian-labs/data/isp.ts",
  "media-news": "persian-labs/data/media-news.ts",
  "organization-departments": "persian-labs/data/organization-departments.ts",
  "payment-gateways": "persian-labs/data/payment-gateways.ts",
  "social-media": "persian-labs/data/social-media.ts",
  "tech-companies": "persian-labs/data/tech-companies.ts",
  transportation: "persian-labs/data/transportation.ts",
  tv: "persian-labs/data/tv.ts",
  university: "persian-labs/data/university.ts",
  vod: "persian-labs/data/vod.ts",
  "website-applications": "persian-labs/data/website-applications.ts",
  aasaam: "aasaam/data.ts",
  "persian-simple-icons": "persian-simple-icons/data.ts",
  "logos-per-service": "logos-per-service/data.ts",
  "logos-per-banks": "logos-per-banks/data/logos-per-banks.ts",
  "logos-per-gateways": "logos-per-banks/data/logos-per-gateways.ts",
  devicons: "devicons/data.ts",
  crypto: "crypto/data.ts",
  social: "social/data.ts",
  manual: "manual/data.ts",
};

function extractAllManifestArrays(source) {
  const out = [];
  // Handle `export const fooManifest: Type[] = [...]`
  const re = /export const \w+Manifest(?::[^=]+)?=\s*(\[[\s\S]*?\]);/g;
  let m;
  while ((m = re.exec(source))) {
    out.push(...JSON.parse(m[1]));
  }
  return out;
}

function extractDataRecord(source) {
  const marker = "export const data";
  const start = source.indexOf(marker);
  if (start < 0) throw new Error("data export not found");
  const brace = source.indexOf("{", start);
  let depth = 0;
  for (let i = brace; i < source.length; i += 1) {
    const c = source[i];
    if (c === "{") depth += 1;
    else if (c === "}") {
      depth -= 1;
      if (depth === 0) {
        return JSON.parse(source.slice(brace, i + 1));
      }
    }
  }
  throw new Error("unclosed data object");
}

const dataCache = new Map();

async function loadDataForCategory(category) {
  if (dataCache.has(category)) return dataCache.get(category);
  const rel = DATA_BY_CATEGORY[category];
  if (!rel) {
    dataCache.set(category, null);
    return null;
  }
  const text = await readFile(join(gen, rel), "utf8");
  const data = extractDataRecord(text);
  dataCache.set(category, data);
  return data;
}

// Only wipe brand icons + index — keep registry/lucide/ intact.
await rm(outIcons, { recursive: true, force: true });
try {
  await rm(join(outRoot, "index.json"), { force: true });
} catch {
  /* missing */
}
await mkdir(outIcons, { recursive: true });

const manifest = [];
for (const rel of CATALOG_FILES) {
  const text = await readFile(join(gen, rel), "utf8");
  manifest.push(...extractAllManifestArrays(text));
}

manifest.sort((a, b) => a.id.localeCompare(b.id));

const index = [];
let written = 0;
let skipped = 0;

for (const entry of manifest) {
  const data = await loadDataForCategory(entry.category);
  const variants = data?.[entry.id];
  if (!variants?.color || !variants?.mono) {
    skipped += 1;
    continue;
  }

  const file = `icons/${entry.id}.json`;
  const payload = {
    id: entry.id,
    nameFa: entry.nameFa,
    nameEn: entry.nameEn,
    componentName: entry.componentName,
    category: entry.category,
    brandColors: entry.brandColors,
    color: {
      viewBox: variants.color.viewBox,
      body: variants.color.body,
    },
    mono: {
      viewBox: variants.mono.viewBox,
      body: variants.mono.body,
    },
  };

  await writeFile(join(outRoot, file), JSON.stringify(payload));
  index.push({
    id: entry.id,
    nameFa: entry.nameFa,
    nameEn: entry.nameEn,
    componentName: entry.componentName,
    category: entry.category,
    file,
  });
  written += 1;
}

await writeFile(
  join(outRoot, "index.json"),
  JSON.stringify(
    {
      name: "farsiui-icons",
      version: 1,
      count: index.length,
      icons: index,
    },
    null,
    2,
  ),
);

console.log(
  `Registry: wrote ${written} icons → ${outRoot}` +
    (skipped ? ` (skipped ${skipped} missing data)` : ""),
);
