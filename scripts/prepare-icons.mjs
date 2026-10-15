/**
 * Cleans downloaded SVGs and emits JSON modules consumed by icon components.
 */
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const tmp = path.join(root, "_svg_tmp");
const outDir = path.join(root, "src", "svg-data");

fs.mkdirSync(outDir, { recursive: true });

function cleanSvg(svg) {
  let s = svg
    .replace(/<\?xml[\s\S]*?\?>/gi, "")
    .replace(/<!DOCTYPE[\s\S]*?\[[\s\S]*?\]>/gi, "")
    .replace(/<!DOCTYPE[\s\S]*?>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<metadata[\s\S]*?<\/metadata>/gi, "")
    .replace(/\sxmlns:x="[^"]*"/g, "")
    .replace(/\sxmlns:i="[^"]*"/g, "")
    .replace(/\sxmlns:graph="[^"]*"/g, "")
    .replace(/\sxmlns:xlink="[^"]*"/g, "")
    .replace(/\sxml:space="[^"]*"/g, "")
    .replace(/\senable-background="[^"]*"/g, "")
    .replace(/\sx="[^"]*"/g, "")
    .replace(/\sy="[^"]*"/g, "")
    .replace(/\sversion="[^"]*"/g, "")
    .replace(/\sid="[^"]*"/g, "")
    .replace(/\sstyle="enable-background:[^"]*"/g, "");

  const viewBoxMatch = s.match(/viewBox=["']([^"']+)["']/i);
  const viewBox = viewBoxMatch ? viewBoxMatch[1].trim() : "0 0 24 24";

  const open = s.search(/<svg\b[^>]*>/i);
  const close = s.lastIndexOf("</svg>");
  if (open === -1 || close === -1) {
    throw new Error("No svg root");
  }
  const openEnd = s.indexOf(">", open) + 1;
  let inner = s.slice(openEnd, close).trim();

  // Move <style> class fills into inline where simple .stN{fill:#...}
  const styleMatch = inner.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
  if (styleMatch) {
    const style = styleMatch[1];
    const classFills = [...style.matchAll(/\.(\w+)\s*\{[^}]*fill:\s*([^;}]+)[^}]*\}/g)];
    for (const [, cls, fill] of classFills) {
      const re = new RegExp(`class=["']${cls}["']`, "g");
      inner = inner.replace(re, `fill="${fill.trim()}"`);
    }
    // also handle fill-rule in class
    const classRules = [
      ...style.matchAll(/\.(\w+)\s*\{([^}]*)\}/g),
    ];
    for (const [, cls, body] of classRules) {
      const attrs = [];
      const fill = body.match(/fill:\s*([^;}]+)/);
      const fillRule = body.match(/fill-rule:\s*([^;}]+)/);
      const clipRule = body.match(/clip-rule:\s*([^;}]+)/);
      if (fill) attrs.push(`fill="${fill[1].trim()}"`);
      if (fillRule) attrs.push(`fill-rule="${fillRule[1].trim()}"`);
      if (clipRule) attrs.push(`clip-rule="${clipRule[1].trim()}"`);
      if (attrs.length) {
        inner = inner.replace(
          new RegExp(`class=["']${cls}["']`, "g"),
          attrs.join(" "),
        );
      }
    }
    inner = inner.replace(/<style[\s\S]*?<\/style>/gi, "");
  }

  // Drop empty <defs></defs> leftover noise if any — keep real defs/gradients
  inner = inner.replace(/\n{3,}/g, "\n\n").trim();

  return { viewBox, inner };
}

const sources = {
  "bank-melli": "melli-wc.svg",
  "bank-mellat": "mellat-wc.svg",
  digikala: "digikala-wc.svg",
  snapp: "snapp-wc.svg",
  irancell: "irancell-official.svg",
  aparat: "aparat-simple.svg",
};

for (const [id, file] of Object.entries(sources)) {
  const raw = fs.readFileSync(path.join(tmp, file), "utf8");
  if (raw.trimStart().startsWith("<!DOCTYPE html") || raw.trimStart().startsWith("<html")) {
    console.error(`SKIP ${id}: not an SVG`);
    continue;
  }
  const cleaned = cleanSvg(raw);
  // For aparat simple-icons, strip title (we inject via props)
  cleaned.inner = cleaned.inner.replace(/<title>[\s\S]*?<\/title>/gi, "").trim();
  const outPath = path.join(outDir, `${id}.ts`);
  const content = `/* Auto-generated from ${_svgSourceNote(id, file)} — do not hand-edit geometry */\nexport const viewBox = ${JSON.stringify(cleaned.viewBox)} as const;\nexport const markup = ${JSON.stringify(cleaned.inner)};\n`;
  fs.writeFileSync(outPath, content, "utf8");
  console.log(`Wrote ${id}: viewBox=${cleaned.viewBox} bytes=${cleaned.inner.length}`);
}

function _svgSourceNote(id, file) {
  return `${file}`;
}
