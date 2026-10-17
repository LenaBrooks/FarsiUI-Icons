import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { useWindowRowVirtualizer } from "./use-window-row-virtualizer";
import type { LucideGalleryIcon } from "./lucide-data";

const GRID_GAP = 8;
const TILE_EXTRA = 20;
const HEADER_ROW_H = 44;

type HeaderRow = {
  kind: "header";
  groupId: string;
  label: string;
};

type IconsRow = {
  kind: "icons";
  icons: LucideGalleryIcon[];
};

type GalleryRow = HeaderRow | IconsRow;

export type LucideSection = {
  id: string;
  label: string;
  icons: LucideGalleryIcon[];
};

function LucideGlyph({
  entry,
  size,
  strokeWidth,
}: {
  entry: LucideGalleryIcon;
  size: number;
  strokeWidth: number;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={entry.viewBox}
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      focusable="false"
    >
      <g dangerouslySetInnerHTML={{ __html: entry.body }} />
    </svg>
  );
}

const IconTile = memo(function IconTile({
  entry,
  active,
  tileSize,
  strokeWidth,
  onSelect,
}: {
  entry: LucideGalleryIcon;
  active: boolean;
  tileSize: number;
  strokeWidth: number;
  onSelect: (id: string) => void;
}) {
  return (
    <button
      type="button"
      className={`tile ${active ? "active" : ""}`}
      onClick={() => onSelect(entry.id)}
      aria-label={entry.nameEn}
      aria-pressed={active}
    >
      <span className="tile-icon">
        <LucideGlyph entry={entry} size={tileSize} strokeWidth={strokeWidth} />
      </span>
      <span className="tile-tip">{entry.nameEn}</span>
    </button>
  );
});

function chunkIcons(
  icons: LucideGalleryIcon[],
  columns: number,
): LucideGalleryIcon[][] {
  if (columns < 1) return [icons];
  const rows: LucideGalleryIcon[][] = [];
  for (let i = 0; i < icons.length; i += columns) {
    rows.push(icons.slice(i, i + columns));
  }
  return rows;
}

function buildRows(
  sections: LucideSection[],
  flatIcons: LucideGalleryIcon[] | null,
  columns: number,
  searching: boolean,
): { rows: GalleryRow[]; groupRowIndex: Map<string, number> } {
  const groupRowIndex = new Map<string, number>();
  const rows: GalleryRow[] = [];

  if (searching) {
    for (const chunk of chunkIcons(flatIcons ?? [], columns)) {
      rows.push({ kind: "icons", icons: chunk });
    }
    return { rows, groupRowIndex };
  }

  for (const section of sections) {
    groupRowIndex.set(section.id, rows.length);
    rows.push({
      kind: "header",
      groupId: section.id,
      label: section.label,
    });
    for (const chunk of chunkIcons(section.icons, columns)) {
      rows.push({ kind: "icons", icons: chunk });
    }
  }
  return { rows, groupRowIndex };
}

export type VirtualLucideGalleryProps = {
  sections: LucideSection[];
  filtered: LucideGalleryIcon[];
  isSearching: boolean;
  tileSize: number;
  strokeWidth: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  pendingScrollRef: React.MutableRefObject<string | "all" | null>;
  scrollNonce: number;
  scrollingToRef: React.MutableRefObject<boolean>;
  onActiveGroup: (id: string | "all") => void;
};

