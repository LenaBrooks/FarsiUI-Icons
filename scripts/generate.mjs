import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { resetComponentRegistry } from "./lib/component-registry.mjs";

const root = dirname(fileURLToPath(import.meta.url));

/**
 * Order = who wins the bare name (ZarinpalIcon).
 * Manual curated marks before dump sources; no source prefixes in exports.
 */
const scripts = [
  "generate-persian-labs.mjs",
  "generate-manual.mjs",
  "generate-social.mjs",
  "generate-crypto.mjs",
  "generate-aasaam.mjs",
  "generate-persian-simple-icons.mjs",
  "generate-logos-per-service.mjs",
  "generate-logos-per-banks.mjs",
  "generate-devicons.mjs",
];

resetComponentRegistry();

for (const script of scripts) {
  console.log(`\n→ ${script}`);
  const result = spawnSync(process.execPath, [join(root, script)], {
    stdio: "inherit",
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log("\n→ generate-registry.mjs");
{
  const result = spawnSync(process.execPath, [join(root, "generate-registry.mjs")], {
    stdio: "inherit",
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log("\n✓ All icon sources generated");
