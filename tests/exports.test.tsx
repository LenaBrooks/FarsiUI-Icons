import { createElement } from "react";
import { describe, expect, it } from "vitest";
import {
  BankMelliIcon,
  DigikalaIcon,
  LogoIcon,
  ZarinpalIcon,
  getIconManifestEntry,
  iconCategories,
  iconManifest,
} from "farsiui-icons";

describe("package exports", () => {
  it("ships all source catalogs", () => {
    expect(iconManifest.length).toBeGreaterThan(790);
    expect(iconCategories.length).toBe(30);
    expect(getIconManifestEntry("dev-telegram")?.componentName).toMatch(
      /^Telegram\d*Icon$/,
    );
    expect(getIconManifestEntry("shenakhti")?.componentName).toBe(
      "ShenakhtiIcon",
    );
    expect(getIconManifestEntry("shenakhti")?.nameFa).toBe(
      "مرکز شناختی علم و صنعت",
    );
    expect(getIconManifestEntry("pixevel")?.componentName).toBe(
      "PixevelIcon",
    );
    expect(getIconManifestEntry("farsiui")?.componentName).toBe(
      "FarsiUIIcon",
    );
    expect(getIconManifestEntry("bank-melli")?.componentName).toBe(
      "BankMelliIcon",
    );
    // Manual curated mark wins bare ZarinpalIcon (no Aasaam/Psi source prefix).
    expect(getIconManifestEntry("zarinpal")?.componentName).toBe(
      "ZarinpalIcon",
    );
    expect(
      getIconManifestEntry("aasaam-zarinpal")?.componentName,
    ).not.toMatch(/Aasaam|Psi|Lps|Lpb|Social|Dev|Crypto/i);
    expect(
      getIconManifestEntry("aasaam-digikala")?.componentName,
    ).not.toMatch(/Aasaam|Psi/i);
    expect(getIconManifestEntry("lps-electricity")?.componentName).toMatch(
      /^Electricity\d*Icon$/,
    );
  });

  it("exports LogoIcon helper", () => {
    expect(LogoIcon).toBeTruthy();
    const el = createElement(LogoIcon, { name: "bank-melli", size: 24 });
    expect(el.type).toBe(LogoIcon);
  });

  it("exports named icon components without source prefixes", () => {
    expect(BankMelliIcon).toBeTruthy();
    expect(ZarinpalIcon).toBeTruthy();
    expect(DigikalaIcon).toBeTruthy();
    const el = createElement(BankMelliIcon, { size: 24, title: "Melli" });
    expect(el.type).toBe(BankMelliIcon);
  });

  it("component names never include source labels", () => {
    // Ban source-pack prefixes glued onto another brand (AasaamDigikalaIcon),
    // but allow the brand itself (aasaam-aasaam → AasaamIcon).
    // Social* is OK for persian-labs social-media (topical, like Bank*/App*).
    const banned =
      /^(Aasaam|Psi|Lps|Lpb|LpbBank|LpbGateway|Dev|Crypto)(?!Icon$)[A-Z]/;
    for (const entry of iconManifest) {
      expect(
        entry.componentName,
        `${entry.id} → ${entry.componentName}`,
      ).not.toMatch(banned);
    }
  });

  it("categories include banks with counts", () => {
    const banks = iconCategories.find((c) => c.id === "banks");
    expect(banks?.labelEn).toBe("Banks");
    expect(banks?.count).toBeGreaterThan(40);
  });
});