export function VirtualLucideGallery({
  sections,
  filtered,
  isSearching,
  tileSize,
  strokeWidth,
  selectedId,
  onSelect,
  pendingScrollRef,
  scrollNonce,
  scrollingToRef,
  onActiveGroup,
}: VirtualLucideGalleryProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(800);
  const [scrollMargin, setScrollMargin] = useState(0);
  const [scrollPaddingStart, setScrollPaddingStart] = useState(72);

  const tileBox = tileSize + TILE_EXTRA;
  const columns = Math.max(
    1,
    Math.floor((width + GRID_GAP) / (tileBox + GRID_GAP)),
  );

  const { rows, groupRowIndex } = useMemo(
    () =>
      buildRows(
        sections,
        isSearching ? filtered : null,
        columns,
        isSearching,
      ),
    [sections, filtered, columns, isSearching],
  );

  const estimateSize = useCallback(
    (index: number) => {
      const row = rows[index];
      if (!row) return tileBox + GRID_GAP;
      if (row.kind === "header") return HEADER_ROW_H;
      return tileBox + GRID_GAP;
    },
    [rows, tileBox],
  );

  const measureChrome = useCallback(() => {
    const nav = document.querySelector(".site-nav") as HTMLElement | null;
    const sticky = document.querySelector(".sticky-bar") as HTMLElement | null;
    setScrollPaddingStart(
      (nav?.offsetHeight ?? 64) + (sticky?.offsetHeight ?? 0) + 8,
    );
    const el = listRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setScrollMargin(rect.top + window.scrollY);
    setWidth(el.clientWidth || 800);
  }, []);

  useLayoutEffect(() => {
    measureChrome();
  }, [measureChrome, tileSize, isSearching, rows.length]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => measureChrome());
    ro.observe(el);
    window.addEventListener("resize", measureChrome);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measureChrome);
    };
  }, [measureChrome]);

  const virtualizer = useWindowRowVirtualizer({
    count: rows.length,
    estimateSize,
    overscan: 8,
    scrollMargin,
    scrollPaddingStart,
  });

  const virtualItems = virtualizer.getVirtualItems();
  const visibleRangeKey = `${virtualItems[0]?.index ?? 0}-${virtualItems[virtualItems.length - 1]?.index ?? 0}`;

  useEffect(() => {
    if (scrollNonce === 0) return;
    if (isSearching) return;
    const pending = pendingScrollRef.current;
    if (pending == null) return;
    pendingScrollRef.current = null;

    const run = () => {
      if (pending === "all") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        const idx = groupRowIndex.get(pending);
        if (idx != null) {
          virtualizer.scrollToIndex(idx, {
            align: "start",
            behavior: "smooth",
          });
        }
      }
      window.setTimeout(() => {
        scrollingToRef.current = false;
      }, 800);
    };
    requestAnimationFrame(run);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollNonce]);

  useEffect(() => {
    if (isSearching || !listRef.current) return;
    const root = listRef.current;
    const nodes = [
      ...root.querySelectorAll<HTMLElement>("[data-group-section]"),
    ];
    if (!nodes.length) return;
    const firstId = sections[0]?.id;
    const TOP_EPS = 64;
    const stickyY = 120;
    let raf = 0;
    let lastId: string | null = null;

    const setActive = (id: string) => {
      if (id === lastId) return;
      lastId = id;
      onActiveGroup(id);
    };

    const pick = () => {
      if (scrollingToRef.current) return;
      if (window.scrollY <= TOP_EPS) {
        if (firstId) setActive(firstId);
        return;
      }
      let chosen: HTMLElement | null = null;
      for (const el of nodes) {
        if (el.getBoundingClientRect().top <= stickyY) chosen = el;
      }
      if (!chosen) chosen = nodes[0] ?? null;
      const id = chosen?.dataset.groupSection;
      if (id) setActive(id);
    };

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(pick);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    pick();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, [
    isSearching,
    onActiveGroup,
    scrollingToRef,
    visibleRangeKey,
    sections,
  ]);

  if (isSearching && filtered.length === 0) {
    return (
      <p className="empty" dir="rtl" lang="fa">
        هیچ آیکونی با این جستجو پیدا نشد.
      </p>
    );
  }

  return (
    <div
      ref={listRef}
      className="virtual-gallery"
      style={
        {
          height: virtualizer.getTotalSize(),
          position: "relative",
          width: "100%",
        } as CSSProperties
      }
    >
      {virtualItems.map((vRow) => {
        const row = rows[vRow.index];
        if (!row) return null;
        const style: CSSProperties = {
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: vRow.size,
          transform: `translateY(${vRow.start}px)`,
        };

        if (row.kind === "header") {
          return (
            <div
              key={`h-${row.groupId}`}
              className="virtual-row virtual-row-header"
              style={style}
              id={`lucide-group-${row.groupId}`}
              data-group-section={row.groupId}
            >
              <h2
                className="icon-section-title"
                dir="rtl"
                lang="fa"
                id={`lucide-group-heading-${row.groupId}`}
              >
                {row.label}
              </h2>
            </div>
          );
        }

        return (
          <div
            key={`r-${vRow.index}`}
            className="virtual-row virtual-row-icons grid"
            style={style}
          >
            {row.icons.map((entry) => (
              <IconTile
                key={entry.id}
                entry={entry}
                active={entry.id === selectedId}
                tileSize={tileSize}
                strokeWidth={strokeWidth}
                onSelect={onSelect}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}
