import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { renderIconTsx, renderLucideIconTsx } from "../cli/render-icon-tsx.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

describe("renderIconTsx", () => {
  it("builds a self-contained component from registry JSON", () => {
    const payload = JSON.parse(
      readFileSync(join(root, "registry/icons/bank-melli.json"), "utf8"),
    );

    const tsx = renderIconTsx(payload);
    expect(tsx).toContain(`export const ${payload.componentName}`);
    expect(tsx).toContain('variant = "color"');
    expect(tsx).toContain("dangerouslySetInnerHTML");
    expect(tsx).not.toMatch(/from ["']@farsiui\/icons["']/);
  });
});

describe("renderLucideIconTsx", () => {
  it("builds a stroke icon without color/mono variants", () => {
    const payload = JSON.parse(
      readFileSync(join(root, "registry/lucide/icons/house.json"), "utf8"),
    );

    const tsx = renderLucideIconTsx(payload);
    expect(tsx).toContain(`export const ${payload.componentName}`);
    expect(tsx).toContain('stroke="currentColor"');
    expect(tsx).toContain("strokeWidth");
    expect(tsx).not.toContain("variant");
    expect(tsx).not.toMatch(/from ["']@farsiui\/icons["']/);
  });
});

