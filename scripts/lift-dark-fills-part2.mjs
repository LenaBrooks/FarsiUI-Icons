import { readFileSync, writeFileSync } from "node:fs";

const map = [
  ["#070707", "#4A4A4A"],
  ["#212121", "#4A4A4A"],
  ["#38386C", "#5A5A90"],
  ["#1565C0", "#3A7FD0"],
  ["#0031B6", "#2A52D4"],
];

function applyMap(text) {
  let out = text;
  for (const [from, to] of map) {
    out = out.replaceAll(new RegExp(from, "gi"), to);
  }
  return out;
}

function update(path) {
  const before = readFileSync(path, "utf8");
  const after = applyMap(before);
  if (before === after) {
    console.log("unchanged", path);
    return;
  }
  writeFileSync(path, after);
  console.log("updated", path);
}

update("scripts/data/brand-colors-brands.json");
update("scripts/generate-aasaam.mjs");

const cryptos = ["zrx", "skl", "fet", "egld", "near", "qnt", "hbar", "gala"];
for (const id of cryptos) {
  const p = `assets/crypto/${id}.svg`;
  let s = readFileSync(p, "utf8");
  if (/fill=/.test(s)) {
    console.log("skip has fill", id);
    continue;
  }
  const next = s.replace(/<path\b(?![^>]*\bfill=)/gi, '<path fill="#4A4A4A"');
  if (next !== s) {
    writeFileSync(p, next);
    console.log("crypto fill added", id);
  } else {
    console.log("crypto no path", id);
  }
}
