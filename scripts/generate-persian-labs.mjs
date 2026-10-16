/**
 * Reads assets/persian-labs/{category}/{color|mono}/*.svg
 * and emits catalog + optimized SVG data modules for the package.
 */
import { mkdir, readdir, readFile, writeFile, rm } from "node:fs/promises";
import { basename, dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { optimize } from "svgo";
import { normalizeOpticalViewBox } from "./lib/optical-normalize.mjs";

/** Wide wordmarks — maxZoom 1 avoids side crop. */
const OPTICAL_OPTIONS = {
  "store-ofogh-kourosh": { maxZoom: 1 },
  "ofogh-kourosh": { maxZoom: 1 },
};
import {
  flushComponentRegistry,
  claimComponentName,
  unregisterIds,
} from "./lib/component-registry.mjs";
import { brandColorsField } from "./lib/brand-colors.mjs";
import { nameFaForId } from "./lib/name-fa.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = join(root, "assets", "persian-labs");
const outRoot = join(root, "src", "generated", "persian-labs");

/** Folder → stable id prefix + display labels (matches icons.persian-labs.ir) */
const CATEGORIES = {
  "app-store": {
    id: "app-store",
    prefix: "app",
    labelEn: "App Stores",
    labelFa: "فروشگاه اپ",
  },
  automobiles: {
    id: "automobiles",
    prefix: "automobile",
    labelEn: "Automobiles",
    labelFa: "خودرو",
  },
  banks: {
    id: "banks",
    prefix: "bank",
    labelEn: "Banks",
    labelFa: "بانک‌ها",
  },
  "business-chain-stores": {
    id: "business-chain-stores",
    prefix: "store",
    labelEn: "Chain Stores",
    labelFa: "فروشگاه‌های زنجیره‌ای",
  },
  "detergent-hygiene": {
    id: "detergent-hygiene",
    prefix: "detergent",
    labelEn: "Detergent & Hygiene",
    labelFa: "بهداشت و شوینده",
  },
  "fashion-clothing": {
    id: "fashion-clothing",
    prefix: "fashion",
    labelEn: "Fashion & Clothing",
    labelFa: "مد و پوشاک",
  },
  "food-drink": {
    id: "food-drink",
    prefix: "food",
    labelEn: "Food & Drink",
    labelFa: "خوردنی و نوشیدنی",
  },
  football: {
    id: "football",
    prefix: "football",
    labelEn: "Football Clubs",
    labelFa: "باشگاه‌های فوتبال",
  },
  "household-appliances": {
    id: "household-appliances",
    prefix: "appliance",
    labelEn: "Household Appliances",
    labelFa: "لوازم خانگی",
  },
  insurance: {
    id: "insurance",
    prefix: "insurance",
    labelEn: "Insurance",
    labelFa: "بیمه",
  },
  isp: {
    id: "isp",
    prefix: "isp",
    labelEn: "ISPs",
    labelFa: "اپراتور و اینترنت",
  },
  "media-news": {
    id: "media-news",
    prefix: "media",
    labelEn: "Media & News",
    labelFa: "رسانه و خبر",
  },
  "organization-departments": {
    id: "organization-departments",
    prefix: "organization",
    labelEn: "Organizations",
    labelFa: "سازمان‌ها",
  },
  "payment-gateways": {
    id: "payment-gateways",
    prefix: "gateway",
    labelEn: "Payment Gateways",
    labelFa: "درگاه پرداخت",
  },
  "social-media": {
    id: "social-media",
    prefix: "social",
    labelEn: "Social Media",
    labelFa: "شبکه‌های اجتماعی",
  },
  "tech-companies": {
    id: "tech-companies",
    prefix: "tech",
    labelEn: "Tech Companies",
    labelFa: "شرکت‌های فناوری",
  },
  transportation: {
    id: "transportation",
    prefix: "transportation",
    labelEn: "Transportation",
    labelFa: "حمل‌ونقل",
  },
  tv: {
    id: "tv",
    prefix: "tv",
    labelEn: "TV Channels",
    labelFa: "شبکه‌های تلویزیونی",
  },
  university: {
    id: "university",
    prefix: "university",
    labelEn: "Universities",
    labelFa: "دانشگاه‌ها",
  },
  vod: {
    id: "vod",
    prefix: "vod",
    labelEn: "VOD",
    labelFa: "ویدیو و تماشا",
  },
  "website-applications": {
    id: "website-applications",
    prefix: "website",
    labelEn: "Apps & Websites",
    labelFa: "اپ و وب‌سایت",
  },
};

/** Well-known Persian display names (slug without category prefix). */
const NAME_FA = {
  melli: "بانک ملی",
  mellat: "بانک ملت",
  saman: "بانک سامان",
  tejarat: "بانک تجارت",
  maskan: "بانک مسکن",
  sepah: "بانک سپه",
  pasargad: "بانک پاسارگاد",
  saderat: "بانک صادرات",
  parsian: "بانک پارسیان",
  keshavarzi: "بانک کشاورزی",
  digikala: "دیجی‌کالا",
  snap: "اسنپ",
  tapsi: "تپسی",
  aparat: "آپارات",
  irancell: "ایرانسل",
  "hamrah-avval": "همراه‌اول",
  rightel: "رایتل",
  zarinpal: "زرین‌پال",
  zarrinpal: "زرین‌پال",
  shaparak: "شاپرک",
  divar: "دیوار",
  snapp: "اسنپ",
  "snapp-food": "اسنپ‌فود",
  filimo: "فیلیمو",
  namava: "نماوا",
  rubika: "روبیکا",
  eita: "ایتا",
  bale: "بله",
  soroush: "سروش",
  shad: "شاد",
  torob: "ترب",
  sheypoor: "شیپور",
  cafebazaar: "کافه‌بازار",
  bazar: "بازار",
  myket: "مایکت",
  "iran-khodro": "ایران‌خودرو",
  saipa: "سایپا",
  perspolis: "پرسپولیس",
  esteghlal: "استقلال",
};

function kebab(value) {
  return value
    .replace(/\.svg$/i, "")
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function pascal(value) {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join("");
}

function titleFromSlug(slug) {
  const special = { sep: "SEP", "zarrinpal": "ZarinPal", "idpay": "IDPay" };
  if (special[slug]) return special[slug];
  return slug
    .split("-")
    .map((p) => (p.length <= 2 ? p.toUpperCase() : p[0].toUpperCase() + p.slice(1)))
    .join(" ");
}

function nameFaFor(id, slug, nameEn) {
  return nameFaForId(id) ?? NAME_FA[slug] ?? nameEn;
}

async function walkSvgs(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const path = join(directory, entry.name);
      return entry.isDirectory() ? walkSvgs(path) : path;
    }),
  );
  return files.flat().filter((path) => path.endsWith(".svg"));
}

