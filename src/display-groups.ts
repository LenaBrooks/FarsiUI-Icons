import type { IconCategory, IconManifestEntry } from "./types";

/**
 * Topical display groups for gallery / sidebar.
 * Keeps loader `entry.category` untouched; only remaps UI grouping.
 */
export type DisplayGroupId =
  | "featured"
  | "finance"
  | "payments"
  | "apps"
  | "food"
  | "retail"
  | "mobility"
  | "media"
  | "org"
  | "utility"
  | "developer"
  | "crypto"
  | "brands";

export interface DisplayGroupMeta {
  id: DisplayGroupId;
  labelFa: string;
  labelEn: string;
}

/**
 * Curated picks the maintainer adds by hand (sidebar: منتخب‌ها).
 * Order here is the gallery order for the featured section.
 */
export const FEATURED_ICON_ORDER = [
  "farsiui",
  "vibefarsi",
  "banana-ai",
  "easycandle",
  "shenakhti",
  "pixevel",
  "alamto",
  "widgetify",
  "widgetify-full",
  "tarhak",
] as const;

export const FEATURED_ICON_IDS = new Set<string>(FEATURED_ICON_ORDER);

/** Ordered topical groups shown in the playground sidebar. */
export const displayGroups: DisplayGroupMeta[] = [
  { id: "featured", labelFa: "منتخب‌ها", labelEn: "Featured" },
  { id: "finance", labelFa: "بانک و بیمه", labelEn: "Banks & Insurance" },
  { id: "payments", labelFa: "پرداخت و درگاه", labelEn: "Payments" },
  { id: "apps", labelFa: "اپ و خدمات آنلاین", labelEn: "Apps & Online" },
  { id: "food", labelFa: "خوردنی و نوشیدنی", labelEn: "Food & Drink" },
  { id: "retail", labelFa: "فروشگاه و کالا", labelEn: "Retail & Goods" },
  {
    id: "mobility",
    labelFa: "حمل‌ونقل و خودرو",
    labelEn: "Transport & Auto",
  },
  {
    id: "media",
    labelFa: "رسانه و سرگرمی",
    labelEn: "Media & Entertainment",
  },
  { id: "org", labelFa: "سازمان و دانشگاه", labelEn: "Orgs & Universities" },
  { id: "utility", labelFa: "خدمات شهری", labelEn: "Utilities" },
  {
    id: "developer",
    labelFa: "دولوپر و ابزار",
    labelEn: "Developer & Tools",
  },
  { id: "crypto", labelFa: "رمزارز", labelEn: "Crypto" },
  { id: "brands", labelFa: "برندها", labelEn: "Brands" },
];

/** Pin specific icons into a group (overrides category / keyword). */
const ID_GROUP_OVERRIDES: Partial<Record<string, DisplayGroupId>> = {
  // Keep Torob variants together under retail (price-comparison / shopping).
  "website-torob": "retail",
};

/** Direct map from package categories that already are topical. */
const CATEGORY_TO_GROUP: Partial<Record<IconCategory, DisplayGroupId>> = {
  banks: "finance",
  "logos-per-banks": "finance",
  insurance: "finance",
  "payment-gateways": "payments",
  "logos-per-gateways": "payments",
  "website-applications": "apps",
  "app-store": "apps",
  "tech-companies": "apps",
  isp: "apps",
  "food-drink": "food",
  "business-chain-stores": "retail",
  "detergent-hygiene": "retail",
  "fashion-clothing": "retail",
  "household-appliances": "retail",
  transportation: "mobility",
  automobiles: "mobility",
  "media-news": "media",
  tv: "media",
  vod: "media",
  football: "media",
  "social-media": "media",
  "organization-departments": "org",
  university: "org",
  "logos-per-service": "utility",
  devicons: "developer",
  crypto: "crypto",
  social: "media",
  // Source dumps classified by keywords / fallback:
  aasaam: "brands",
  "persian-simple-icons": "brands",
  manual: "brands",
};

type Rule = { group: DisplayGroupId; re: RegExp };

