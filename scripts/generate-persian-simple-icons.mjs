/**
 * Reads assets/persian-simple-icons/*.svg
 * (mojtabaahn/persian-simple-icons, MIT) and emits catalog + optimized modules.
 *
 * Monochrome brand marks; color/mono share the same currentColor glyph.
 */
import { mkdir, readdir, readFile, writeFile, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { optimize } from "svgo";
import { normalizeOpticalViewBox } from "./lib/optical-normalize.mjs";
import {
  flushComponentRegistry,
  claimComponentName,
  preferredIconName,
  unregisterIds,
} from "./lib/component-registry.mjs";
import { brandColorsField } from "./lib/brand-colors.mjs";
import { nameFaForId } from "./lib/name-fa.mjs";


const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = join(root, "assets", "persian-simple-icons");
const outRoot = join(root, "src", "generated", "persian-simple-icons");

const CATEGORY = {
  id: "persian-simple-icons",
  prefix: "psi",
  labelEn: "Persian Simple Icons",
  labelFa: "آیکون‌های ساده فارسی",
};

/** Prefer persian-labs color marks when both packs ship the same brand. */
const SKIP_SLUGS = new Set(["tapsi"]);

const NAME_FA = {
  alibaba: "علی‌بابا",
  aparat: "آپارات",
  arvancloud: "ابر آروان",
  balad: "بلد",
  basalam: "باسلام",
  bookapo: "بوکاپو",
  cafebazar: "کافه‌بازار",
  digiato: "دیجیاتو",
  digikala: "دیجی‌کالا",
  divar: "دیوار",
  filimo: "فیلیمو",
  filmnet: "فیلم‌نت",
  hafthashtad: "۷۸۰",
  jabama: "جاباما",
  jabinja: "جابینجا",
  jajiga: "جاجیگا",
  jobvision: "جاب‌ویژن",
  maxim: "ماکسیم",
  namava: "نماوا",
  navaar: "نوار",
  neshan: "نشان",
  netbarg: "نت‌برگ",
  okala: "اکالا",
  otaghak: "اتاقک",
  sabketo: "سبکتو",
  shenoto: "شنوتو",
  sheypoor: "شیپور",
  snap: "اسنپ",
  takhfifan: "تخفیفان",
  telewebion: "تلوبیون",
  torob: "ترب",
  xaas: "اکساس",
  yektanet: "یکتانت",
  zoomit: "زومیت",
};

function kebab(value) {
  return value
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
  const special = {
    cafebazar: "Cafe Bazaar",
    hafthashtad: "780",
    xaas: "XaaS",
  };
  if (special[slug]) return special[slug];
  return slug
    .split("-")
    .map((p) =>
      p.length <= 2 ? p.toUpperCase() : p[0].toUpperCase() + p.slice(1),
    )
    .join(" ");
}

function optimizeSvg(svg) {
  const withCurrentColor = svg.replace(
    /fill=("|')(?!none\1)[^"']+\1/gi,
    'fill="currentColor"',
  );
  return optimize(withCurrentColor, {
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
  const inner = svg
    .replace(/^[\s\S]*?<svg[^>]*>/i, "")
    .replace(/<\/svg>[\s\S]*$/i, "")
    .replace(/<\?xml[\s\S]*?\?>/gi, "")
    .replace(/<(title|desc)\b[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/\sdata-name=("[^"]*"|'[^']*')/gi, "")
    // Keep gradient/clip ids — stripping them breaks fill="url(#…)".
    .replace(/\s+/g, " ")
    .replace(/> </g, "><")
    .trim();
  const body = `<g fill="currentColor">${inner}</g>`;
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

unregisterIds((id) => id.startsWith("psi-"));

const icons = [];
const data = {};

for (const file of files) {
  const slug = kebab(file);
  if (SKIP_SLUGS.has(slug)) continue;
  const id = `psi-${slug}`;
  const source = await readFile(join(sourceRoot, file), "utf8");
  const optimized = normalizeOpticalViewBox(optimizeSvg(source));
  const glyph = parseSvg(optimized);
  const variants = { color: glyph, mono: glyph };
  const nameEn = titleFromSlug(slug);
  const nameFa = nameFaForId(id) ?? NAME_FA[slug] ?? nameEn;
  const componentName = claimComponentName(preferredIconName(slug), id);

  icons.push({
    id,
    slug,
    category: CATEGORY.id,
    nameEn,
    nameFa,
    componentName,
    viewBox: glyph.viewBox,
    aspectRatio: glyph.width / glyph.height,
  });
  data[id] = variants;
}

icons.sort((a, b) => a.id.localeCompare(b.id));

await rm(outRoot, { recursive: true, force: true });
await mkdir(outRoot, { recursive: true });
await mkdir(join(outRoot, "icons"), { recursive: true });

await writeFile(
  join(outRoot, "data.ts"),
  `// Generated by scripts/generate-persian-simple-icons.mjs — do not edit.\n` +
    `import type { IconVariantData } from "../../types";\n\n` +
    `export const data: Record<string, IconVariantData> = ${serialize(data)};\n`,
);

const catalogEntries = icons.map((icon) => ({
  id: icon.id,
  nameFa: icon.nameFa,
  nameEn: icon.nameEn,
  componentName: icon.componentName,
  category: icon.category,
  source: "persian-simple-icons",
  sourceUrl: "https://github.com/mojtabaahn/persian-simple-icons",
  verificationStatus: "verified",
  notes:
    "SVG from mojtabaahn/persian-simple-icons (MIT). Monochrome mark; color/mono share the same glyph (currentColor).",
  ...brandColorsField(icon.id),
  viewBox: icon.viewBox,
  aspectRatio: icon.aspectRatio,
}));

await writeFile(
  join(outRoot, "catalog.ts"),
  `// Generated by scripts/generate-persian-simple-icons.mjs — do not edit.\n` +
    `import type { IconCategoryMeta, IconManifestEntry } from "../../types";\n\n` +
    `export const persianSimpleIconsCategory: IconCategoryMeta = ${serialize({
      ...CATEGORY,
      count: icons.length,
    })};\n\n` +
    `export const persianSimpleIconsManifest: IconManifestEntry[] = ${serialize(catalogEntries)};\n`,
);

const lines = [
  `// Generated by scripts/generate-persian-simple-icons.mjs — do not edit.`,
  `import { createPersianLabsIcon } from "../../../create-persian-labs-icon";`,
  `import { data } from "../data";`,
  ``,
];
for (const icon of icons) {
  lines.push(
    `export const ${icon.componentName} = createPersianLabsIcon(${serialize(icon.id)}, ${serialize(icon.componentName)}, data[${serialize(icon.id)}]!);`,
  );
}
lines.push("");
await writeFile(join(outRoot, "icons", "index.tsx"), lines.join("\n"));

await writeFile(
  join(outRoot, "index.ts"),
  `// Generated by scripts/generate-persian-simple-icons.mjs — do not edit.\n` +
    `export { persianSimpleIconsCategory, persianSimpleIconsManifest } from "./catalog";\n` +
    `export { data as persianSimpleIconsData } from "./data";\n`,
);

const bytes = Buffer.byteLength(serialize(data));
flushComponentRegistry();
console.log(`Generated ${icons.length} persian-simple-icons`);
console.log(`Icon data JSON ~${(bytes / 1024).toFixed(1)} KB`);
console.log(`Output: ${outRoot}`);
