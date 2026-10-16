/**
 * Reads assets/manual/*.svg (one-off / user-provided logos)
 * and emits catalog + icon modules.
 *
 * Supports path SVGs and PNG-embedded SVGs. Color/mono share the same glyph
 * when the artwork cannot be recolored (e.g. raster embeds).
 */
import { mkdir, readdir, readFile, writeFile, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { optimize } from "svgo";
import {
  flushComponentRegistry,
  claimComponentName,
  preferredIconName,
  unregisterIds,
} from "./lib/component-registry.mjs";
import { brandColorsFor } from "./lib/brand-colors.mjs";


const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = join(root, "assets", "manual");
const outRoot = join(root, "src", "generated", "manual");

const CATEGORY = {
  id: "manual",
  prefix: "manual",
  labelEn: "Manual Logos",
  labelFa: "لوگوهای دستی",
};

const NAME_FA = {
  shenakhti: "مرکز شناختی علم و صنعت",
  vibefarsi: "وایب فارسی",
  "banana-ai": "Banana AI",
  farsiui: "فارسی‌یوآی",
  pixevel: "پیکسیول",
  easycandle: "ایزی‌کندل",
  gapgpt: "گپ‌جی‌پی‌تی",
  claude: "کلود",
  vercel: "ورسل",
  netlify: "نتلی‌فای",
  zarinpal: "زرین‌پال",
  alamto: "عالم‌تو",
};

const NAME_EN = {
  shenakhti: "Cognitive Science & Industry Center",
  vibefarsi: "Vibefarsi",
  "banana-ai": "Banana AI",
  farsiui: "FarsiUI",
  pixevel: "Pixevel",
  easycandle: "EasyCandle",
  gapgpt: "GapGPT",
  claude: "Claude",
  vercel: "Vercel",
  netlify: "Netlify",
  zarinpal: "Zarinpal",
  alamto: "Alamto",
};

const COMPONENT = {
  farsiui: "FarsiUIIcon",
  "banana-ai": "BananaAIIcon",
  gapgpt: "GapGPTIcon",
  claude: "ClaudeIcon",
  vercel: "VercelIcon",
  netlify: "NetlifyIcon",
  zarinpal: "ZarinpalIcon",
  alamto: "AlamtoIcon",
};

const SOURCE_URL = {
  easycandle: "https://easycandle.app/easycandle-icon.svg",
  gapgpt: "https://gapgpt.app/model_icons/gapgpt-icon-v3.png",
  claude:
    "https://commons.wikimedia.org/wiki/File:Claude_AI_symbol.svg",
  vercel: "https://www.svgrepo.com/show/354513/vercel-icon.svg",
  netlify: "https://www.svgrepo.com/show/354110/netlify.svg",
  zarinpal: "https://connect.zarinpal.com/media_files/img/ZarinPal-Logo.svg",
  alamto: "https://www.alamto.com/wp-content/uploads/2013/02/favicon.ico",
};

/** Brand palette samples shown in playground drawer. */
const BRAND_COLORS = {
  easycandle: ["#0B2A4A", "#FFC400", "#FF7A00"],
  vibefarsi: ["#E39A8E", "#cf5c49"],
  pixevel: ["#111111", "#FCFCFA", "#F8A8B8"],
  farsiui: ["#2E2E2E", "#FFFFFF"],
  "banana-ai": ["#000000", "#FE8301"],
  shenakhti: ["#009FE3"],
  claude: ["#D97757"],
  vercel: ["#000000"],
  netlify: ["#00C7B7"],
  zarinpal: ["#FFD60A", "#0A33FF"],
  alamto: ["#FFC10A", "#FD5722"],
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
  return (
    NAME_EN[slug] ??
    slug
      .split("-")
      .map((p) =>
        p.length <= 2 ? p.toUpperCase() : p[0].toUpperCase() + p.slice(1),
      )
      .join(" ")
  );
}

function hasRasterEmbed(svg) {
  return /<image\b/i.test(svg) || /data:image\//i.test(svg);
}

/**
 * Build a mono glyph that follows CSS `color` / currentColor.
 * Vectors: rewrite fills/strokes. Rasters: luminance/alpha mask + rect.
 * @param {{ viewBox: string, width: number, height: number, body: string }} glyph
 * @param {string} idPrefix
 * @param {boolean} raster
 */
function toMonoGlyph(glyph, idPrefix, raster) {
  if (!raster) {
    let body = glyph.body
      .replace(/\sfill=(")(?!none\1)[^"]*\1/gi, ' fill="currentColor"')
      .replace(/\sfill=(')(?!none\1)[^']*\1/gi, " fill='currentColor'")
      .replace(/\sstroke=(")(?!none\1)[^"]*\1/gi, ' stroke="currentColor"')
      .replace(/\sstroke=(')(?!none\1)[^']*\1/gi, " stroke='currentColor'")
      .replace(/\sstop-color=("[^"]*"|'[^']*')/gi, ' stop-color="currentColor"');
    // SVGO often drops fill="#000" (SVG default). Without an explicit fill,
    // mono stays black and ignores CSS `color` — force currentColor.
    body = body.replace(
      /<(path|circle|rect|polygon|ellipse|polyline)\b([^>]*?)(\/?)\s*>/gi,
      (full, tag, attrs, selfClose) => {
        if (/\bfill\s*=/i.test(attrs)) return full;
        if (/\bstroke\s*=/i.test(attrs)) {
          return `<${tag}${attrs} fill="none"${selfClose}>`;
        }
        return `<${tag}${attrs} fill="currentColor"${selfClose}>`;
      },
    );
    return { ...glyph, body };
  }

  const image = glyph.body.match(/<image\b[^>]*\/?>/i)?.[0];
  if (!image) return glyph;

  const [vx, vy, vw, vh] = glyph.viewBox.split(/[\s,]+/).map(Number);
  const maskId = `${idPrefix}-mono-mask`;
  const body =
    `<defs><mask id="${maskId}" maskUnits="userSpaceOnUse" ` +
    `x="${vx}" y="${vy}" width="${vw}" height="${vh}">${image}</mask></defs>` +
    `<rect x="${vx}" y="${vy}" width="${vw}" height="${vh}" ` +
    `fill="currentColor" mask="url(#${maskId})"/>`;
  return { ...glyph, body };
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
  let body = svg
    .replace(/^[\s\S]*?<svg[^>]*>/i, "")
    .replace(/<\/svg>[\s\S]*$/i, "")
    .replace(/<\?xml[\s\S]*?\?>/gi, "")
    .replace(/<(title|desc)\b[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\s+/g, " ")
    .replace(/> </g, "><")
    .trim();
  // Root svg fill="none" is dropped when we extract inner markup; without it,
  // stroke-only shapes get the SVG default fill (black). Restore via wrapper.
  const rootFillNone = /<svg\b[^>]*\bfill=["']none["']/i.test(svg);
  if (rootFillNone && body && !/^<g\b[^>]*\bfill=["']none["']/i.test(body)) {
    body = `<g fill="none">${body}</g>`;
  }
  return {
    viewBox: viewBox.join(" "),
    width: viewBox[2],
    height: viewBox[3],
    body,
  };
}

function prepareSvg(source, idPrefix) {
  if (hasRasterEmbed(source)) {
    // Keep pixels exact — no SVGO / optical crop.
    return source;
  }
  // Manual marks keep author viewBox — optical crop was boxing vibefarsi.
  // prefixIds keeps gradients unique when many icons share one HTML document.
  return optimize(source, {
    multipass: true,
    plugins: [
      "preset-default",
      "removeDimensions",
      {
        name: "prefixIds",
        params: { prefix: idPrefix, delim: "-" },
      },
    ],
  }).data;
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

// Manual ids are bare slugs (zarinpal, gapgpt, …) — clear those claims on re-run.
unregisterIds((id) => files.some((f) => kebab(f) === id));

for (const file of files) {
  const slug = kebab(file);
  const id = slug;
  const source = await readFile(join(sourceRoot, file), "utf8");
  const prepared = prepareSvg(source, id);
  const raster = hasRasterEmbed(prepared);
  const color = parseSvg(prepared);
  const mono = toMonoGlyph(color, id, raster);
  const nameEn = titleFromSlug(slug);
  const nameFa = NAME_FA[slug] ?? nameEn;
  const preferred = COMPONENT[slug] ?? preferredIconName(slug);
  const componentName = claimComponentName(preferred, id);

  icons.push({
    id,
    slug,
    category: CATEGORY.id,
    nameEn,
    nameFa,
    componentName,
    viewBox: color.viewBox,
    aspectRatio: color.width / color.height,
  });
  data[id] = { color, mono };
}

icons.sort((a, b) => a.id.localeCompare(b.id));

await rm(outRoot, { recursive: true, force: true });
await mkdir(outRoot, { recursive: true });
await mkdir(join(outRoot, "icons"), { recursive: true });

await writeFile(
  join(outRoot, "data.ts"),
  `// Generated by scripts/generate-manual.mjs — do not edit.\n` +
    `import type { IconVariantData } from "../../types";\n\n` +
    `export const data: Record<string, IconVariantData> = ${serialize(data)};\n`,
);

const catalogEntries = icons.map((icon) => ({
  id: icon.id,
  nameFa: icon.nameFa,
  nameEn: icon.nameEn,
  componentName: icon.componentName,
  category: icon.category,
  source: "manual",
  sourceUrl: SOURCE_URL[icon.slug] ?? "",
  verificationStatus: "needs-official-svg",
  notes: "User-provided logo under assets/manual (may include raster embed).",
  ...(() => {
    const colors = brandColorsFor(icon.id) ?? BRAND_COLORS[icon.slug];
    return colors ? { brandColors: colors } : {};
  })(),
  viewBox: icon.viewBox,
  aspectRatio: icon.aspectRatio,
}));

await writeFile(
  join(outRoot, "catalog.ts"),
  `// Generated by scripts/generate-manual.mjs — do not edit.\n` +
    `import type { IconCategoryMeta, IconManifestEntry } from "../../types";\n\n` +
    `export const manualCategory: IconCategoryMeta = ${serialize({
      ...CATEGORY,
      count: icons.length,
    })};\n\n` +
    `export const manualManifest: IconManifestEntry[] = ${serialize(catalogEntries)};\n`,
);

const lines = [
  `// Generated by scripts/generate-manual.mjs — do not edit.`,
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
  `// Generated by scripts/generate-manual.mjs — do not edit.\n` +
    `export { manualCategory, manualManifest } from "./catalog";\n` +
    `export { data as manualIconData } from "./data";\n`,
);

flushComponentRegistry();
console.log(`Generated ${icons.length} manual icons`);
console.log(`Output: ${outRoot}`);
