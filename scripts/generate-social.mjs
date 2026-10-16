/**
 * Reads assets/social/*.svg (curated from gauravghongde/social-icons Color set)
 * and emits catalog + color/mono SVG data for the package.
 */
import { mkdir, readdir, readFile, writeFile, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { optimize } from "svgo";
import { brandColorsField } from "./lib/brand-colors.mjs";
import {
  flushComponentRegistry,claimComponentName,
  preferredIconName,
  unregisterIds,
} from "./lib/component-registry.mjs";


const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = join(root, "assets", "social");
const outRoot = join(root, "src", "generated", "social");

const CATEGORY = {
  id: "social",
  prefix: "social",
  labelEn: "Social Brands",
  labelFa: "شبکه‌های اجتماعی",
};

const NAME_FA = {
  instagram: "اینستاگرام",
  whatsapp: "واتساپ",
  facebook: "فیسبوک",
  linkedin: "لینکدین",
  messenger: "مسنجر",
  youtube: "یوتیوب",
  tiktok: "تیک‌تاک",
  telegram: "تلگرام",
  pinterest: "پینترست",
  snapchat: "اسنپ‌چت",
  skype: "اسکایپ",
  viber: "وایبر",
  gmail: "جیمیل",
  google: "گوگل",
  "google-play": "گوگل‌پلی",
  discord: "دیسکورد",
  reddit: "ردیت",
  spotify: "اسپاتیفای",
  twitch: "توییچ",
  medium: "مدیوم",
  behance: "بیهنس",
  dribbble: "دریبل",
  tumblr: "تامبلر",
  quora: "کورا",
  patreon: "پتریان",
  rss: "آر‌اس‌اس",
  slack: "اسلک",
  github: "گیت‌هاب",
  flickr: "فلیکر",
  "product-hunt": "پروداکت‌هانت",
  twitter: "توییتر",
};

const NAME_EN = {
  instagram: "Instagram",
  whatsapp: "WhatsApp",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  messenger: "Messenger",
  youtube: "YouTube",
  tiktok: "TikTok",
  telegram: "Telegram",
  pinterest: "Pinterest",
  snapchat: "Snapchat",
  skype: "Skype",
  viber: "Viber",
  gmail: "Gmail",
  google: "Google",
  "google-play": "Google Play",
  discord: "Discord",
  reddit: "Reddit",
  spotify: "Spotify",
  twitch: "Twitch",
  medium: "Medium",
  behance: "Behance",
  dribbble: "Dribbble",
  tumblr: "Tumblr",
  quora: "Quora",
  patreon: "Patreon",
  rss: "RSS",
  slack: "Slack",
  github: "GitHub",
  flickr: "Flickr",
  "product-hunt": "Product Hunt",
  twitter: "Twitter",
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

function uniquifyIds(svg, prefix) {
  const ids = [...svg.matchAll(/\bid=["']([^"']+)["']/gi)].map((m) => m[1]);
  let out = svg;
  for (const id of ids) {
    const next = `${prefix}-${id}`.replace(/[^a-zA-Z0-9_-]/g, "-");
    const esc = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    out = out
      .replace(new RegExp(`id=(["'])${esc}\\1`, "g"), `id="${next}"`)
      .replace(new RegExp(`url\\(#${esc}\\)`, "g"), `url(#${next})`)
      .replace(new RegExp(`url\\((["'])#${esc}\\1\\)`, "g"), `url(#${next})`);
  }
  return out;
}

function makeMono(svg) {
  return svg
    .replace(/fill=(["'])url\([^"']+\)\1/gi, 'fill="currentColor"')
    .replace(/stroke=(["'])url\([^"']+\)\1/gi, 'stroke="currentColor"')
    .replace(/fill=(["'])(?!none\1|currentColor\1)[^"']+\1/gi, 'fill="currentColor"')
    .replace(
      /stroke=(["'])(?!none\1|currentColor\1)[^"']+\1/gi,
      'stroke="currentColor"',
    )
    .replace(/stop-color=(["'])[^"']+\1/gi, 'stop-color="currentColor"')
    .replace(/style=(["'])([^"']*)\1/gi, (_, q, style) => {
      const next = style
        .replace(/fill\s*:\s*(?!none\b|currentColor\b)[^;]+/gi, "fill:currentColor")
        .replace(
          /stroke\s*:\s*(?!none\b|currentColor\b)[^;]+/gi,
          "stroke:currentColor",
        )
        .replace(/stop-color\s*:\s*[^;]+/gi, "stop-color:currentColor");
      return `style=${q}${next}${q}`;
    });
}

function optimizeSvg(svg, variant, idPrefix) {
  const input = variant === "mono" ? makeMono(svg) : svg;
  return optimize(input, {
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

const files = (await readdir(sourceRoot))
  .filter((name) => name.toLowerCase().endsWith(".svg"))
  .sort();

if (files.length === 0) {
  throw new Error(`No SVGs found under ${sourceRoot}`);
}

unregisterIds((id) => id.startsWith("social-"));

const icons = [];
const data = {};
const skipped = [];

for (const file of files) {
  const slug = kebab(file);
  const id = `social-${slug}`;
  try {
    const source = await readFile(join(sourceRoot, file), "utf8");
    const prefixed = uniquifyIds(source, id);
    const color = parseSvg(optimizeSvg(prefixed, "color", id));
    const mono = parseSvg(optimizeSvg(prefixed, "mono", `${id}-mono`));
    const nameEn = NAME_EN[slug] ?? pascal(slug);
    const nameFa = NAME_FA[slug] ?? nameEn;
    const componentName = claimComponentName(preferredIconName(slug), id);

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
  } catch (err) {
    skipped.push(`${file}: ${err instanceof Error ? err.message : err}`);
  }
}

icons.sort((a, b) => a.id.localeCompare(b.id));

await rm(outRoot, { recursive: true, force: true });
await mkdir(outRoot, { recursive: true });
await mkdir(join(outRoot, "icons"), { recursive: true });

await writeFile(
  join(outRoot, "data.ts"),
  `// Generated by scripts/generate-social.mjs — do not edit.\n` +
    `import type { IconVariantData } from "../../types";\n\n` +
    `export const data: Record<string, IconVariantData> = ${serialize(data)};\n`,
);

const catalogEntries = icons.map((icon) => ({
  id: icon.id,
  nameFa: icon.nameFa,
  nameEn: icon.nameEn,
  componentName: icon.componentName,
  category: icon.category,
  source: "social",
  sourceUrl: "https://github.com/gauravghongde/social-icons",
  verificationStatus: "needs-official-svg",
  notes:
    "Curated Color SVG from gauravghongde/social-icons. Color keeps badge artwork; mono uses currentColor.",
  ...brandColorsField(icon.id),
  viewBox: icon.viewBox,
  aspectRatio: icon.aspectRatio,
}));

await writeFile(
  join(outRoot, "catalog.ts"),
  `// Generated by scripts/generate-social.mjs — do not edit.\n` +
    `import type { IconCategoryMeta, IconManifestEntry } from "../../types";\n\n` +
    `export const socialCategory: IconCategoryMeta = ${serialize({
      ...CATEGORY,
      count: icons.length,
    })};\n\n` +
    `export const socialManifest: IconManifestEntry[] = ${serialize(catalogEntries)};\n`,
);

const lines = [
  `// Generated by scripts/generate-social.mjs — do not edit.`,
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
  `// Generated by scripts/generate-social.mjs — do not edit.\n` +
    `export { socialCategory, socialManifest } from "./catalog";\n` +
    `export { data as socialIconData } from "./data";\n`,
);

flushComponentRegistry();
console.log(`Generated ${icons.length} social icons`);
if (skipped.length) {
  console.log(`Skipped ${skipped.length}:`);
  for (const s of skipped) console.log(`  - ${s}`);
}
console.log(`Output: ${outRoot}`);
