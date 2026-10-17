/**
 * One-shot: lift dark fills for dark-UI visibility (plan: lighten_dark_icons).
 */
import { readFileSync, writeFileSync } from "node:fs";

const MAP = [
  ["#002786", "#254A80"],
  ["#002781", "#254A80"],
  ["#02029A", "#2A3DB8"],
  ["#0031B6", "#2A52D4"],
  ["#2E368F", "#4A52B0"],
  ["#2A2468", "#4A4488"],
  ["#22203A", "#4A4488"],
  ["#38386C", "#5A5A90"],
  ["#011E3F", "#1A3A6A"],
  ["#002A68", "#2A5A9A"],
  ["#155A73", "#2A7A98"],
  ["#1565C0", "#3A7FD0"],
  ["#010101", "#4A4A4A"],
  ["#070707", "#4A4A4A"],
  ["#040505", "#4A4A4A"],
  ["#1E1E1E", "#4A4A4A"],
  ["#212121", "#4A4A4A"],
  ["#000000", "#4A4A4A"],
  ["#3A3A3A", "#6B6B6B"],
  ["#525254", "#6B6B6B"],
  ["#555254", "#6B6B6B"],
  ["#555555", "#6B6B6B"],
];

function lift(text) {
  let out = text;
  out = out.replace(/fill=(["'])black\1/gi, "fill=$1#4A4A4A$1");
  out = out.replace(/stroke=(["'])black\1/gi, "stroke=$1#4A4A4A$1");
  // #111 but not part of longer hex
  out = out.replace(/#111(?![0-9A-Fa-f])/gi, "#4A4A4A");
  for (const [from, to] of MAP) {
    out = out.replaceAll(new RegExp(from, "gi"), to);
  }
  return out;
}

function update(path) {
  const before = readFileSync(path, "utf8");
  const after = lift(before);
  if (before === after) {
    console.log("unchanged", path);
    return false;
  }
  writeFileSync(path, after);
  console.log("updated", path);
  return true;
}

const files = [
  // persian-labs
  "assets/persian-labs/household-appliances/color/emersan.svg",
  "assets/persian-labs/household-appliances/color/daewoo.svg",
  "assets/persian-labs/household-appliances/color/dipoint.svg",
  "assets/persian-labs/household-appliances/color/kachiran.svg",
  "assets/persian-labs/household-appliances/color/himalia.svg",
  "assets/persian-labs/detergent-hygiene/color/ave.svg",
  "assets/persian-labs/fashion-clothing/color/patan-jame.svg",
  "assets/persian-labs/fashion-clothing/color/gerad.svg",
  "assets/persian-labs/fashion-clothing/color/majid.svg",
  "assets/persian-labs/business-chain-stores/color/kourosh-mall.svg",
  "assets/persian-labs/automobiles/color/niromotor.svg",
  "assets/persian-labs/automobiles/color/kerman-motor.svg",
  "assets/persian-labs/media-news/color/patttern.svg",
  "assets/persian-labs/organization-departments/color/miras-farhangi.svg",
  "assets/persian-labs/organization-departments/color/amuzesh-parvaresh.svg",
  "scripts/data/brand-colors-retail.json",
  "scripts/data/brand-colors-org.json",
  // manual
  "assets/manual/salamat-news.svg",
  "assets/manual/ahan-online.svg",
  "assets/manual/arz-digital.svg",
  "assets/manual/amadast.svg",
  "assets/manual/last-second.svg",
  "assets/manual/learn-files.svg",
  // crypto
  "assets/crypto/zrx.svg",
  "assets/crypto/skl.svg",
  "assets/crypto/fet.svg",
  "assets/crypto/egld.svg",
  "assets/crypto/near.svg",
  "assets/crypto/qnt.svg",
  "assets/crypto/hbar.svg",
  "assets/crypto/gala.svg",
  "assets/crypto/audio.svg",
  "assets/crypto/ftm.svg",
  "assets/crypto/dot.svg",
  "assets/crypto/cro.svg",
];

let n = 0;
for (const f of files) {
  try {
    if (update(f)) n += 1;
  } catch (err) {
    console.error("fail", f, err.message);
  }
}
console.log(`done: ${n} files changed`);
