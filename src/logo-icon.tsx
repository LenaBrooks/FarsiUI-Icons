import { forwardRef, useEffect, useId, useMemo, useState } from "react";
import type { Ref } from "react";
import { categoryDataLoaders } from "./icon-loaders";
import { iconManifest } from "./manifest";
import { scopeSvgMarkup, svgIdScope } from "./scope-svg-ids";
import type { IconProps, IconVariant, IconVariantData } from "./types";

const cache = new Map<string, IconVariantData>();
const pending = new Map<string, Promise<IconVariantData | undefined>>();
let cacheEpoch = 0;
const cacheListeners = new Set<() => void>();

function bumpIconCache(): void {
  cache.clear();
  pending.clear();
  cacheEpoch += 1;
  for (const listener of cacheListeners) listener();
}

/** Drop cached glyphs when Vite HMR reloads generated icon data. */
if (import.meta.hot) {
  import.meta.hot.accept(() => bumpIconCache());
  import.meta.hot.dispose(() => bumpIconCache());
  import.meta.hot.on("vite:beforeUpdate", (payload) => {
    const touched = payload.updates?.some((update) =>
      /\/generated\/.+(?:\/data(?:\/|\.|\.ts)|data\.ts)/.test(update.path),
    );
    if (touched) bumpIconCache();
  });
}

function parseViewBox(viewBox: string): { width: number; height: number } {
  const parts = viewBox.trim().split(/[\s,]+/).map(Number);
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) {
    return { width: 24, height: 24 };
  }
  return { width: parts[2], height: parts[3] };
}

function resolveDimensions(
  props: Pick<IconProps, "size" | "width" | "height">,
  viewBox: string,
): { width: number | string; height: number | string } {
  const { width: vbW, height: vbH } = parseViewBox(viewBox);
  const ratio = vbW / vbH || 1;

  if (props.width != null && props.height != null) {
    return { width: props.width, height: props.height };
  }
  if (props.width != null) {
    const w =
      typeof props.width === "number"
        ? props.width
        : Number.parseFloat(String(props.width));
    if (!Number.isNaN(w)) return { width: props.width, height: w / ratio };
    return { width: props.width, height: props.height ?? props.size ?? vbH };
  }
  if (props.height != null) {
    const h =
      typeof props.height === "number"
        ? props.height
        : Number.parseFloat(String(props.height));
    if (!Number.isNaN(h)) return { width: h * ratio, height: props.height };
    return { width: props.width ?? props.size ?? vbW, height: props.height };
  }

  // `size` is a square box; artwork fits via preserveAspectRatio meet.
  const size = props.size ?? 24;
  return { width: size, height: size };
}

async function loadIconData(id: string): Promise<IconVariantData | undefined> {
  const hit = cache.get(id);
  if (hit) return hit;

  const existing = pending.get(id);
  if (existing) return existing;

  const entry = iconManifest.find((e) => e.id === id);
  if (!entry) return undefined;

  const loader = categoryDataLoaders[entry.category];
  if (!loader) return undefined;

  const promise = loader().then((mod) => {
    for (const [key, value] of Object.entries(mod.data)) {
      cache.set(key, value);
    }
    pending.delete(id);
    return cache.get(id);
  });

  pending.set(id, promise);
  return promise;
}

export interface LogoIconProps extends IconProps {
  /** Catalog id, e.g. `bank-melli` or `aasaam-digikala` */
  name: string;
}

/**
 * Renders any catalog icon by id. Loads category SVG data on demand.
 */
export const LogoIcon = forwardRef(function LogoIcon(
  props: LogoIconProps,
  ref: Ref<SVGSVGElement>,
) {
  const {
    name,
    variant = "color",
    size = 24,
    title,
    className,
    style,
    width: widthProp,
    height: heightProp,
    ...rest
  } = props;

  const [data, setData] = useState<IconVariantData | undefined>(() =>
    cache.get(name),
  );
  const [epoch, setEpoch] = useState(cacheEpoch);
  const scope = svgIdScope(useId());

  useEffect(() => {
    const onBump = () => setEpoch(cacheEpoch);
    cacheListeners.add(onBump);
    return () => {
      cacheListeners.delete(onBump);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const cached = cache.get(name);
    if (cached) {
      setData(cached);
      return;
    }
    void loadIconData(name).then((next) => {
      if (!cancelled) setData(next);
    });
    return () => {
      cancelled = true;
    };
  }, [name, epoch]);

  const glyph =
    data == null
      ? undefined
      : (variant as IconVariant) === "mono"
        ? data.mono
        : data.color;

  const scopedBody = useMemo(() => {
    if (!glyph?.body) return undefined;
    return scopeSvgMarkup(glyph.body, scope);
  }, [glyph?.body, scope]);

  if (!data || !glyph || !scopedBody) {
    return (
      <span
        aria-hidden={title ? undefined : true}
        style={{
          display: "inline-block",
          width: size,
          height: size,
        }}
      />
    );
  }

  const { width, height } = resolveDimensions(
    { size, width: widthProp, height: heightProp },
    glyph.viewBox,
  );
  const isDecorative = title == null || title === "";

  return (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={glyph.viewBox}
      width={width}
      height={height}
      preserveAspectRatio="xMidYMid meet"
      className={className}
      style={style}
      role={isDecorative ? undefined : "img"}
      aria-label={isDecorative ? undefined : title}
      aria-hidden={isDecorative ? true : undefined}
      focusable="false"
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      <g dangerouslySetInnerHTML={{ __html: scopedBody }} />
    </svg>
  );
});

LogoIcon.displayName = "LogoIcon";

/** Preload one category’s SVG payloads into the LogoIcon cache. */
export async function preloadIconCategory(categoryId: string): Promise<void> {
  const loader = categoryDataLoaders[categoryId];
  if (!loader) return;
  const mod = await loader();
  for (const [key, value] of Object.entries(mod.data)) {
    cache.set(key, value);
  }
}

/** Preload every category (use sparingly — large payload). */
export async function preloadAllIconData(): Promise<void> {
  await Promise.all(
    Object.keys(categoryDataLoaders).map((id) => preloadIconCategory(id)),
  );
}
