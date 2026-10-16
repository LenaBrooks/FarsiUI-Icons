import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = readFileSync(join(root, "src/generated/aasaam/data.ts"), "utf8");
const json = src.slice(src.indexOf("{"), src.lastIndexOf("}") + 1);
const data = JSON.parse(json);
const e = data["aasaam-snapp"];
const out = e
  ? {
      colorVb: e.color.viewBox,
      monoVb: e.mono.viewBox,
      colorBodyHead: e.color.body.slice(0, 300),
      monoBodyHead: e.mono.body.slice(0, 300),
    }
  : "MISSING";
writeFileSync(join(root, "scripts/_tmp-snapp-peek.txt"), JSON.stringify(out, null, 2));
