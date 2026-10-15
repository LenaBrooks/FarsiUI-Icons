import { createElement } from "react";
import { describe, expect, it } from "vitest";
import {
  LogoIcon,
  getIconManifestEntry,
  iconCategories,
  iconManifest,
} from "@farsiui/icons";
import {
  AasaamDigikalaIcon,
  BankMelliIcon,
  LpbBankMelliIcon,
  LpsElectricityIcon,
  PsiDigikalaIcon,
  WebsiteDigikalaIcon,
} from "../src/named-icons";

describe("package exports", () => {
  it("ships all source catalogs", () => {
    expect(iconManifest.length).toBeGreaterThan(790);
    expect(iconCategories.length).toBe(28);
    expect(getIconManifestEntry("dev-telegram")?.componentName).toBe(
      "DevTelegramIcon",
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
    expect(getIconManifestEntry("aasaam-digikala")?.componentName).toBe(
      "AasaamDigikalaIcon",
    );
    expect(getIconManifestEntry("psi-digikala")?.componentName).toBe(
      "PsiDigikalaIcon",
    );
    expect(getIconManifestEntry("lps-electricity")?.componentName).toBe(
      "LpsElectricityIcon",
    );
    expect(getIconManifestEntry("lpb-bank-melli")?.componentName).toBe(
      "LpbBankMelliIcon",
    );
  });

  it("exports LogoIcon helper", () => {
    expect(LogoIcon).toBeTruthy();
    const el = createElement(LogoIcon, { name: "bank-melli", size: 24 });
    expect(el.type).toBe(LogoIcon);
  });

  it("exports named icon components", () => {
    expect(BankMelliIcon).toBeTruthy();
    expect(WebsiteDigikalaIcon).toBeTruthy();
    expect(AasaamDigikalaIcon).toBeTruthy();
    expect(PsiDigikalaIcon).toBeTruthy();
    expect(LpsElectricityIcon).toBeTruthy();
    expect(LpbBankMelliIcon).toBeTruthy();
    const el = createElement(BankMelliIcon, { size: 24, title: "Melli" });
    expect(el.type).toBe(BankMelliIcon);
  });

  it("categories include banks with counts", () => {
    const banks = iconCategories.find((c) => c.id === "banks");
    expect(banks?.labelEn).toBe("Banks");
    expect(banks?.count).toBeGreaterThan(40);
  });
});
