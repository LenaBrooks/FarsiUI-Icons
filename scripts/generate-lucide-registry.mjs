/**
 * Builds registry/lucide/ from assets/lucide (SVG + metadata JSON).
 * Separate from brand registry/ — CLI: `npx farsiui-icons add house --lucide`
 */
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const assetsDir = join(root, "assets", "lucide");
const outRoot = join(root, "registry", "lucide");
const outIcons = join(outRoot, "icons");

function pascal(value) {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join("");
}

function nameEnFromId(id) {
  return id
    .split("-")
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

function parseLucideSvg(svg) {
  const viewBox =
    svg.match(/viewBox=["']([^"']+)["']/i)?.[1]?.trim() ?? "0 0 24 24";
  const parts = viewBox.split(/[ ,]+/).map(Number);
  if (parts.length !== 4 || parts.some(Number.isNaN)) {
    throw new Error("SVG is missing a valid viewBox");
  }
  const body = svg
    .replace(/^[\s\S]*?<svg[^>]*>/i, "")
    .replace(/<\/svg>[\s\S]*$/i, "")
    .replace(/<(title|desc)\b[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/\s+/g, " ")
    .replace(/> </g, "><")
    .trim();
  return { viewBox: parts.join(" "), body };
}

await rm(outRoot, { recursive: true, force: true });
await mkdir(outIcons, { recursive: true });

const files = await readdir(assetsDir);
const svgIds = files
  .filter((f) => f.endsWith(".svg"))
  .map((f) => f.replace(/\.svg$/i, ""))
  .sort((a, b) => a.localeCompare(b));

const index = [];
const gallery = [];
let written = 0;
let skipped = 0;

for (const id of svgIds) {
  try {
    const svgText = await readFile(join(assetsDir, `${id}.svg`), "utf8");
    const { viewBox, body } = parseLucideSvg(svgText);

    let tags = [];
    let categories = [];
    try {
      const meta = JSON.parse(
        await readFile(join(assetsDir, `${id}.json`), "utf8"),
      );
      tags = Array.isArray(meta.tags) ? meta.tags : [];
      categories = Array.isArray(meta.categories) ? meta.categories : [];
    } catch {
      // metadata optional
    }

    const componentName = `${pascal(id)}Icon`;
    const nameEn = nameEnFromId(id);
    const file = `icons/${id}.json`;
    const payload = {
      id,
      nameEn,
      componentName,
      tags,
      categories,
      viewBox,
      body,
      strokeWidth: 2,
    };

    await writeFile(join(outRoot, file), JSON.stringify(payload));
    index.push({
      id,
      nameEn,
      componentName,
      tags,
      categories,
      file,
    });
    gallery.push({
      id,
      nameEn,
      componentName,
      tags,
      categories,
      viewBox,
      body,
    });
    written += 1;
  } catch (err) {
    skipped += 1;
    console.warn(`skip ${id}:`, err instanceof Error ? err.message : err);
  }
}

await writeFile(
  join(outRoot, "index.json"),
  JSON.stringify(
    {
      name: "@farsiui/icons/lucide",
      version: 1,
      count: index.length,
      icons: index,
    },
    null,
    2,
  ),
);

// Single file for playground (bodies are tiny stroke paths).
await writeFile(
  join(outRoot, "gallery.json"),
  JSON.stringify({ count: gallery.length, icons: gallery }),
);

console.log(
  `Lucide registry: wrote ${written} icons â†’ ${outRoot}` +
    (skipped ? ` (skipped ${skipped})` : ""),
);
