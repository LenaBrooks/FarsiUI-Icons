/**
 * Reads assets/devicons/*.svg (curated subset of vorillaz/devicons, MIT)
 * and emits catalog + color/mono SVG data for the package.
 */
import { mkdir, readdir, readFile, writeFile, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { optimize } from "svgo";
import { normalizeOpticalViewBox } from "./lib/optical-normalize.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = join(root, "assets", "devicons");
const outRoot = join(root, "src", "generated", "devicons");

const CATEGORY = {
  id: "devicons",
  prefix: "dev",
  labelEn: "Dev & Social Brands",
  labelFa: "برندهای دولوپر و سوشال",
};

const NAME_FA = {
  telegram: "تلگرام",
  whatsapp: "واتساپ",
  youtube: "یوتیوب",
  twitter: "توییتر",
  discord: "دیسکورد",
  slack: "اسلک",
  tiktok: "تیک‌تاک",
  reddit: "ردیت",
  signal: "سیگنال",
  zoom: "زوم",
  behance: "بیهنس",
  dribbble: "دریبل",
  medium: "مدیوم",
  spotify: "اسپاتیفای",
  twitch: "توییچ",
  stackoverflow: "استک‌اورفلو",
  react: "ری‌اکت",
  vue: "ویو",
  svelte: "اسولت",
  nuxt: "ناکست",
  nextjs: "نکست",
  typescript: "تایپ‌اسکریپت",
  javascript: "جاوااسکریپت",
  nodejs: "نود",
  docker: "داکر",
  tailwind: "تیلویند",
  vite: "ویت",
  git: "گیت",
  html5: "HTML5",
  css3: "CSS3",
  python: "پایتون",
  php: "پی‌اچ‌پی",
  laravel: "لاراول",
  flutter: "فلاتر",
  dart: "دارت",
  nestjs: "نست",
  express: "اکسپرس",
  astro: "آسترو",
  bun: "بان",
  deno: "دینو",
  pnpm: "pnpm",
  npm: "npm",
  electron: "الکترون",
  rust: "راست",
  go: "گو",
  kotlin: "کاتلین",
  swift: "سوییفت",
  android: "اندروید",
  apple: "اپل",
  django: "جنگو",
  graphql: "گراف‌کیوال",
  prisma: "پریسما",
  mongodb: "مانگو‌دی‌بی",
  postgresql: "پستگرس",
  redis: "ردیس",
  mysql: "مای‌اس‌کیوال",
  github: "گیت‌هاب",
  gitlab: "گیت‌لب",
  figma: "فیگما",
  notion: "نوشن",
  postman: "پستمن",
  vercel: "ورسل",
  firebase: "فایربیس",
  supabase: "سوپابیس",
  openai: "اوپن‌ای‌آی",
  claude: "کلود",
  cursor: "کرسر",
  cloudflare: "کلادفلر",
  vscode: "وی‌اس‌کد",
  nginx: "انجین‌ایکس",
  aws: "ای‌دبلیو‌اس",
  "google-cloud": "گوگل کلاد",
  kubernetes: "کوبرنتیز",
  angular: "انگولار",
  java: "جاوا",
  ruby: "روبی",
  rails: "ریلز",
  spring: "اسپرینگ",
  "c-sharp": "سی‌شارپ",
  sass: "ساس",
  bootstrap: "بوت‌استرپ",
  webpack: "وب‌پک",
  babel: "بابل",
  eslint: "ای‌اس‌لینت",
  prettier: "پری‌تی‌یر",
  jest: "جست",
  playwright: "پلی‌رایت",
  cypress: "سایپرس",
  storybook: "استوری‌بوک",
  redux: "رداکس",
  yarn: "یارن",
  jenkins: "جنکینز",
  terraform: "ترافرم",
  netlify: "نتلی‌فای",
  heroku: "هروکو",
  chrome: "کروم",
  firefox: "فایرفاکس",
  wordpress: "وردپرس",
  stripe: "استرایپ",
  shopify: "شاپیفای",
  pytorch: "پای‌تورچ",
  tensorflow: "تنسورفلو",
  unity: "یونیتی",
  blender: "بلندر",
  bitbucket: "بیت‌باکت",
  jira: "جیرا",
  fastapi: "فست‌ای‌پی‌آی",
  flask: "فلسک",
  gatsby: "گتسبی",
  remix: "ریمیکس",
  anthropic: "انتروپیک",
  grafana: "گرافانا",
  sentry: "سنتری",
  canva: "کنوا",
  obsidian: "ابسیدین",
  ubuntu: "اوبونتو",
  neovim: "نئوویم",
  sqlite: "اس‌کیوالایت",
  kafka: "کافکا",
  paypal: "پی‌پال",
  fedora: "فدورا",
  debian: "دبیان",
  centos: "سنت‌اواس",
  emacs: "ایمکس",
  "github-actions": "گیت‌هاب اکشنز",
  "github-copilot": "گیت‌هاب کوپایلت",
  circleci: "سرکل‌سی‌آی",
  drone: "درون",
  helm: "هلم",
  ansible: "انسیبل",
  chef: "شف",
  consul: "کنسول",
  elasticsearch: "الاستیک‌سرچ",
  kibana: "کیبانا",
  datadog: "دیتاداگ",
  launchdarkly: "لانچ‌دارکلی",
  cassandra: "کاسندرا",
  couchdb: "کاچ‌دی‌بی",
  clickhouse: "کلیک‌هاوس",
  airflow: "ایرفلو",
  dbt: "dbt",
  hadoop: "هدوپ",
  clojure: "کلوژر",
  elixir: "الیکسیر",
  haskell: "هسکل",
  erlang: "ارلنگ",
  julia: "جولیا",
  crystal: "کریستال",
  fsharp: "اف‌شارپ",
  c: "سی",
  gradle: "گریدل",
  lerna: "لرنا",
  esbuild: "ای‌اس‌بیلد",
  jquery: "جی‌کوئری",
  backbone: "بک‌بون",
  ember: "امبر",
  alpinejs: "آلپاین",
  d3: "دی‌۳",
  "ant-design": "انت دیزاین",
  less: "لس",
  hono: "هونو",
  axios: "اکسیوس",
  auth0: "آث‌زیرو",
  keycloak: "کیکلوک",
  clerk: "کلرک",
  appwrite: "اپ‌رایت",
  pocketbase: "پاکت‌بیس",
  directus: "دایرکتوس",
  strapi: "استرپی",
  sanity: "سنیتی",
  contentful: "کانتنت‌فول",
  drizzle: "دریزل",
  typeorm: "تایپ‌اواورم",
  sequelize: "سیکویلایز",
  mongoose: "مانگوس",
  vitest: "ویتست",
  mocha: "موکا",
  gulp: "گالپ",
  grunt: "گرانت",
  azure: "آژور",
  digitalocean: "دیجیتال‌اوشن",
  flyio: "فلای",
  railway: "ریلوِی",
  render: "رندر",
  coolify: "کولیفای",
  portainer: "پورتینر",
  photoshop: "فتوشاپ",
  illustrator: "ایلاستریتور",
  linear: "لینیر",
  asana: "آسانا",
  trello: "ترلو",
  confluence: "کانفلونس",
  linkedin: "لینکدین",
  dropbox: "دراپ‌باکس",
  ghost: "گوست",
  hugo: "هوگو",
  jekyll: "جکیل",
  woocommerce: "ووکامرس",
  magento: "مجنتو",
  "react-native": "ری‌اکت نیتیو",
  expo: "اکسپو",
  capacitor: "کپسیتور",
  ionic: "آیونیک",
  tauri: "تائوری",
  huggingface: "هاگینگ‌فیس",
  ollama: "اولاوا",
  langchain: "لنگ‌چین",
  insomnia: "اینسومنیا",
  hoppscotch: "هاپسکاچ",
  jupyter: "ژوپیتر",
  solidity: "سالیدیتی",
  ethereum: "اتریوم",
  godot: "گودو",
  homebrew: "هوم‌برو",
  chocolatey: "چاکلتی",
  yaml: "یامل",
  json: "JSON",
  protobuf: "پروتوباف",
  openapi: "اوپن‌ای‌پی‌آی",
  swagger: "اسواگر",
  grpc: "جی‌آر‌پی‌سی",
  meilisearch: "میلی‌سرچ",
  algolia: "الگولیا",
  typesense: "تایپ‌سنس",
  jwt: "JWT",
  knex: "نکس",
  chai: "چای",
  jasmine: "یاسمین",
  karma: "کارما",
  browserify: "براوزریفای",
  "aws-lambda": "ای‌دبلیو‌اس لامبدا",
  "aws-s3": "ای‌دبلیو‌اس S3",
  "aws-ec2": "ای‌دبلیو‌اس EC2",
  framer: "فریمر",
  adobe: "ادوبی",
  basecamp: "بیس‌کمپ",
  google: "گوگل",
  brave: "بریو",
  cordova: "کوردووا",
  httpie: "اچ‌تی‌تی‌پی‌آی",
  bitcoin: "بیت‌کوین",
  minio: "مینیو",
  traefik: "ترافیک",
  caddy: "کدی",
  haproxy: "اچ‌ای‌پروکسی",
  envoy: "انوی",
  istio: "ایستیو",
  pulumi: "پولومی",
  sonarqube: "سونارکیوب",
  codecov: "کدکاو",
  snyk: "اسنیک",
  logseq: "لاگ‌سک",
  soundcloud: "ساندکلود",
  facebook: "فیسبوک",
  instagram: "اینستاگرام",
  pinterest: "پینترست",
  snapchat: "اسنپ‌چت",
  mastodon: "مستودون",
  bluesky: "بلواسکای",
};

const NAME_EN = {
  nextjs: "Next.js",
  nodejs: "Node.js",
  nestjs: "NestJS",
  html5: "HTML5",
  css3: "CSS3",
  vscode: "VS Code",
  github: "GitHub",
  gitlab: "GitLab",
  stackoverflow: "Stack Overflow",
  mongodb: "MongoDB",
  postgresql: "PostgreSQL",
  mysql: "MySQL",
  openai: "OpenAI",
  graphql: "GraphQL",
  typescript: "TypeScript",
  javascript: "JavaScript",
  tailwind: "Tailwind CSS",
  aws: "AWS",
  "google-cloud": "Google Cloud",
  kubernetes: "Kubernetes",
  "c-sharp": "C#",
  fastapi: "FastAPI",
  sqlite: "SQLite",
  paypal: "PayPal",
  "github-actions": "GitHub Actions",
  "github-copilot": "GitHub Copilot",
  alpinejs: "Alpine.js",
  d3: "D3.js",
  "ant-design": "Ant Design",
  fsharp: "F#",
  "react-native": "React Native",
  flyio: "Fly.io",
  openapi: "OpenAPI",
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

/** Make gradient/clip ids unique so multiple icons can share a page. */
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
    .replace(/stop-color=(["'])[^"']+\1/gi, 'stop-color="currentColor"');
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

const icons = [];
const data = {};

for (const file of files) {
  const slug = kebab(file);
  const id = `dev-${slug}`;
  const source = await readFile(join(sourceRoot, file), "utf8");
  // uniquify before SVGO; prefixIds after cleanupIds so short a/b/c don't collide.
  const prefixed = uniquifyIds(source, id);

  // maxZoom:1 — no wordmark crop (OpenAI / Next.js ends were clipped).
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

  const nameEn = titleFromSlug(slug);
  const nameFa = NAME_FA[slug] ?? nameEn;
  const componentName = `Dev${pascal(slug)}Icon`;

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
  `// Generated by scripts/generate-devicons.mjs — do not edit.\n` +
    `import type { IconVariantData } from "../../types";\n\n` +
    `export const data: Record<string, IconVariantData> = ${serialize(data)};\n`,
);

const catalogEntries = icons.map((icon) => ({
  id: icon.id,
  nameFa: icon.nameFa,
  nameEn: icon.nameEn,
  componentName: icon.componentName,
  category: icon.category,
  source: "devicons",
  sourceUrl: "https://github.com/vorillaz/devicons",
  verificationStatus: "verified",
  notes:
    "Curated SVG from vorillaz/devicons (MIT). Color keeps brand artwork; mono uses currentColor.",
  viewBox: icon.viewBox,
  aspectRatio: icon.aspectRatio,
}));

await writeFile(
  join(outRoot, "catalog.ts"),
  `// Generated by scripts/generate-devicons.mjs — do not edit.\n` +
    `import type { IconCategoryMeta, IconManifestEntry } from "../../types";\n\n` +
    `export const deviconsCategory: IconCategoryMeta = ${serialize({
      ...CATEGORY,
      count: icons.length,
    })};\n\n` +
    `export const deviconsManifest: IconManifestEntry[] = ${serialize(catalogEntries)};\n`,
);

const lines = [
  `// Generated by scripts/generate-devicons.mjs — do not edit.`,
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
  `// Generated by scripts/generate-devicons.mjs — do not edit.\n` +
    `export { deviconsCategory, deviconsManifest } from "./catalog";\n` +
    `export { data as deviconsIconData } from "./data";\n`,
);

const bytes = Buffer.byteLength(serialize(data));
console.log(`Generated ${icons.length} devicons`);
console.log(`Icon data JSON ~${(bytes / 1024).toFixed(1)} KB`);
console.log(`Output: ${outRoot}`);
