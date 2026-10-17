import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { renderIconTsx } from "../packages/icons-cli/src/render-icon-tsx.mjs";

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
    expect(tsx).not.toContain("@farsiui/icons");
  });
});

