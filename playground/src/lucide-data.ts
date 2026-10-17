import galleryJson from "../../registry/lucide/gallery.json";

export type LucideGalleryIcon = {
  id: string;
  nameEn: string;
  componentName: string;
  tags: string[];
  categories: string[];
  viewBox: string;
  body: string;
};

type GalleryFile = {
  count: number;
  icons: LucideGalleryIcon[];
};

const gallery = galleryJson as GalleryFile;

export const lucideIcons: LucideGalleryIcon[] = gallery.icons;

const CATEGORY_FA: Record<string, string> = {
  accessibility: "دسترس‌پذیری",
  account: "حساب کاربری",
  animals: "حیوانات",
  arrows: "پیکان‌ها",
  buildings: "ساختمان‌ها",
  charts: "نمودارها",
  communication: "ارتباطات",
  connectivity: "اتصال",
  cursors: "نشانگرها",
  design: "طراحی",
  development: "توسعه",
  devices: "دستگاه‌ها",
  emoji: "ایموجی",
  files: "فایل‌ها",
  finance: "مالی",
  "food-beverage": "غذا و نوشیدنی",
  gaming: "بازی",
  home: "خانه",
  layout: "چیدمان",
  mail: "ایمیل",
  math: "ریاضی",
  medical: "پزشکی",
  multimedia: "چندرسانه‌ای",
  nature: "طبیعت",
  navigation: "ناوبری",
  notifications: "اعلان‌ها",
  other: "سایر",
  people: "افراد",
  photography: "عکاسی",
  science: "علم",
  seasons: "فصل‌ها",
  security: "امنیت",
  shapes: "اشکال",
  shopping: "خرید",
  social: "اجتماعی",
  sports: "ورزش",
  sustainability: "پایداری",
  text: "متن",
  time: "زمان",
  tools: "ابزارها",
  transportation: "حمل‌ونقل",
  travel: "سفر",
  weather: "آب‌وهوا",
};

export function labelLucideCategory(id: string): string {
  return CATEGORY_FA[id] ?? id;
}

/** Unique categories sorted by Persian label, with counts. */
export function buildLucideCategories(
  icons: LucideGalleryIcon[],
): { id: string; label: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const icon of icons) {
    for (const cat of icon.categories) {
      counts.set(cat, (counts.get(cat) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([id, count]) => ({
      id,
      label: labelLucideCategory(id),
      count,
    }))
    .sort((a, b) => a.label.localeCompare(b.label, "fa"));
}

export function searchLucideIcons(
  icons: LucideGalleryIcon[],
  query: string,
): LucideGalleryIcon[] {
  const q = query.trim().toLowerCase();
  if (!q) return icons;
  const tokens = q.split(/\s+/).filter(Boolean);
  return icons.filter((icon) => {
    const hay = [
      icon.id,
      icon.nameEn,
      icon.componentName,
      ...icon.tags,
      ...icon.categories,
      ...icon.categories.map(labelLucideCategory),
    ]
      .join(" ")
      .toLowerCase();
    return tokens.every((t) => hay.includes(t));
  });
}

/**
 * Group icons by primary category (first listed). Icons with no category → "other".
 */
export function buildLucideSections(
  icons: LucideGalleryIcon[],
): { id: string; label: string; icons: LucideGalleryIcon[] }[] {
  const byCat = new Map<string, LucideGalleryIcon[]>();
  for (const icon of icons) {
    const cat = icon.categories[0] ?? "other";
    const list = byCat.get(cat);
    if (list) list.push(icon);
    else byCat.set(cat, [icon]);
  }
  return [...byCat.entries()]
    .map(([id, list]) => ({
      id,
      label: labelLucideCategory(id),
      icons: list.slice().sort((a, b) => a.nameEn.localeCompare(b.nameEn)),
    }))
    .sort((a, b) => a.label.localeCompare(b.label, "fa"));
}
