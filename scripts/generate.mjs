import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const scripts = [
  "generate-persian-labs.mjs",
  "generate-aasaam.mjs",
  "generate-persian-simple-icons.mjs",
  "generate-logos-per-service.mjs",
  "generate-logos-per-banks.mjs",
  "generate-devicons.mjs",
  "generate-crypto.mjs",
  "generate-manual.mjs",
];

for (const script of scripts) {
  console.log(`\n→ ${script}`);
  const result = spawnSync(process.execPath, [join(root, script)], {
    stdio: "inherit",
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log("\n✓ All icon sources generated");