function optimizeSvg(svg, variant) {
  let input = svg;
  if (variant === "mono") {
    input = input.replace(
      /fill=("|')(?!none\1)[^"']+\1/gi,
      'fill="currentColor"',
    );
  }
  return optimize(input, {
    multipass: true,
    plugins: ["preset-default", "removeDimensions"],
  }).data;
}

function parseSvg(svg) {
  const viewBox = svg
    .match(/viewBox=["']([^"']+)["']/i)?.[1]
    ?.trim()
    .split(/[ ,]+/)
    .map(Number);
  if (!viewBox || viewBox.length !== 4 || viewBox.some(Number.isNaN)) {
    throw new Error("SVG is missing a valid viewBox");
  }
  const body = svg
    .replace(/^[\s\S]*?<svg[^>]*>/i, "")
    .replace(/<\/svg>[\s\S]*$/i, "")
    .replace(/<(title|desc)\b[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/\sdata-name=("[^"]*"|'[^']*')/gi, "")
    .replace(/\s+/g, " ")
    .replace(/> </g, "><")
    .trim();
  return {
    viewBox: viewBox.join(" "),
    width: viewBox[2],
    height: viewBox[3],
    body,
  };
}

function serialize(value) {
  return JSON.stringify(value);
}

const files = (await walkSvgs(sourceRoot)).sort();
if (files.length === 0) {
  throw new Error(`No SVGs found under ${sourceRoot}`);
}

unregisterIds((id) =>
  Object.values(CATEGORIES).some((c) => id.startsWith(`${c.prefix}-`)),
);

/** @type {Map<string, { id: string, slug: string, category: string, nameEn: string, nameFa: string, componentName: string, color?: object, mono?: object }>} */
const byId = new Map();

for (const file of files) {
  const parts = relative(sourceRoot, file).split(/[\\/]/);
  const folder = parts[0];
  const variant = parts[1]?.toLowerCase();
  const meta = CATEGORIES[folder];
  if (!meta) throw new Error(`Unknown category folder: ${folder}`);
  if (variant !== "color" && variant !== "mono") {
    throw new Error(`Expected color|mono, got ${variant} in ${file}`);
  }

  const slug = kebab(basename(file));
  const id = `${meta.prefix}-${slug}`;
  let source = await readFile(file, "utf8");

  // Same presentation fix as upstream persianlabs generate script
  if (id === "gateway-sep") {
    source = source
      .replace(/<path\b[\s\S]*?\/>/i, "")
      .replace(/viewBox=("|')0 0 710 356\1/i, 'viewBox="60 60 591 239"');
  }

  const opticalOpts = OPTICAL_OPTIONS[id] ?? OPTICAL_OPTIONS[slug];
  const optimized = normalizeOpticalViewBox(optimizeSvg(source, variant), opticalOpts);
  const icon = parseSvg(optimized);
  let nameEn =
    id === "gateway-sep" ? "SEP" : titleFromSlug(slug);
  if (
    meta.prefix === "bank" &&
    !/^bank\b/i.test(nameEn)
  ) {
    nameEn = `Bank ${nameEn}`;
  }
  const nameFa = nameFaFor(id, slug, nameEn);
  const componentName = claimComponentName(`${pascal(id)}Icon`, id);

  let entry = byId.get(id);
  if (!entry) {
    entry = {
      id,
      slug,
      category: meta.id,
      nameEn,
      nameFa,
      componentName,
    };
    byId.set(id, entry);
  }
  entry[variant] = icon;
}

const icons = [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));
for (const icon of icons) {
  if (!icon.color || !icon.mono) {
    throw new Error(`Missing color/mono for ${icon.id}`);
  }
}

await rm(outRoot, { recursive: true, force: true });
await mkdir(outRoot, { recursive: true });
await mkdir(join(outRoot, "data"), { recursive: true });

// Group data by category for smaller modules / lazy playground loads
/** @type {Map<string, typeof icons>} */
const byCategory = new Map();
for (const icon of icons) {
  if (!byCategory.has(icon.category)) byCategory.set(icon.category, []);
  byCategory.get(icon.category).push(icon);
}

const categoryIds = Object.values(CATEGORIES).map((c) => c.id);

for (const categoryId of categoryIds) {
  const list = byCategory.get(categoryId) ?? [];
  const data = {};
  for (const icon of list) {
    data[icon.id] = {
      color: icon.color,
      mono: icon.mono,
    };
  }
  const file = `// Generated by scripts/generate-persian-labs.mjs — do not edit.\n` +
    `import type { IconVariantData } from "../../../types";\n\n` +
    `export const data: Record<string, IconVariantData> = ${serialize(data)};\n`;
  await writeFile(join(outRoot, "data", `${categoryId}.ts`), file);
}

const loaders = categoryIds
  .map(
    (id) =>
      `  ${serialize(id)}: () => import("./data/${id}"),`,
  )
  .join("\n");

await writeFile(
  join(outRoot, "loaders.ts"),
  `// Generated by scripts/generate-persian-labs.mjs — do not edit.\n` +
    `import type { IconVariantData } from "../../types";\n\n` +
    `export const categoryDataLoaders: Record<\n` +
    `  string,\n` +
    `  () => Promise<{ data: Record<string, IconVariantData> }>\n` +
    `> = {\n${loaders}\n};\n`,
);

const catalogEntries = icons.map((icon) => ({
  id: icon.id,
  nameFa: icon.nameFa,
  nameEn: icon.nameEn,
  componentName: icon.componentName,
  category: icon.category,
  source: "persian-labs",
  sourceUrl: "https://github.com/persianlabs/icons",
  verificationStatus: "verified",
  notes:
    "SVG from persianlabs/icons (MIT). Color and mono variants available.",
  ...brandColorsField(icon.id),
  viewBox: icon.color.viewBox,
  aspectRatio: icon.color.width / icon.color.height,
}));

const categoriesExport = Object.values(CATEGORIES).map((c) => ({
  id: c.id,
  prefix: c.prefix,
  labelEn: c.labelEn,
  labelFa: c.labelFa,
  count: (byCategory.get(c.id) ?? []).length,
}));

await writeFile(
  join(outRoot, "catalog.ts"),
  `// Generated by scripts/generate-persian-labs.mjs — do not edit.\n` +
    `import type { IconCategoryMeta, IconManifestEntry } from "../../types";\n\n` +
    `export const persianLabsCategories: IconCategoryMeta[] = ${serialize(categoriesExport)};\n\n` +
    `export const persianLabsManifest: IconManifestEntry[] = ${serialize(catalogEntries)};\n`,
);

// Eager color+mono data map used by named components (built as separate modules)
const allData = {};
for (const icon of icons) {
  allData[icon.id] = { color: icon.color, mono: icon.mono };
}
await mkdir(join(outRoot, "icons"), { recursive: true });

const categoryExportNames = [];
for (const categoryId of categoryIds) {
  const list = byCategory.get(categoryId) ?? [];
  if (list.length === 0) continue;
  const lines = [
    `// Generated by scripts/generate-persian-labs.mjs — do not edit.`,
    `import { createPersianLabsIcon } from "../../../create-persian-labs-icon";`,
    `import { data } from "../data/${categoryId}";`,
    ``,
  ];
  for (const icon of list) {
    lines.push(
      `export const ${icon.componentName} = createPersianLabsIcon(${serialize(icon.id)}, ${serialize(icon.componentName)}, data[${serialize(icon.id)}]!);`,
    );
    categoryExportNames.push({ categoryId, name: icon.componentName });
  }
  lines.push("");
  await writeFile(join(outRoot, "icons", `${categoryId}.tsx`), lines.join("\n"));
}

const iconBarrel = [
  `// Generated by scripts/generate-persian-labs.mjs — do not edit.`,
  ...categoryIds.map((id) => `export * from "./${id}";`),
  ``,
].join("\n");
await writeFile(join(outRoot, "icons", "index.ts"), iconBarrel);

await writeFile(
  join(outRoot, "index.ts"),
  `// Generated by scripts/generate-persian-labs.mjs — do not edit.\n` +
    `export { persianLabsCategories, persianLabsManifest } from "./catalog";\n` +
    `export { categoryDataLoaders } from "./loaders";\n`,
);

const colorBytes = Buffer.byteLength(serialize(allData));
flushComponentRegistry();
console.log(
  `Generated ${icons.length} icons across ${categoryIds.length} categories`,
);
console.log(`Icon data JSON ~${(colorBytes / 1024 / 1024).toFixed(2)} MB`);
console.log(`Output: ${outRoot}`);
