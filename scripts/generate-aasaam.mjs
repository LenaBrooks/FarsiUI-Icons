/**
 * Reads assets/aasaam/ir_*.svg (aasaam/brand-icons, CC0)
 * and emits catalog + optimized SVG data for the package.
 *
 * Marks are monochrome 24×24. Mono always uses currentColor.
 * Color uses a brand fill when listed in BRAND_COLORS, otherwise
 * the same currentColor glyph as mono.
 */
import { mkdir, readdir, readFile, writeFile, rm } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { optimize } from "svgo";
import { normalizeOpticalViewBox } from "./lib/optical-normalize.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = join(root, "assets", "aasaam");
const outRoot = join(root, "src", "generated", "aasaam");

const CATEGORY = {
  id: "aasaam",
  prefix: "aasaam",
  labelEn: "Aasaam Brands",
  labelFa: "آیکون‌های آسام",
};

/**
 * Official brand fills for color variant (Simple Icons–style solid mark).
 * Checkmark cutouts stay transparent so the host background shows through.
 */
const BRAND_COLORS = {
  // Catalog order — solid Simple Icons–style fills (skip = no reliable logo color)
  "40tikke": "#E85D04", // logo URL unreliable; warm craft accent from legacy mark refs
  "55online": "#485CC7", // 55online.ir SVG fill (+ favicon ≈ #4455CC)
  "7sobh": "#065D91", // 7sobh.com theme-color (favicon blue-dominant)
  // 9sobh — not found
  aasaam: "#070707", // aasaam.com theme-color / tile
  // abidi — no direct logo path
  afkarnews: "#880000", // afkarnews.com/images/aasaam.png dominant
  // afta, amar, ansar — not found
  aparat: "#ED145B", // aparat.com/logo — Simple Icons / brand palette
  armanmeli: "#00A651", // armanmeli.ir favicon green (≈ #00AA55)
  // arshehonline, artdayme — not found
  arvancloud: "#00BABA", // Brandfetch / arvancloud favicon teal
  asanpardakht: "#F04923", // asanpardakht Logofooter.svg .st0
  asiatech: "#009FE3", // rangebrand.ir primary blue (logo URL 404)

  bale: "#00B894",
  behran: "#ED1C24", // نفت بهران — wordmark red
  eitaa: "#FF7534", // ایتا — official brand orange (eitaa.com/page/badge)
  esteghlalfc: "#0067AD", // استقلال — primary blue from official mark / user logo
};

/** Map well-known slugs to nicer FA names. */
const NAME_FA = {
  digikala: "دیجی‌کالا",
  aparat: "آپارات",
  snapp: "اسنپ",
  tapsi: "تپسی",
  divar: "دیوار",
  cafebazaar: "کافه‌بازار",
  zarinpal: "زرین‌پال",
  "40tikke": "چهل‌تیکه",
  "55online": "۵۵ آنلاین",
  "7sobh": "هفت صبح",
  asanpardakht: "آسان‌پرداخت",
  behran: "بهران",
  melli: "بانک ملی",
  mellat: "بانک ملت",
  saman: "بانک سامان",
  tejarat: "بانک تجارت",
  irancell: "ایرانسل",
  hamraheaval: "همراه‌اول",
  rightel: "رایتل",
  bale: "بله",
  eitaa: "ایتا",
  esteghlalfc: "استقلال",
  rubika: "روبیکا",
  soroush: "سروش",
  shad: "شاد",
  filimo: "فیلیمو",
  namava: "نماوا",
  torob: "ترب",
  sheypoor: "شیپور",
  enamad: "اینماد",
  shaparak: "شاپرک",
  asiatech: "آسیاتک",
  arvancloud: "ابر آروان",
  zoomit: "زومیت",
  varzesh3: "ورزش ۳",
  aasaam: "آسام",
};

function kebab(value) {
  return value
    .replace(/^ir_/i, "")
    .replace(/\.svg$/i, "")
    .replace(/_/g, "-")
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
  return slug
    .split("-")
    .map((p) =>
      p.length <= 2 ? p.toUpperCase() : p[0].toUpperCase() + p.slice(1),
    )
    .join(" ");
}

function optimizeSvg(svg) {
  return optimize(svg, {
    multipass: true,
    plugins: ["preset-default", "removeDimensions"],
  }).data;
}

/** Stamp an explicit fill onto every paintable shape (not just parent <g>). */
function applyShapeFill(inner, fill) {
  return inner
    .replace(/\sfill="[^"]*"/gi, "")
    .replace(
      /<(path|circle|rect|polygon|ellipse|polyline)\b/gi,
      `<$1 fill="${fill}"`,
    );
}

