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
  "banana-ai": "بنانا ai",
  farsiui: "فارسی‌یوآی",
  pixevel: "پیکسیول",
  easycandle: "ایزی‌کندل",
  gapgpt: "گپ‌جی‌پی‌تی",
  claude: "کلود",
  vercel: "ورسل",
  netlify: "نتلی‌فای",
  zarinpal: "زرین‌پال",
  alamto: "آلامتو",
  tarhak: "طرحَک",
  widgetify: "ویجتیفای",
  "widgetify-full": "ویجتیفای",
  "7learn": "سون‌لرن",
  abalon: "آبالون",
  adivery: "ادیوری",
  adtrace: "ادتریس",
  "ahan-online": "آهن آنلاین",
  "alan-chand": "الان چند",
  amadast: "آمادست",
  "aqaye-pardakht": "آقای پرداخت",
  "arz-digital": "ارزدیجیتال",
  bama: "باما",
  bitbarg: "بیت‌برگ",
  "booking-ir": "بوکینگ",
  cebit: "سبیت",
  darmankade: "درمانکده",
  drdr: "دکتردکتر",
  "e-estekhdam": "ای‌استخدام",
  fanafzar: "فن‌افزار",
  fontiran: "فونت ایران",
  footballi: "فوتبالی",
  goldika: "گلدیکا",
  "gooshi-shop": "گوشی شاپ",
  "halal-fund": "حلال فاند",
  hamravesh: "همروش",
  hayoola: "هیولا",
  "iran-dargah": "ایران درگاه",
  kavenegar: "کاوه‌نگار",
  "last-second": "لست‌سکند",
  "learn-files": "لرن‌فایلز",
  "meli-payamak": "ملی پیامک",
  mobit: "مبیت",
  "novin-hub": "نوین‌هاب",
  payaneh: "پایانه",
  paziresh24: "پذیرش۲۴",
  pezeshket: "پزشکت",
  "pico-file": "پیکوفایل",
  "ravan-darman": "روان‌درمان",
  respina24: "رسپینا",
  "robo-vakil": "روبووکیل",
  sahamyab: "سهامیاب",
  sahmeto: "سهمتو",
  "salamat-news": "سلامت نیوز",
  shepa: "شپا",
  shokolat: "شکلات",
  "spot-player": "اسپات‌پلیر",
  vajehyab: "واژه‌یاب",
  "vakil-digi": "وکیل‌دیجی",
  "wall-gold": "وال‌گلد",
  wisgoon: "ویسگون",
  zaya: "زایا",
  zoodex: "زودکس",
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
  tarhak: "Tarhak",
  widgetify: "Widgetify",
  "widgetify-full": "Widgetify Full",
  "7learn": "7Learn",
  abalon: "Abalon",
  adivery: "Adivery",
  adtrace: "Adtrace",
  "ahan-online": "Ahan Online",
  "alan-chand": "Alan Chand",
  amadast: "Amadast",
  "aqaye-pardakht": "Aqaye Pardakht",
  "arz-digital": "Arz Digital",
  bama: "Bama",
  bitbarg: "Bitbarg",
  "booking-ir": "Booking.ir",
  cebit: "Cebit",
  darmankade: "Darmankade",
  drdr: "DrDr",
  "e-estekhdam": "e-Estekhdam",
  fanafzar: "Fanafzar",
  fontiran: "Fontiran",
  footballi: "Footballi",
  goldika: "Goldika",
  "gooshi-shop": "Gooshi Shop",
  "halal-fund": "Halal Fund",
  hamravesh: "Hamravesh",
  hayoola: "Hayoola",
  "iran-dargah": "Iran Dargah",
  kavenegar: "Kavenegar",
  "last-second": "LastSecond",
  "learn-files": "LearnFiles",
  "meli-payamak": "Meli Payamak",
  mobit: "Mobit",
  "novin-hub": "NovinHub",
  payaneh: "Payaneh",
  paziresh24: "Paziresh24",
  pezeshket: "Pezeshket",
  "pico-file": "PicoFile",
  "ravan-darman": "Ravan Darman",
  respina24: "Respina24",
  "robo-vakil": "RoboVakil",
  sahamyab: "Sahamyab",
  sahmeto: "Sahmeto",
  "salamat-news": "Salamat News",
  shepa: "Shepa",
  shokolat: "Shokolat",
  "spot-player": "SpotPlayer",
  vajehyab: "Vajehyab",
  "vakil-digi": "VakilDigi",
  "wall-gold": "WallGold",
  wisgoon: "Wisgoon",
  zaya: "Zaya",
  zoodex: "Zoodex",
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
  tarhak: "https://tarhak.ir/",
  widgetify: "https://widgetify.ir/",
  "widgetify-full": "https://widgetify.ir/",
  "7learn": "https://7learn.com/safari-pinned-tab.svg",
  abalon: "https://abalon.cloud/favicon/favicon.svg",
  adivery: "https://www.adivery.com/wp-content/uploads/2021/06/logo3.svg",
  adtrace: "https://adtrace.io/adtraceLogo.svg",
  "ahan-online": "https://ahanonline.com/safari-pinned-tab.svg",
  "alan-chand": "https://alanchand.com/assets/img/logo/alanchandLogo.svg",
  amadast: "https://amadast.com/favIcon/safari-pinned-tab.svg",
  "aqaye-pardakht":
    "https://cdn.aqayepardakht.ir/assets-files/safari-pinned-tab.svg",
  "arz-digital": "https://arzdigital.com/safari-pinned-tab.svg",
  bama: "https://bama.ir/favicon/favicon.svg",
  bitbarg: "https://bitbarg.com/favicon-svg.svg",
  "booking-ir": "https://www.booking.ir/logos/favicon.v2.svg",
  cebit: "https://cebit.ir/asset/favicon/safari-pinned-tab.svg",
  darmankade: "https://www.darmankade.com/favicon/fav-icon-1024.svg",
  drdr: "https://drdr.ir/favicon.svg",
  "e-estekhdam": "https://cdn.e-estekhdam.com/_nuxt/safari-pinned-tab.svg",
  fanafzar: "https://fanafzar.com/safari-pinned-tab.svg",
  fontiran: "https://fontiran.com/front/safari-pinned-tab.svg",
  footballi:
    "https://footballi.net/assets/shared-application/images/favicons/safari-pinned-tab.svg",
  goldika: "https://goldika.ir/favicon.svg",
  "gooshi-shop": "https://gooshishop.com/assets/safari-pinned-tab.svg",
  "halal-fund": "https://halalfund.ir/images/logo.svg",
  hamravesh: "https://hamravesh.com/favicon.svg",
  hayoola: "https://hayoola.com/safari-pinned-tab.svg",
  "iran-dargah": "https://irandargah.com/icon.svg",
  kavenegar: "https://kavenegar.com/images/logo.svg",
  "last-second":
    "https://cdn.lastsecond.ir/last6-assets/icons/safari-pinned-tab.svg",
  "learn-files":
    "https://learnfiles.com/wp-content/themes/learnfiles/images/favicon/safari-pinned-tab.svg",
  "meli-payamak":
    "https://www.melipayamak.com/wp-content/themes/melipayamak/images/logo.svg",
  mobit: "https://www.mobit.ir/favicon.svg",
  "novin-hub": "https://novinhub.com/assets/images/icon.svg",
  payaneh: "https://payaneh.ir/image/favicon.svg",
  paziresh24:
    "https://www.paziresh24.com/_next/static/media/logo.5e03fe79.svg",
  pezeshket: "https://pezeshket.com/wp-content/uploads/2025/02/Fav-icon.svg",
  "pico-file": "https://www.picofile.com/favicon.svg",
  "ravan-darman":
    "https://ravandarman.com/images/app-icons/safari-pinned-tab.svg",
  respina24: "https://respina24.ir/imgs/loading/logo.svg",
  "robo-vakil": "https://robovakil.com/favicon/favicon.svg",
  sahamyab: "https://cdn.sahamyab.com/assets/safari-pinned-tab.svg",
  sahmeto: "https://sahmeto.com/icon.svg",
  "salamat-news": "https://www.salamatnews.com/safari-pinned-tab.svg",
  shepa: "https://shepa.com/wp-content/themes/shepa/images/logo.svg",
  shokolat: "https://shokolat.app/favicon.svg",
  "spot-player": "https://spotplayer.ir/assets/img/icon/favicon.svg",
  vajehyab: "https://vajehyab.com/favicon.svg",
  "vakil-digi": "https://vakildigi.com/assets/logos/vakildigi_logo.svg",
  "wall-gold": "https://wallgold.ir/_next/static/media/wgLogoSmall.0c1c9eeb.svg",
  wisgoon: "https://wisgoon.com/statics/images/logo_main.svg",
  zaya: "https://zaya.io/assets/img/zaya.svg",
  zoodex: "https://zoodex.ir/favicon.svg",
};

/** Brand palette samples shown in playground drawer. */
const BRAND_COLORS = {
  easycandle: ["#0B2A4A", "#FFC400", "#FF7A00"],
  vibefarsi: ["#E39A8E", "#cf5c49"],
  pixevel: ["#111111", "#FCFCFA", "#F8A8B8"],
  farsiui: ["#2E2E2E", "#FFFFFF"],
  "banana-ai": ["#000000", "#FE8301"],
  gapgpt: ["#10A37F"],
  shenakhti: ["#009FE3"],
  claude: ["#D97757"],
  vercel: ["#000000"],
  netlify: ["#00C7B7"],
  zarinpal: ["#FFD60A", "#0A33FF"],
  alamto: ["#FFC10A", "#FD5722"],
  tarhak: ["#E5E0CC", "#221F1E"],
  widgetify: ["#536DFE", "#FFFFFF"],
  "widgetify-full": ["#536DFE", "#FFFFFF"],
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