/** Keyword rules for source dumps (aasaam / psi / manual). First match wins. */
const KEYWORD_RULES: Rule[] = [
  {
    group: "finance",
    re: /bimeh|insurance|bank|bourse|ansar|ayandeh|mellat|melli|saderat|tejarat|parsian|pasargad|saman|sina|mehriran|hekmat|ghavamin|futurebank|eghtesadnovin|armanmeli|gardeshgari|\bdey\b|\bday\b|caspian|karafarin|refah|postbank|maskan|tosee|tourism|اقتصادنوین|بانک|بیمه|بورس|aasaam-shahr\b|bank-shahr/,
  },
  {
    group: "payments",
    re: /pardakht|asanpardakht|zarin|nextpay|payping|payir|idpay|shaparak|\bpep\b|\bsep\b|payment|gateway|درگاه|پرداخت|زرین/,
  },
  {
    group: "mobility",
    re: /snapp|tapsi|maxim|carpino|balad|neshan|taxi|airline|iranair|mahan|ikco|saipa|automobile|transport|اسنپ|تپسی|نقشه|خودرو/,
  },
  {
    group: "media",
    re: /news|sobh|daily|varzesh|aparat|filimo|namava|filmnet|telewebion|fidibo|shenoto|navaar|doctv|zoomit|digiato|football|esteghlal|persepolis|honar|media|vod|\btv\b|eghtesad|faradeed|fardanews|fartak|bartarinha|baeghtesad|afkar|ayand|didgahemrooz|etemad|borna|ilna|iana|gostaresh|خبر|فوتبال|رسانه|آپارات|فیلیمو/,
  },
  {
    group: "retail",
    re: /digikala|okala|basalam|torob|netbarg|takhfifan|sheypoor|alibaba|golrang|canbo|hyper|market|store|فروشگاه|دیجی.?کالا|شیپور/,
  },
  {
    group: "apps",
    // Divar with website-divar (website-applications → apps)
    re: /cafebazaar|cafebazar|myket|jobvision|jabinja|jabama|jajiga|otaghak|yektanet|arvan|enamad|bitbaan|authin|deema|sabketo|bookapo|xaas|asiatech|hiweb|shatel|mokhaberat|irancell|hamrah|rightel|blogfa|digisargarmy|\bdivar\b|اپ|کافه.?بازار|آروان|ایرانسل|دیوار/,
  },
  {
    group: "org",
    re: /gov|police|behzisti|university|iau|\bgov\b|ministry|sazman|organization|firedepartment|\bcra\b|\bdoe\b|ibto|ictgov|\bbmn\b|daneshbonyan|cyberpolice|سازمان|دانشگاه|وزارت|پلیس/,
  },
  {
    group: "food",
    re: /behnoosh|food|drink|restaurant|pizza|نوشید|خوراک|غذا/,
  },
  {
    group: "developer",
    re: /vercel|netlify|claude|gapgpt|\bgit\b|github|gitlab|docker|kubernetes|react|vue|angular|nodejs|typescript|vscode|cursor|cloudflare|supabase|prisma|webpack|vite|npm|pnpm|دولوپر|ورسل|نتلی/,
  },
];

function classifyByKeywords(entry: IconManifestEntry): DisplayGroupId | null {
  const hay = `${entry.id} ${entry.nameEn} ${entry.nameFa}`.toLowerCase();
  for (const rule of KEYWORD_RULES) {
    if (rule.re.test(hay)) return rule.group;
  }
  return null;
}

/**
 * Resolve the topical display group for a catalog entry.
 * Persian-labs (and similar) categories map directly; source dumps use keywords.
 */
export function getDisplayGroupId(entry: IconManifestEntry): DisplayGroupId {
  if (FEATURED_ICON_IDS.has(entry.id)) return "featured";

  const override = ID_GROUP_OVERRIDES[entry.id];
  if (override) return override;

  const fromCategory = CATEGORY_TO_GROUP[entry.category];

  // Source-based categories: prefer keyword classification.
  if (
    entry.category === "aasaam" ||
    entry.category === "persian-simple-icons" ||
    entry.category === "manual"
  ) {
    return classifyByKeywords(entry) ?? "brands";
  }

  return fromCategory ?? "brands";
}

export function getDisplayGroupMeta(
  id: DisplayGroupId,
): DisplayGroupMeta | undefined {
  return displayGroups.find((g) => g.id === id);
}