function parseSvg(svg, fill = "currentColor") {
  const viewBox = svg
    .match(/viewBox=["']([^"']+)["']/i)?.[1]
    ?.trim()
    .split(/[ ,]+/)
    .map(Number);
  if (!viewBox || viewBox.length !== 4 || viewBox.some(Number.isNaN)) {
    throw new Error("SVG is missing a valid viewBox");
  }
  let inner = svg
    .replace(/^[\s\S]*?<svg[^>]*>/i, "")
    .replace(/<\/svg>[\s\S]*$/i, "")
    .replace(/<(title|desc)\b[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/\sdata-name=("[^"]*"|'[^']*')/gi, "")
    .replace(/\s+/g, " ")
    .replace(/> </g, "><")
    .trim();
  inner = applyShapeFill(inner, fill);
  const body = `<g>${inner}</g>`;
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

const files = (await readdir(sourceRoot))
  .filter((name) => name.toLowerCase().endsWith(".svg"))
  .sort();

if (files.length === 0) {
  throw new Error(`No SVGs found under ${sourceRoot}`);
}

const icons = [];
const data = {};

for (const file of files) {
  const slug = kebab(file);
  const id = `aasaam-${slug}`;
  const source = await readFile(join(sourceRoot, file), "utf8");
  const optimized = normalizeOpticalViewBox(optimizeSvg(source));
  const brandFill = BRAND_COLORS[slug];
  const mono = parseSvg(optimized);
  const color = brandFill ? parseSvg(optimized, brandFill) : mono;
  const variants = { color, mono };
  const nameEn = titleFromSlug(slug);
  const nameFa = NAME_FA[slug] ?? nameEn;
  const componentName = `Aasaam${pascal(slug)}Icon`;

  icons.push({
    id,
    slug,
    category: CATEGORY.id,
    nameEn,
    nameFa,
    componentName,
    viewBox: mono.viewBox,
    aspectRatio: mono.width / mono.height,
    brandFill: brandFill ?? null,
  });
  data[id] = variants;
}

icons.sort((a, b) => a.id.localeCompare(b.id));

await rm(outRoot, { recursive: true, force: true });
await mkdir(outRoot, { recursive: true });
await mkdir(join(outRoot, "icons"), { recursive: true });

await writeFile(
  join(outRoot, "data.ts"),
  `// Generated by scripts/generate-aasaam.mjs — do not edit.\n` +
    `import type { IconVariantData } from "../../types";\n\n` +
    `export const data: Record<string, IconVariantData> = ${serialize(data)};\n`,
);

const catalogEntries = icons.map((icon) => ({
  id: icon.id,
  nameFa: icon.nameFa,
  nameEn: icon.nameEn,
  componentName: icon.componentName,
  category: icon.category,
  source: "aasaam",
  sourceUrl: "https://github.com/aasaam/brand-icons",
  verificationStatus: "verified",
  notes: icon.brandFill
    ? `SVG from aasaam/brand-icons (CC0). Color uses brand fill ${icon.brandFill}; mono uses currentColor.`
    : "SVG from aasaam/brand-icons (CC0). Monochrome mark; color/mono variants share the same glyph (currentColor).",
  viewBox: icon.viewBox,
  aspectRatio: icon.aspectRatio,
}));

await writeFile(
  join(outRoot, "catalog.ts"),
  `// Generated by scripts/generate-aasaam.mjs — do not edit.\n` +
    `import type { IconCategoryMeta, IconManifestEntry } from "../../types";\n\n` +
    `export const aasaamCategory: IconCategoryMeta = ${serialize({
      ...CATEGORY,
      count: icons.length,
    })};\n\n` +
    `export const aasaamManifest: IconManifestEntry[] = ${serialize(catalogEntries)};\n`,
);

// Split named components into chunks to keep files manageable
const CHUNK = 80;
const chunkNames = [];
for (let i = 0; i < icons.length; i += CHUNK) {
  const slice = icons.slice(i, i + CHUNK);
  const chunkIndex = Math.floor(i / CHUNK);
  const chunkFile = `chunk-${chunkIndex}.tsx`;
  chunkNames.push(chunkFile.replace(/\.tsx$/, ""));
  const lines = [
    `// Generated by scripts/generate-aasaam.mjs — do not edit.`,
    `import { createPersianLabsIcon } from "../../../create-persian-labs-icon";`,
    `import { data } from "../data";`,
    ``,
  ];
  for (const icon of slice) {
    lines.push(
      `export const ${icon.componentName} = createPersianLabsIcon(${serialize(icon.id)}, ${serialize(icon.componentName)}, data[${serialize(icon.id)}]!);`,
    );
  }
  lines.push("");
  await writeFile(join(outRoot, "icons", chunkFile), lines.join("\n"));
}

await writeFile(
  join(outRoot, "icons", "index.ts"),
  `// Generated by scripts/generate-aasaam.mjs — do not edit.\n` +
    chunkNames.map((name) => `export * from "./${name}";`).join("\n") +
    "\n",
);

await writeFile(
  join(outRoot, "index.ts"),
  `// Generated by scripts/generate-aasaam.mjs — do not edit.\n` +
    `export { aasaamCategory, aasaamManifest } from "./catalog";\n` +
    `export { data as aasaamIconData } from "./data";\n`,
);

const bytes = Buffer.byteLength(serialize(data));
console.log(`Generated ${icons.length} aasaam icons`);
console.log(`Icon data JSON ~${(bytes / 1024 / 1024).toFixed(2)} MB`);
console.log(`Output: ${outRoot}`);
