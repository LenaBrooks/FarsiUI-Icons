/**
 * Scope SVG fragment ids so gradients/clipPaths stay unique when many
 * inline icons share one HTML document (critical on mobile Safari).
 */
export function scopeSvgMarkup(markup: string, scope: string): string {
  if (!markup || (!markup.includes("id=") && !markup.includes("url(#"))) {
    return markup;
  }
  const prefix = `${scope}-`;
  return markup
    .replace(/\bid=(["'])([^"']+)\1/g, (_m, q: string, id: string) => {
      if (id.startsWith(prefix)) return `id=${q}${id}${q}`;
      return `id=${q}${prefix}${id}${q}`;
    })
    .replace(
      /url\((["']?)#([^)"']+)\1\)/g,
      (_m, q: string, id: string) => {
        if (id.startsWith(prefix)) return `url(${q}#${id}${q})`;
        return `url(${q}#${prefix}${id}${q})`;
      },
    )
    .replace(/\bhref=(["'])#([^"']+)\1/g, (_m, q: string, id: string) => {
      if (id.startsWith(prefix)) return `href=${q}#${id}${q}`;
      return `href=${q}#${prefix}${id}${q}`;
    })
    .replace(
      /\bxlink:href=(["'])#([^"']+)\1/g,
      (_m, q: string, id: string) => {
        if (id.startsWith(prefix)) return `xlink:href=${q}#${id}${q}`;
        return `xlink:href=${q}#${prefix}${id}${q}`;
      },
    );
}

/** Sanitize React useId() / any string into a safe SVG id prefix. */
export function svgIdScope(raw: string): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_-]/g, "");
  return cleaned.length > 0 ? cleaned : "i";
}
