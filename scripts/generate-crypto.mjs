/**
 * Reads assets/crypto/*.svg from react-crypto-icons (MIT)
 * https://github.com/rileystephens28/react-crypto-icons
 * and emits catalog + color/mono SVG data for the package.
 */
import { mkdir, readdir, readFile, writeFile, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { optimize } from "svgo";
import { normalizeOpticalViewBox } from "./lib/optical-normalize.mjs";
import {
  flushComponentRegistry,claimComponentName,
  pascalSlug,
  unregisterIds,
} from "./lib/component-registry.mjs";


const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = join(root, "assets", "crypto");
const outRoot = join(root, "src", "generated", "crypto");

const CATEGORY = {
  id: "crypto",
  prefix: "crypto",
  labelEn: "Cryptocurrency",
  labelFa: "رمزارز",
};

/** Well-known tickers → nicer FA / EN labels. */
const NAME_FA = {
  btc: "بیت‌کوین",
  eth: "اتریوم",
  usdt: "تتر",
  usdc: "یواس‌دی‌کوین",
  bnb: "بایننس‌کوین",
  xrp: "ریپل",
  ada: "کاردانو",
  doge: "دوج‌کوین",
  sol: "سولانا",
  dot: "پولکادات",
  matic: "پالیگان",
  polygon: "پالیگان",
  shib: "شیبا",
  trx: "ترون",
  ltc: "لایت‌کوین",
  link: "چین‌لینک",
  avax: "آوالانچ",
  atom: "کازموس",
  uni: "یونی‌سواپ",
  near: "نیر",
  apt: "آپتوس",
  arb: "آربیتراوم",
  op: "آپتیمیسم",
  ton: "تون",
  pepe: "پپه",
  sui: "سویی",
  qnt: "کوانت",
  stx: "استکس",
  ar: "آرویو",
  aave: "آوه",
  mkr: "میکر",
  dai: "دای",
  busd: "بایننس یو‌اس‌دی",
  cake: "پنکیک‌سواپ",
  sushi: "سوشی‌سواپ",
};

const NAME_EN = {
  btc: "Bitcoin",
  eth: "Ethereum",
  usdt: "Tether",
  usdc: "USD Coin",
  bnb: "BNB",
  xrp: "XRP",
  ada: "Cardano",
  doge: "Dogecoin",
  sol: "Solana",
  dot: "Polkadot",
  matic: "Polygon",
  shib: "Shiba Inu",
  trx: "TRON",
  ltc: "Litecoin",
  link: "Chainlink",
  avax: "Avalanche",
  atom: "Cosmos",
  uni: "Uniswap",
  near: "NEAR",
  dai: "Dai",
  ton: "TON",
  pepe: "Pepe",
  sui: "Sui",
  arb: "Arbitrum",
  op: "Optimism",
  apt: "Aptos",
  qnt: "Quant",
  stx: "Stacks",
  ar: "Arweave",
};

function kebab(value) {
  return value
    .replace(/\.svg$/i, "")
    .replace(/\+/g, "-plus")
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
    .map((part) => {
      // Keep short all-caps tickers readable: btc -> Btc, usdt -> Usdt
      return part[0].toUpperCase() + part.slice(1);
    })
    .join("");
}

/** Valid JS identifier component name (slugs may start with a digit). */
function preferredFromSlug(slug) {
  let body = pascalSlug(slug);
  if (!/^[A-Za-z_]/.test(body)) body = `N${body}`;
  return `${body}Icon`;
}

function titleFromSlug(slug) {
  return (
    NAME_EN[slug] ??
    slug
      .split("-")
      .map((p) => p.toUpperCase())
      .join(" ")
  );
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
        .replace(
          /stop-color\s*:\s*[^;]+/gi,
          "stop-color:currentColor",
        );
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

const files = (await readdir(sourceRoot))
  .filter((name) => name.toLowerCase().endsWith(".svg"))
  .sort();

if (files.length === 0) {
  throw new Error(`No SVGs found under ${sourceRoot}`);
}

unregisterIds((id) => id.startsWith("crypto-"));

const icons = [];
const data = {};
const skipped = [];
const usedIds = new Set();

for (const file of files) {
  let slug = kebab(file);
  let id = `crypto-${slug}`;
  let n = 2;
  while (usedIds.has(id)) {
    slug = `${kebab(file)}-${n}`;
    id = `crypto-${slug}`;
    n += 1;
  }
  // Reserve before expensive work so the same id cannot be emitted twice.
  usedIds.add(id);
  try {
    const source = await readFile(join(sourceRoot, file), "utf8");
    const prefixed = uniquifyIds(source, id);
    const color = parseSvg(
      normalizeOpticalViewBox(optimizeSvg(prefixed, "color", id), {
        maxZoom: 1,
      }),
    );
    const mono = parseSvg(
      normalizeOpticalViewBox(optimizeSvg(prefixed, "mono", id), {
        maxZoom: 1,
      }),
    );

    const baseName = kebab(file);
    const nameEn = titleFromSlug(baseName);
    const nameFa = NAME_FA[baseName] ?? nameEn;
    const componentName = claimComponentName(preferredFromSlug(slug), id);
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
    usedIds.delete(id);
    skipped.push(`${file}: ${err instanceof Error ? err.message : err}`);
  }
}

icons.sort((a, b) => a.id.localeCompare(b.id));

// Safety net: drop any accidental id/component duplicates.
{
  const seenId = new Set();
  const seenComp = new Set();
  const unique = [];
  for (const icon of icons) {
    if (seenId.has(icon.id) || seenComp.has(icon.componentName)) continue;
    seenId.add(icon.id);
    seenComp.add(icon.componentName);
    unique.push(icon);
  }
  if (unique.length !== icons.length) {
    console.warn(
      `Deduped crypto icons: ${icons.length} → ${unique.length}`,
    );
    icons.length = 0;
    icons.push(...unique);
  }
}

await rm(outRoot, { recursive: true, force: true });
await mkdir(outRoot, { recursive: true });
await mkdir(join(outRoot, "icons"), { recursive: true });

await writeFile(
  join(outRoot, "data.ts"),
  `// Generated by scripts/generate-crypto.mjs — do not edit.\n` +
    `import type { IconVariantData } from "../../types";\n\n` +
    `export const data: Record<string, IconVariantData> = ${serialize(data)};\n`,
);

const catalogEntries = icons.map((icon) => ({
  id: icon.id,
  nameFa: icon.nameFa,
  nameEn: icon.nameEn,
  componentName: icon.componentName,
  category: icon.category,
  source: "crypto",
  sourceUrl: "https://github.com/rileystephens28/react-crypto-icons",
  verificationStatus: "verified",
  notes:
    "SVG from react-crypto-icons (MIT). Color keeps brand artwork; mono uses currentColor.",
  viewBox: icon.viewBox,
  aspectRatio: icon.aspectRatio,
}));

await writeFile(
  join(outRoot, "catalog.ts"),
  `// Generated by scripts/generate-crypto.mjs — do not edit.\n` +
    `import type { IconCategoryMeta, IconManifestEntry } from "../../types";\n\n` +
    `export const cryptoCategory: IconCategoryMeta = ${serialize({
      ...CATEGORY,
      count: icons.length,
    })};\n\n` +
    `export const cryptoManifest: IconManifestEntry[] = ${serialize(catalogEntries)};\n`,
);

const lines = [
  `// Generated by scripts/generate-crypto.mjs — do not edit.`,
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
  `// Generated by scripts/generate-crypto.mjs — do not edit.\n` +
    `export { cryptoCategory, cryptoManifest } from "./catalog";\n` +
    `export { data as cryptoIconData } from "./data";\n`,
);

const bytes = Buffer.byteLength(serialize(data));
flushComponentRegistry();
console.log(`Generated ${icons.length} crypto icons`);
if (skipped.length) {
  console.log(`Skipped ${skipped.length}:`);
  for (const s of skipped.slice(0, 20)) console.log(`  - ${s}`);
  if (skipped.length > 20) console.log(`  … +${skipped.length - 20} more`);
}
console.log(`Icon data JSON ~${(bytes / 1024).toFixed(1)} KB`);
console.log(`Output: ${outRoot}`);
