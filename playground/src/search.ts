/** Normalize Persian/Arabic digits and Yeh/Kaf for search. */
export function normalizeSearch(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/\s+/g, " ");
}

/**
 * Extra aliases so FA typos / brand nicknames hit catalog names.
 * Values are matched against id / nameEn / nameFa / componentName.
 */
const ALIASES: Record<string, string[]> = {
  "دیجی کالا": ["digikala", "دیجی‌کالا"],
  "دیجی‌کالا": ["digikala"],
  دیوار: ["divar"],
  اسنپ: ["snap", "snapp"],
  تپسی: ["tapsi"],
  آپارات: ["aparat"],
  فیلیمو: ["filimo"],
  نماوا: ["namava"],
  "زرین پال": ["zarinpal", "زرین‌پال"],
  "زرین‌پال": ["zarinpal"],
  شاپرک: ["shaparak"],
  "بانک ملی": ["melli", "bank-melli"],
  ملی: ["melli"],
  ملت: ["mellat"],
  سامان: ["saman"],
  پارسیان: ["parsian"],
  پاسارگاد: ["pasargad"],
  صادرات: ["saderat"],
  تجارت: ["tejarat"],
  مسکن: ["maskan"],
  رفاه: ["refah"],
  سپه: ["sepah"],
  کشاورزی: ["keshavarzi"],
  "کافه بازار": ["cafebazar", "bazar", "کافه‌بازار"],
  "کافه‌بازار": ["cafebazar", "bazar"],
  مایکت: ["myket"],
  روبیکا: ["rubika"],
  ایتا: ["eitaa"],
  بله: ["bale"],
  علمی: ["shenakhti"],
  "مرکز شناختی": ["shenakhti"],
  "علم و صنعت": ["shenakhti"],
  shenakhti: ["shenakhti"],
  elmi: ["shenakhti"],
  "وایب فارسی": ["vibefarsi"],
  وایب: ["vibefarsi"],
  vibefarsi: ["vibefarsi"],
  vibe: ["vibefarsi"],
  "banana ai": ["banana-ai"],
  banana: ["banana-ai"],
  بنانا: ["banana-ai"],
  ویرگول: ["farsiui"],
  virgool: ["farsiui"],
  farsiui: ["farsiui"],
  "فارسی‌یوآی": ["farsiui"],
  "فارسی یوآی": ["farsiui"],
  pixevel: ["pixevel"],
  پیکسیول: ["pixevel"],
  پیکسی: ["pixevel"],


  تلگرام: ["telegram", "dev-telegram"],
  واتساپ: ["whatsapp", "dev-whatsapp"],
  گیتهاب: ["github", "dev-github"],
  "گیت هاب": ["github", "dev-github"],
  "گیت‌هاب": ["github", "dev-github"],
  ری‌اکت: ["react", "dev-react"],
  ریکت: ["react", "dev-react"],
  نکست: ["nextjs", "dev-nextjs"],
  فیگما: ["figma", "dev-figma"],
  داکر: ["docker", "dev-docker"],
  یوتیوب: ["youtube", "dev-youtube"],
  اینستا: ["instagram"],
  دیسکورد: ["discord", "dev-discord"],
  انگولار: ["angular", "dev-angular"],
  کوبرنتیز: ["kubernetes", "dev-kubernetes"],
  k8s: ["kubernetes", "dev-kubernetes"],
  جاوا: ["java", "dev-java"],
  سی‌شارپ: ["c-sharp", "dev-c-sharp"],
  csharp: ["c-sharp", "dev-c-sharp"],
  وردپرس: ["wordpress", "dev-wordpress"],
  استرایپ: ["stripe", "dev-stripe"],
  شاپیفای: ["shopify", "dev-shopify"],
  کروم: ["chrome", "dev-chrome"],
  فایرفاکس: ["firefox", "dev-firefox"],
  یونیتی: ["unity", "dev-unity"],
  پای‌تورچ: ["pytorch", "dev-pytorch"],
  تنسورفلو: ["tensorflow", "dev-tensorflow"],
  جیرا: ["jira", "dev-jira"],
  جنکینز: ["jenkins", "dev-jenkins"],
  نتلی‌فای: ["netlify", "dev-netlify"],
  کنوا: ["canva", "dev-canva"],
  اوبونتو: ["ubuntu", "dev-ubuntu"],
  پی‌پال: ["paypal", "dev-paypal"],
  "گوگل کلاد": ["google-cloud", "dev-google-cloud"],
  gcp: ["google-cloud", "dev-google-cloud"],
  aws: ["dev-aws"],
  ریداکس: ["redux", "dev-redux"],
  رداکس: ["redux", "dev-redux"],
  اسپرینگ: ["spring", "dev-spring"],
  روبی: ["ruby", "dev-ruby"],
  ریلز: ["rails", "dev-rails"],

  نوبیتکس: ["nobitex"],
  "اسنپ فود": ["snappfood", "snapp-food"],
  ترب: ["torob"],
  شیپور: ["sheypoor"],
  "علی بابا": ["alibaba", "علی‌بابا"],
  نشان: ["neshan"],
  بلد: ["balad"],
  ایرانسل: ["irancell"],
  "همراه اول": ["mci", "hamrah"],
  رایتل: ["rightel"],
  پست: ["post"],
  برق: ["electricity", "lps-electricity"],
  گاز: ["gas"],
  آب: ["water"],
  مخابرات: ["mokhaberat", "telecom"],
  پرسپولیس: ["perspolis", "persepolis"],
  استقلال: ["esteghlal"],
  سپاهان: ["sepahan"],
  تراکتور: ["tractor"],
  شریف: ["sharif"],
  تهران: ["tehran"],
  امیرکبیر: ["amirkabir", "akut"],
};

export function expandQueryTerms(query: string): string[] {
  const n = normalizeSearch(query);
  if (!n) return [];
  const terms = new Set<string>([n, n.replace(/‌/g, ""), n.replace(/-/g, " ")]);
  for (const [alias, targets] of Object.entries(ALIASES)) {
    const a = normalizeSearch(alias);
    if (n.includes(a) || a.includes(n)) {
      for (const t of targets) terms.add(normalizeSearch(t));
    }
  }
  return [...terms];
}

export function entryMatchesQuery(
  entry: {
    id: string;
    nameFa: string;
    nameEn: string;
    componentName: string;
    category: string;
    source?: string;
  },
  query: string,
): boolean {
  const terms = expandQueryTerms(query);
  if (terms.length === 0) return true;

  const hay = normalizeSearch(
    [
      entry.id,
      entry.nameFa,
      entry.nameEn,
      entry.componentName,
      entry.category,
      entry.source ?? "",
    ].join(" "),
  );

  return terms.some((t) => hay.includes(t));
}
