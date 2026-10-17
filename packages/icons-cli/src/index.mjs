#!/usr/bin/env node
/**
 * @farsiui/icons-cli — copy icon components into your project from the GitHub registry.
 *
 *   npx @farsiui/icons-cli add bank-melli
 *   npx @farsiui/icons-cli add bank-melli --out src/components/icons
 */
import { mkdir, writeFile, access } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { renderIconTsx } from "./render-icon-tsx.mjs";

const DEFAULT_REGISTRY =
  process.env.FARSUI_ICONS_REGISTRY ??
  "https://cdn.jsdelivr.net/gh/farsiui/icons@main/registry";

async function defaultOutDir(cwd = process.cwd()) {
  // Prefer src/ when the project already has it; otherwise keep icons at root.
  if (await fileExists(join(cwd, "src"))) {
    return "src/components/icons";
  }
  return "components/icons";
}

function printHelp() {
  console.log(`Usage:
  npx @farsiui/icons-cli add <id-or-name> [id...] [options]

Options:
  --out <dir>         Output directory
                      (default: src/components/icons if ./src exists,
                       otherwise components/icons)
  --registry <url>    Registry base URL (default: jsDelivr GitHub)
  --force             Overwrite existing files
  -h, --help          Show help

Examples:
  npx @farsiui/icons-cli add bank-melli
  npx @farsiui/icons-cli add BankMelliIcon website-digikala --out ./icons
`);
}

function parseArgs(argv) {
  const args = argv.slice(2);
  if (args.length === 0 || args.includes("-h") || args.includes("--help")) {
    return { help: true };
  }
  const cmd = args[0];
  const ids = [];
  let out = null;
  let registry = DEFAULT_REGISTRY;
  let force = false;
  for (let i = 1; i < args.length; i += 1) {
    const a = args[i];
    if (a === "--out") {
      out = args[++i];
      continue;
    }
    if (a === "--registry") {
      registry = args[++i];
      continue;
    }
    if (a === "--force") {
      force = true;
      continue;
    }
    if (a.startsWith("-")) {
      throw new Error(`Unknown option: ${a}`);
    }
    ids.push(a);
  }
  return { help: false, cmd, ids, out, registry, force };
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }
  return res.json();
}

async function fileExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function isLocalRegistry(base) {
  return (
    base.startsWith("file:") ||
    base.startsWith(".") ||
    base.startsWith("/") ||
    /^[A-Za-z]:[\\/]/.test(base)
  );
}

function resolveRegistryDir(base) {
  if (base.startsWith("file:")) return fileURLToPath(base);
  return resolve(base);
}

async function loadIndex(registry) {
  const base = registry.replace(/\/$/, "");
  if (isLocalRegistry(base)) {
    const { readFile } = await import("node:fs/promises");
    return JSON.parse(
      await readFile(join(resolveRegistryDir(base), "index.json"), "utf8"),
    );
  }
  return fetchJson(`${base}/index.json`);
}

async function loadIcon(registry, file) {
  const base = registry.replace(/\/$/, "");
  if (isLocalRegistry(base)) {
    const { readFile } = await import("node:fs/promises");
    return JSON.parse(
      await readFile(join(resolveRegistryDir(base), file), "utf8"),
    );
  }
  return fetchJson(`${base}/${file}`);
}

function resolveEntry(index, query) {
  const q = query.trim();
  return (
    index.icons.find(
      (e) =>
        e.id === q ||
        e.componentName === q ||
        e.componentName.toLowerCase() === q.toLowerCase(),
    ) ?? null
  );
}

async function addIcons({ ids, out, registry, force }) {
  if (ids.length === 0) {
    throw new Error("Pass at least one icon id (e.g. bank-melli)");
  }

  const resolvedOut = out ?? (await defaultOutDir());
  console.log(`Registry: ${registry}`);
  console.log(`Output: ${resolvedOut}`);
  const index = await loadIndex(registry);
  const outDir = resolve(resolvedOut);
  await mkdir(outDir, { recursive: true });

  for (const query of ids) {
    const entry = resolveEntry(index, query);
    if (!entry) {
      console.error(`✗ Not found: ${query}`);
      process.exitCode = 1;
      continue;
    }
    const icon = await loadIcon(registry, entry.file);
    const fileName = `${icon.componentName}.tsx`;
    const target = join(outDir, fileName);
    if (!force && (await fileExists(target))) {
      console.error(`✗ Exists (use --force): ${target}`);
      process.exitCode = 1;
      continue;
    }
    const source = renderIconTsx(icon);
    await writeFile(target, source, "utf8");
    console.log(`✓ ${icon.componentName} → ${target}`);
  }
}

async function main() {
  let opts;
  try {
    opts = parseArgs(process.argv);
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  }

  if (opts.help) {
    printHelp();
    return;
  }

  if (opts.cmd !== "add") {
    console.error(`Unknown command: ${opts.cmd}`);
    printHelp();
    process.exit(1);
  }

  try {
    await addIcons(opts);
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  }
}

main();
