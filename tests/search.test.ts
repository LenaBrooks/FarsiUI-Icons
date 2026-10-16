import { describe, expect, it } from "vitest";
import {
  buildSearchIndex,
  compactSearch,
  entryMatchesQuery,
  normalizeSearch,
  scoreEntry,
  searchEntries,
  type SearchableEntry,
} from "../playground/src/search";

const catalog: SearchableEntry[] = [
  {
    id: "bank-melli",
    nameFa: "بانک ملی",
    nameEn: "Bank Melli",
    componentName: "BankMelliIcon",
    category: "banks",
  },
  {
    id: "aasaam-digikala",
    nameFa: "دیجی‌کالا",
    nameEn: "Digikala",
    componentName: "DigikalaIcon",
    category: "aasaam",
    source: "aasaam",
  },
  {
    id: "gapgpt",
    nameFa: "گپ‌جی‌پی‌تی",
    nameEn: "GapGPT",
    componentName: "GapGPTIcon",
    category: "manual",
    source: "manual",
  },
  {
    id: "easycandle",
    nameFa: "ایزی‌کندل",
    nameEn: "EasyCandle",
    componentName: "EasycandleIcon",
    category: "manual",
  },
  {
    id: "dev-telegram",
    nameFa: "Telegram",
    nameEn: "Telegram",
    componentName: "TelegramIcon",
    category: "devicons",
  },
  {
    id: "farsiui",
    nameFa: "فارسی‌یوآی",
    nameEn: "FarsiUI",
    componentName: "FarsiUIIcon",
    category: "manual",
  },
  {
    id: "vibefarsi",
    nameFa: "وایب فارسی",
    nameEn: "Vibefarsi",
    componentName: "VibefarsiIcon",
    category: "manual",
  },
];

buildSearchIndex(catalog);

describe("normalizeSearch", () => {
  it("unifies arabic yeh/kaf and digits", () => {
    expect(normalizeSearch("ديجي‌كالا ۱۲")).toBe("دیجی کالا 12");
  });

  it("compacts zwnj and spaces the same way", () => {
    expect(compactSearch("دیجی‌کالا")).toBe(compactSearch("دیجی کالا"));
  });

  it("keeps فارسی as its own token in FarsiUI name", () => {
    expect(normalizeSearch("فارسی‌یوآی")).toContain("فارسی");
    expect(normalizeSearch("فارسی‌یوآی").split(" ")).toContain("فارسی");
  });
});

describe("entryMatchesQuery FA/EN", () => {
  it("finds digikala via English and Persian forms", () => {
    const digi = catalog[1]!;
    expect(entryMatchesQuery(digi, "digikala")).toBe(true);
    expect(entryMatchesQuery(digi, "دیجی کالا")).toBe(true);
    expect(entryMatchesQuery(digi, "دیجیکالا")).toBe(true);
    expect(entryMatchesQuery(digi, "Digi")).toBe(true);
  });

  it("does not match source pack names like aasaam against every aasaam-* icon", () => {
    const digi = catalog[1]!;
    expect(entryMatchesQuery(digi, "aasaam")).toBe(false);
    expect(entryMatchesQuery(digi, "digikala")).toBe(true);
  });

  it("finds bank melli via FA and EN", () => {
    const melli = catalog[0]!;
    expect(entryMatchesQuery(melli, "melli")).toBe(true);
    expect(entryMatchesQuery(melli, "بانک ملی")).toBe(true);
    expect(entryMatchesQuery(melli, "ملی")).toBe(true);
    expect(entryMatchesQuery(melli, "Bank Melli")).toBe(true);
  });

  it("finds gapgpt via FA nicknames and spaced EN", () => {
    const gap = catalog[2]!;
    expect(entryMatchesQuery(gap, "gapgpt")).toBe(true);
    expect(entryMatchesQuery(gap, "gap gpt")).toBe(true);
    expect(entryMatchesQuery(gap, "گپ")).toBe(true);
    expect(entryMatchesQuery(gap, "گپ جی پی تی")).toBe(true);
  });

  it("finds easycandle despite zwnj in nameFa", () => {
    const easy = catalog[3]!;
    expect(entryMatchesQuery(easy, "ایزی کندل")).toBe(true);
    expect(entryMatchesQuery(easy, "easycandle")).toBe(true);
    expect(entryMatchesQuery(easy, "easy candle")).toBe(true);
  });

  it("finds telegram via Persian alias", () => {
    expect(entryMatchesQuery(catalog[4]!, "تلگرام")).toBe(true);
  });

  it("finds FarsiUI / Vibefarsi via bare فارسی", () => {
    buildSearchIndex(catalog);
    const hits = searchEntries(catalog, "فارسی");
    expect(hits.map((e) => e.id).sort()).toEqual(["farsiui", "vibefarsi"]);
  });
});

describe("searchEntries ranking", () => {
  it("ranks exact id ahead of weaker hits", () => {
    const wider: SearchableEntry[] = [
      ...catalog,
      {
        id: "melli-extra",
        nameFa: "ملی تست",
        nameEn: "Melli Extra",
        componentName: "MelliExtraIcon",
        category: "banks",
      },
    ];
    buildSearchIndex(wider);
    const hits = searchEntries(wider, "bank-melli");
    expect(hits[0]?.id).toBe("bank-melli");
    expect(scoreEntry(wider[0]!, "bank-melli")).toBeLessThan(
      scoreEntry(wider[wider.length - 1]!, "bank-melli"),
    );
  });
});
