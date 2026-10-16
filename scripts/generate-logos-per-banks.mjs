/**
 * Reads assets/logos-per-banks-master/{Bank|Gateway}/{Color|Mono}/*.svg
 * (zegond/logos-per-banks, CC0) and emits catalog + modules.
 */
import { mkdir, readdir, readFile, writeFile, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { optimize } from "svgo";
import { normalizeOpticalViewBox } from "./lib/optical-normalize.mjs";
import {
  flushComponentRegistry,claimComponentName,
  preferredIconName,
  pascalSlug,
  unregisterIds,
} from "./lib/component-registry.mjs";


const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = join(root, "assets", "logos-per-banks-master");
const outRoot = join(root, "src", "generated", "logos-per-banks");

const KINDS = {
  Bank: {
    id: "logos-per-banks",
    prefix: "lpb-bank",
    labelEn: "LogoS Banks",
    labelFa: "بانک‌های لوگاس",
  },
  Gateway: {
    id: "logos-per-gateways",
    prefix: "lpb-gateway",
    labelEn: "LogoS Gateways",
    labelFa: "درگاه‌های لوگاس",
  },
};

/** Skip LogoS duplicates when a better copy exists elsewhere (e.g. persian-labs / manual). */
const SKIP_SLUGS = new Set(["iran-venezuela", "zarrinpal"]);

const NAME_FA = {
  ansar: "بانک انصار",
  "bank-markazi": "بانک مرکزی",
  caspian: "بانک کاسپین",
  dey: "بانک دی",
  "eghtesad-novin": "بانک اقتصاد نوین",
  futurebank: "فیوچربانک",
  gardeshgari: "بانک گردشگری",
  ghavamin: "بانک قوامین",
  hekmat: "بانک حکمت",
  "iran-europe": "ایران اروپا",
  karafarin: "بانک کارآفرین",
  keshavarzi: "بانک کشاورزی",
  "khavar-mianeh": "بانک خاورمیانه",
  kosar: "بانک کوثر",
  maskan: "بانک مسکن",
  melall: "بانک ملل",
  mellat: "بانک ملت",
  melli: "بانک ملی",
  noor: "بانک نور",
  parsian: "بانک پارسیان",
  pasargad: "بانک پاسارگاد",
  postbank: "پست‌بانک",
  refah: "بانک رفاه",
  resalat: "بانک رسالت",
  saderat: "بانک صادرات",
  saman: "بانک سامان",
  "sanat-madan": "بانک صنعت و معدن",
  sarmayeh: "بانک سرمایه",
  shahr: "بانک شهر",
  sina: "بانک سینا",
  "standard-chartered": "استاندارد چارترد",
  "taavon-eslami": "بانک تعاون اسلامی",
  tejarat: "بانک تجارت",
  tosee: "بانک توسعه",
  "tosee-saderat": "توسعه صادرات",
  "tosee-taavon": "توسعه تعاون",
  "asan-pardakht": "آسان‌پرداخت",
  digipay: "دیجی‌پی",
  hesabit: "حسابیت",
  idpay: "آیدی‌پی",
  "pay-ir": "پی‌ایر",
  payping: "پی‌پینگ",
  sedad: "سداد",
  shaparak: "شاپرک",
  vandar: "وندار",
};

function kebab(value) {
  return value
    .replace(/\.svg$/i, "")
    .replace(/_/g, "-")
    .replace(/\./g, "-")
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function pascal(value) {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => {
      if (part.toLowerCase() === "ir") return "Ir";
      if (part.toLowerCase() === "id") return "Id";
      return part[0].toUpperCase() + part.slice(1);
    })
    .join("");
}

function titleFromSlug(slug) {
  const special = {
    "pay-ir": "Pay.ir",
    idpay: "IDPay",
    zarrinpal: "ZarinPal",
    "bank-markazi": "Bank Markazi",
  };
  if (special[slug]) return special[slug];
  return slug
    .split("-")
    .map((p) =>
      p.length <= 2 ? p.toUpperCase() : p[0].toUpperCase() + p.slice(1),
    )
    .join(" ");
}

function makeMono(svg) {
  return svg.replace(
    /fill=("|')(?!none\1)[^"']+\1/gi,
    'fill="currentColor"',
  );
}

function optimizeSvg(svg, variant) {
  const input = variant === "mono" ? makeMono(svg) : svg;
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
    .replace(/<\?xml[\s\S]*?\?>/gi, "")
    .replace(/<(title|desc)\b[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\sdata-name=("[^"]*"|'[^']*')/gi, "")
    // Keep gradient/clip ids — stripping them breaks fill="url(#…)".
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

unregisterIds(
  (id) => id.startsWith("lpb-bank-") || id.startsWith("lpb-gateway-"),
);

const icons = [];
/** @type {Map<string, Record<string, any>>} */
const dataByCategory = new Map();

for (const [folder, meta] of Object.entries(KINDS)) {
  const colorDir = join(sourceRoot, folder, "Color");
  const monoDir = join(sourceRoot, folder, "Mono");
  const colorFiles = (await readdir(colorDir))
    .filter((n) => n.toLowerCase().endsWith(".svg"))
    .sort();

  if (!dataByCategory.has(meta.id)) dataByCategory.set(meta.id, {});

  for (const file of colorFiles) {
    const slug = kebab(file);
    if (SKIP_SLUGS.has(slug)) continue;
    const id = `${meta.prefix}-${slug}`;
    const colorSource = await readFile(join(colorDir, file), "utf8");
    let monoSource;
    try {
      monoSource = await readFile(join(monoDir, file), "utf8");
    } catch {
      throw new Error(`Missing mono twin: ${folder}/Mono/${file}`);
    }

    const color = parseSvg(normalizeOpticalViewBox(optimizeSvg(colorSource, "color")));
    const mono = parseSvg(normalizeOpticalViewBox(optimizeSvg(monoSource, "mono")));
    const nameEn =
      folder === "Bank" && !/^bank\b/i.test(titleFromSlug(slug))
        ? `Bank ${titleFromSlug(slug)}`.replace(/^Bank Bank /, "Bank ")
        : titleFromSlug(slug);
    const nameFa = NAME_FA[slug] ?? nameEn;
    // Topical Bank/Gateway prefix OK; never Lpb / source labels.
    let preferred = preferredIconName(slug);
    if (folder === "Bank" && !/^bank/i.test(slug)) {
      preferred = `Bank${pascalSlug(slug)}Icon`;
    } else if (folder === "Gateway" && !/^gateway/i.test(slug)) {
      preferred = `Gateway${pascalSlug(slug)}Icon`;
    }
    const componentName = claimComponentName(preferred, id);

    icons.push({
      id,
      slug,
      category: meta.id,
      nameEn,
      nameFa,
      componentName,
      color,
      mono,
    });
    dataByCategory.get(meta.id)[id] = { color, mono };
  }
}

icons.sort((a, b) => a.id.localeCompare(b.id));

await rm(outRoot, { recursive: true, force: true });
await mkdir(outRoot, { recursive: true });
await mkdir(join(outRoot, "data"), { recursive: true });
await mkdir(join(outRoot, "icons"), { recursive: true });

for (const [categoryId, data] of dataByCategory) {
  await writeFile(
    join(outRoot, "data", `${categoryId}.ts`),
    `// Generated by scripts/generate-logos-per-banks.mjs — do not edit.\n` +
      `import type { IconVariantData } from "../../../types";\n\n` +
      `export const data: Record<string, IconVariantData> = ${serialize(data)};\n`,
  );
}

const categoriesExport = Object.values(KINDS).map((meta) => ({
  id: meta.id,
  prefix: meta.prefix,
  labelEn: meta.labelEn,
  labelFa: meta.labelFa,
  count: icons.filter((i) => i.category === meta.id).length,
}));

const catalogEntries = icons.map((icon) => ({
  id: icon.id,
  nameFa: icon.nameFa,
  nameEn: icon.nameEn,
  componentName: icon.componentName,
  category: icon.category,
  source: "logos-per-banks",
  sourceUrl: "https://github.com/zegond/logos-per-banks",
  verificationStatus: "verified",
  notes:
    "SVG from zegond/logos-per-banks (CC0). Color and mono variants available.",
  viewBox: icon.color.viewBox,
  aspectRatio: icon.color.width / icon.color.height,
}));

await writeFile(
  join(outRoot, "catalog.ts"),
  `// Generated by scripts/generate-logos-per-banks.mjs — do not edit.\n` +
    `import type { IconCategoryMeta, IconManifestEntry } from "../../types";\n\n` +
    `export const logosPerBanksCategories: IconCategoryMeta[] = ${serialize(categoriesExport)};\n\n` +
    `export const logosPerBanksManifest: IconManifestEntry[] = ${serialize(catalogEntries)};\n`,
);

// Named components per category file
for (const meta of Object.values(KINDS)) {
  const list = icons.filter((i) => i.category === meta.id);
  const lines = [
    `// Generated by scripts/generate-logos-per-banks.mjs — do not edit.`,
    `import { createPersianLabsIcon } from "../../../create-persian-labs-icon";`,
    `import { data } from "../data/${meta.id}";`,
    ``,
  ];
  for (const icon of list) {
    lines.push(
      `export const ${icon.componentName} = createPersianLabsIcon(${serialize(icon.id)}, ${serialize(icon.componentName)}, data[${serialize(icon.id)}]!);`,
    );
  }
  lines.push("");
  await writeFile(join(outRoot, "icons", `${meta.id}.tsx`), lines.join("\n"));
}

await writeFile(
  join(outRoot, "icons", "index.ts"),
  `// Generated by scripts/generate-logos-per-banks.mjs — do not edit.\n` +
    Object.values(KINDS)
      .map((m) => `export * from "./${m.id}";`)
      .join("\n") +
    "\n",
);

await writeFile(
  join(outRoot, "index.ts"),
  `// Generated by scripts/generate-logos-per-banks.mjs — do not edit.\n` +
    `export { logosPerBanksCategories, logosPerBanksManifest } from "./catalog";\n`,
);

flushComponentRegistry();
console.log(
  `Generated ${icons.length} logos-per-banks icons across ${categoriesExport.length} categories`,
);
console.log(`Output: ${outRoot}`);
