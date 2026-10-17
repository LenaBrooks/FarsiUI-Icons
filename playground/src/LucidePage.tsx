import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { toFaDigits } from "./fa-digits";
import {
  buildLucideCategories,
  buildLucideSections,
  lucideIcons,
  searchLucideIcons,
  type LucideGalleryIcon,
} from "./lucide-data";
import { VirtualLucideGallery } from "./VirtualLucideGallery";

const PREVIEW_SIZES = [16, 24, 32, 48] as const;
const PREVIEW_FRAME_PX = 120;
/** Match https://lucide.dev/icons/ defaults (size/stroke); color follows theme contrast. */
const DEFAULT_SIZE = 24;
const DEFAULT_STROKE = 2;
const DEFAULT_COLOR_LIGHT = "#000000";
const DEFAULT_COLOR_DARK = "#ffffff";

function defaultLucideColor(): string {
  if (typeof document === "undefined") return DEFAULT_COLOR_DARK;
  return document.documentElement.getAttribute("data-theme") === "light"
    ? DEFAULT_COLOR_LIGHT
    : DEFAULT_COLOR_DARK;
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path
        d="m20 20-3.5-3.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SearchClearIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M18 6 6 18M6 6l12 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CategoriesIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DrawerCloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M18 6 6 18M6 6l12 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="9"
        y="9"
        width="13"
        height="13"
        rx="2"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M5 15V5a2 2 0 0 1 2-2h10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M20 6 9 17l-5-5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ResetIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3 3v5h5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LucideGlyph({
  entry,
  size,
  color,
  strokeWidth = DEFAULT_STROKE,
}: {
  entry: LucideGalleryIcon;
  size: number;
  color?: string;
  strokeWidth?: number;
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
      style={color ? { color } : undefined}
      aria-hidden
      focusable="false"
    >
      <g dangerouslySetInnerHTML={{ __html: entry.body }} />
    </svg>
  );
}

export function LucidePage() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [activeGroup, setActiveGroup] = useState<string | "all">("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tileSize, setTileSize] = useState(DEFAULT_SIZE);
  const [strokeWidth, setStrokeWidth] = useState(DEFAULT_STROKE);
  const [iconColor, setIconColor] = useState(defaultLucideColor);
  const [colorDraft, setColorDraft] = useState(defaultLucideColor);
  const colorCommitTimer = useRef<number | null>(null);
  const [previewSize, setPreviewSize] =
    useState<(typeof PREVIEW_SIZES)[number]>(24);
  const [copiedKind, setCopiedKind] = useState<
    "svg" | "jsx" | "import" | "cli" | null
  >(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const scrollingToRef = useRef(false);
  const pendingScrollRef = useRef<string | "all" | null>(null);
  const [scrollNonce, setScrollNonce] = useState(0);
  const [catDrawerOpen, setCatDrawerOpen] = useState(false);
  const copyTimer = useRef<number | null>(null);

  const themeDefaultColor = defaultLucideColor();
  const isCustomized =
    tileSize !== DEFAULT_SIZE ||
    iconColor !== themeDefaultColor ||
    strokeWidth !== DEFAULT_STROKE;

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQuery(query), 160);
    return () => window.clearTimeout(t);
  }, [query]);

  // Search replaces the long gallery — jump back to top so results are visible.
  useEffect(() => {
    if (!debouncedQuery.trim()) return;
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [debouncedQuery]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === "Escape") {
        setSelectedId(null);
        setCatDrawerOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!catDrawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [catDrawerOpen]);

  const categories = useMemo(() => buildLucideCategories(lucideIcons), []);
  const sections = useMemo(() => buildLucideSections(lucideIcons), []);
  const filtered = useMemo(
    () => searchLucideIcons(lucideIcons, debouncedQuery),
    [debouncedQuery],
  );
  const isSearching = debouncedQuery.trim().length > 0;

  const selected = selectedId
    ? (lucideIcons.find((e) => e.id === selectedId) ?? null)
    : null;

  const previewRenderPx = Math.round((previewSize / 48) * PREVIEW_FRAME_PX);

  const cliLine = selected
    ? `npx farsiui-icons add ${selected.id} --lucide`
    : "";
  const importLine = selected
    ? `import { ${selected.componentName} } from "@/components/lucide/${selected.componentName}";`
    : "";
  const jsxLine = selected
    ? strokeWidth !== DEFAULT_STROKE
      ? `<${selected.componentName} size={${previewSize}} strokeWidth={${strokeWidth}} />`
      : `<${selected.componentName} size={${previewSize}} />`
    : "";

  const flashCopied = (kind: typeof copiedKind) => {
    setCopiedKind(kind);
    if (copyTimer.current) window.clearTimeout(copyTimer.current);
    copyTimer.current = window.setTimeout(() => setCopiedKind(null), 1200);
  };

  const copyCli = async () => {
    if (!cliLine) return;
    if (await copyText(cliLine)) flashCopied("cli");
  };
  const copyImport = async () => {
    if (!importLine) return;
    if (await copyText(importLine)) flashCopied("import");
  };
  const copyJsx = async () => {
    if (!jsxLine) return;
    if (await copyText(jsxLine)) flashCopied("jsx");
  };
  const copySvg = async () => {
    if (!selected) return;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${selected.viewBox}" width="${previewSize}" height="${previewSize}" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">${selected.body}</svg>`;
    if (await copyText(svg)) flashCopied("svg");
  };

  const onColorDraftChange = (value: string) => {
    setColorDraft(value);
    if (colorCommitTimer.current) window.clearTimeout(colorCommitTimer.current);
    colorCommitTimer.current = window.setTimeout(() => {
      setIconColor(value);
    }, 80);
  };

  const flushColorDraft = () => {
    if (colorCommitTimer.current) window.clearTimeout(colorCommitTimer.current);
    setIconColor(colorDraft);
  };

  const resetCustomizer = () => {
    const color = defaultLucideColor();
    setTileSize(DEFAULT_SIZE);
    setStrokeWidth(DEFAULT_STROKE);
    setIconColor(color);
    setColorDraft(color);
  };

  // Keep default contrast when theme flips and user hasn't customized color away from defaults.
  useEffect(() => {
    const onTheme = () => {
      const next = defaultLucideColor();
      setIconColor((prev) =>
        prev === DEFAULT_COLOR_LIGHT || prev === DEFAULT_COLOR_DARK
          ? next
          : prev,
      );
      setColorDraft((prev) =>
        prev === DEFAULT_COLOR_LIGHT || prev === DEFAULT_COLOR_DARK
          ? next
          : prev,
      );
    };
    window.addEventListener("storage", onTheme);
    const mo = new MutationObserver(onTheme);
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => {
      window.removeEventListener("storage", onTheme);
      mo.disconnect();
    };
  }, []);

  const scrollToGroup = (id: string | "all") => {
    // «همه» only scrolls to top; highlight stays on the first category.
    setActiveGroup(id === "all" ? (categories[0]?.id ?? "") : id);
    setQuery("");
    scrollingToRef.current = true;
    pendingScrollRef.current = id;
    setScrollNonce((n) => n + 1);
    setCatDrawerOpen(false);
  };

  const onSelectIcon = useCallback((id: string) => {
    setCopiedKind(null);
    setSelectedId((prev) => (prev === id ? null : id));
  }, []);

  const onActiveGroup = useCallback((id: string) => {
    setActiveGroup(id);
  }, []);

  return (
    <div className="page page-with-sidebar">
      <div
        className="gallery"
        style={{ "--icon-size": `${tileSize}px` } as CSSProperties}
      >
        <div className="sticky-bar">
          <label className="search" dir="rtl" lang="fa">
            <SearchIcon />
            <span className="search-field">
              <input
                ref={searchRef}
                type="search"
                dir="rtl"
                lang="fa"
                placeholder="جستجو"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => {
                  if (window.scrollY > 0) {
                    window.scrollTo({ top: 0, behavior: "auto" });
                  }
                }}
                aria-label="جستجو"
              />
              {query.trim() ? (
                <button
                  type="button"
                  className="search-clear"
                  aria-label="پاک کردن جستجو"
                  title="پاک کردن"
                  onClick={(e) => {
                    e.preventDefault();
                    setQuery("");
                    window.setTimeout(() => searchRef.current?.focus(), 0);
                  }}
                >
                  <SearchClearIcon />
                </button>
              ) : null}
            </span>
            <span className="kbd">Ctrl+K</span>
          </label>
          <button
            type="button"
            className="cat-menu-btn"
            aria-label="دسته‌بندی‌ها"
            aria-expanded={catDrawerOpen}
            aria-controls="lucide-cat-sidebar"
            title="دسته‌بندی‌ها"
            onClick={() => setCatDrawerOpen(true)}
          >
            <CategoriesIcon />
          </button>
        </div>

        <div className="grid-wrap" style={{ color: iconColor }}>
          <VirtualLucideGallery
            sections={sections}
            filtered={filtered}
            isSearching={isSearching}
            tileSize={tileSize}
            strokeWidth={strokeWidth}
            selectedId={selectedId}
            onSelect={onSelectIcon}
            pendingScrollRef={pendingScrollRef}
            scrollNonce={scrollNonce}
            scrollingToRef={scrollingToRef}
            onActiveGroup={onActiveGroup}
          />
        </div>
      </div>

      {catDrawerOpen ? (
        <button
          type="button"
          className="cat-drawer-backdrop"
          aria-label="بستن دسته‌بندی‌ها"
          onClick={() => setCatDrawerOpen(false)}
        />
      ) : null}

      <aside
        id="lucide-cat-sidebar"
        className={`cat-sidebar ${catDrawerOpen ? "is-open" : ""}`}
        aria-label="دسته‌بندی‌ها"
        dir="rtl"
        lang="fa"
      >
        <div className="cat-sidebar-head">
          <h2 className="cat-sidebar-title">دسته‌بندی‌ها</h2>
          <button
            type="button"
            className="cat-sidebar-close"
            aria-label="بستن"
            onClick={() => setCatDrawerOpen(false)}
          >
            <DrawerCloseIcon />
          </button>
        </div>
        <div
          className={`customizer-card lucide-customizer ${isCustomized ? "customized" : ""}`}
          dir="rtl"
          lang="fa"
        >
          <div className="customizer-header">
            <h2 className="customizer-title">شخصی‌سازی</h2>
            <button
              type="button"
              className="customizer-reset"
              disabled={!isCustomized}
              onClick={resetCustomizer}
              aria-label="بازنشانی"
            >
              <ResetIcon />
            </button>
          </div>

          <div className="lucide-field">
            <div className="lucide-field-label">
              <span>رنگ</span>
              <input
                type="color"
                className="customizer-color"
                value={colorDraft}
                onChange={(e) => onColorDraftChange(e.target.value)}
                onBlur={flushColorDraft}
                aria-label="رنگ آیکون"
                title={colorDraft}
              />
            </div>
          </div>

          <div className="lucide-field">
            <div className="lucide-field-label">
              <span>ضخامت خط</span>
              <span className="customizer-value" dir="ltr" lang="en">
                {strokeWidth}px
              </span>
            </div>
            <input
              type="range"
              className="customizer-size-slider"
              min={1}
              max={3}
              step={0.25}
              value={strokeWidth}
              onChange={(e) => setStrokeWidth(Number(e.target.value))}
              aria-label="ضخامت خط"
            />
          </div>

          <div className="lucide-field">
            <div className="lucide-field-label">
              <span>اندازه</span>
              <span className="customizer-value" dir="ltr" lang="en">
                {tileSize}px
              </span>
            </div>
            <input
              type="range"
              className="customizer-size-slider"
              min={16}
              max={48}
              step={1}
              value={tileSize}
              onChange={(e) => setTileSize(Number(e.target.value))}
              aria-label="اندازه آیکون"
            />
          </div>
        </div>

        <div
          className="cat-list cat-list--thin"
          role="listbox"
          aria-label="دسته‌بندی آیکون‌ها"
        >
          <button
            type="button"
            className="cat-row"
            role="option"
            aria-selected={false}
            onClick={() => scrollToGroup("all")}
          >
            <span className="cat-row-label">
              <span className="cat-fa">همه دسته‌ها</span>
            </span>
            <span className="cat-count" dir="rtl" lang="fa">
              {toFaDigits(lucideIcons.length)}
            </span>
          </button>
          {categories.map((g) => (
            <button
              key={g.id}
              type="button"
              className={`cat-row ${activeGroup === g.id && !isSearching ? "active" : ""}`}
              role="option"
              aria-selected={activeGroup === g.id}
              onClick={() => scrollToGroup(g.id)}
            >
              <span className="cat-row-label">
                <span className="cat-fa">{g.label}</span>
              </span>
              <span className="cat-count" dir="rtl" lang="fa">
                {toFaDigits(g.count)}
              </span>
            </button>
          ))}
        </div>
      </aside>

      {selected ? (
        <>
          <button
            type="button"
            className="drawer-backdrop"
            aria-label="بستن جزئیات"
            onClick={() => setSelectedId(null)}
          />
          <section
            className="drawer"
            aria-label={`جزئیات ${selected.nameEn}`}
          >
            <div className="drawer-preview-col">
              <div className="drawer-preview">
                <LucideGlyph
                  entry={selected}
                  size={previewRenderPx}
                  color={iconColor}
                  strokeWidth={strokeWidth}
                />
              </div>
              <div
                className="size-chips"
                role="group"
                aria-label="اندازه خروجی"
                dir="ltr"
                lang="en"
              >
                {PREVIEW_SIZES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={`size-chip ${previewSize === s ? "active" : ""}`}
                    onClick={() => setPreviewSize(s)}
                    aria-pressed={previewSize === s}
                    aria-label={`${s} پیکسل`}
                    title={`${s}px`}
                  >
                    {s}
                  </button>
                ))}
                <span className="size-chips-unit" aria-hidden="true">
                  px
                </span>
              </div>
              <button
                type="button"
                className={`copy-svg-btn confetti-btn ${copiedKind === "svg" ? "animate" : ""}`}
                data-confetti-text="کپی شد"
                onClick={copySvg}
              >
                Copy SVG
              </button>
            </div>

            <div className="drawer-body">
              <div className="drawer-head">
                <div className="drawer-titles">
                  <div className="drawer-title-row">
                    <h2 className="drawer-title" dir="ltr" lang="en">
                      {selected.nameEn}
                    </h2>
                  </div>
                  <p className="drawer-en" dir="ltr" lang="en">
                    {selected.id}
                  </p>
                </div>
                <div className="drawer-head-actions">
                  <button
                    type="button"
                    className="drawer-close"
                    aria-label="بستن"
                    onClick={() => setSelectedId(null)}
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="import-block">
                <button
                  type="button"
                  className={`import-copy confetti-btn ${copiedKind === "cli" ? "animate" : ""}`}
                  data-confetti-text="کپی شد"
                  onClick={copyCli}
                  aria-label={
                    copiedKind === "cli" ? "کپی شد" : "کپی دستور CLI"
                  }
                  title={copiedKind === "cli" ? "کپی شد" : "کپی"}
                >
                  {copiedKind === "cli" ? <CheckIcon /> : <CopyIcon />}
                </button>
                <pre
                  className="import-code"
                  aria-label="دستور CLI"
                  dir="ltr"
                >
                  <code>
                    <span className="tok-kw">npx</span>{" "}
                    <span className="tok-id">farsiui-icons</span>{" "}
                    <span className="tok-kw">add</span>{" "}
                    <span className="tok-str">{selected.id}</span>{" "}
                    <span className="tok-kw">--lucide</span>
                  </code>
                </pre>
              </div>

              <div className="import-block">
                <button
                  type="button"
                  className={`import-copy confetti-btn ${copiedKind === "import" ? "animate" : ""}`}
                  data-confetti-text="کپی شد"
                  onClick={copyImport}
                  aria-label={
                    copiedKind === "import" ? "کپی شد" : "کپی ایمپورت محلی"
                  }
                  title={copiedKind === "import" ? "کپی شد" : "کپی"}
                >
                  {copiedKind === "import" ? <CheckIcon /> : <CopyIcon />}
                </button>
                <pre
                  className="import-code"
                  aria-label="دستور ایمپورت"
                  dir="ltr"
                >
                  <code>
                    <span className="tok-kw">import</span>
                    <span className="tok-punc"> {"{"} </span>
                    <span className="tok-id">{selected.componentName}</span>
                    <span className="tok-punc"> {"}"} </span>
                    <span className="tok-kw">from</span>{" "}
                    <span className="tok-str">
                      {`"@/components/lucide/${selected.componentName}"`}
                    </span>
                    <span className="tok-punc">;</span>
                  </code>
                </pre>
              </div>

              <div className="import-block">
                <button
                  type="button"
                  className={`import-copy confetti-btn ${copiedKind === "jsx" ? "animate" : ""}`}
                  data-confetti-text="کپی شد"
                  onClick={copyJsx}
                  aria-label={
                    copiedKind === "jsx" ? "کپی شد" : "کپی JSX"
                  }
                  title={copiedKind === "jsx" ? "کپی شد" : "کپی"}
                >
                  {copiedKind === "jsx" ? <CheckIcon /> : <CopyIcon />}
                </button>
                <pre
                  className="import-code"
                  aria-label="JSX usage"
                  dir="ltr"
                >
                  <code>
                    <span className="tok-punc">&lt;</span>
                    <span className="tok-id">{selected.componentName}</span>{" "}
                    <span className="tok-kw">size</span>
                    <span className="tok-punc">={"{"}</span>
                    <span className="tok-num">{previewSize}</span>
                    <span className="tok-punc">{"}"}</span>
                    {strokeWidth !== DEFAULT_STROKE ? (
                      <>
                        {" "}
                        <span className="tok-kw">strokeWidth</span>
                        <span className="tok-punc">={"{"}</span>
                        <span className="tok-num">{strokeWidth}</span>
                        <span className="tok-punc">{"}"}</span>
                      </>
                    ) : null}{" "}
                    <span className="tok-punc">/&gt;</span>
                  </code>
                </pre>
              </div>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
