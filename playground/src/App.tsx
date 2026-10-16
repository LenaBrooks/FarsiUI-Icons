import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  LogoIcon,
  displayGroups,
  getDisplayGroupId,
  getDisplayGroupMeta,
  iconManifest,
  preloadAllIconData,
  type DisplayGroupId,
  type IconManifestEntry,
  type IconVariant,
} from "@farsiui/icons";
import { toFaDigits } from "./fa-digits";
import { GuidePage } from "./GuidePage";
import { PackagesPage } from "./PackagesPage";
import { entryMatchesQuery } from "./search";

type PageId = "icons" | "guide" | "packages";

const NAV_LINKS: Array<{ label: string; page: PageId }> = [
  { label: "Icons", page: "icons" },
  { label: "Guide", page: "guide" },
  { label: "Packages", page: "packages" },
];

const PREVIEW_SIZES = [16, 24, 32, 48] as const;
/** Drawer stage size in px; `48` fills this box completely. */
const PREVIEW_FRAME_PX = 128;

const CUSTOMIZER_DEFAULTS = {
  size: 28,
  variant: "color" as IconVariant,
  color: "#a1a1aa",
};

const COLOR_COMMIT_MS = 180;

function normalizeCustomizerColor(value: unknown): string {
  if (typeof value !== "string" || !value || value === "currentColor") {
    return CUSTOMIZER_DEFAULTS.color;
  }
  return /^#[0-9a-fA-F]{6}$/.test(value) ? value : CUSTOMIZER_DEFAULTS.color;
}

function readStoredCustomizer(): typeof CUSTOMIZER_DEFAULTS {
  try {
    const raw = window.localStorage.getItem("farsiui-icons-customizer");
    if (!raw) return { ...CUSTOMIZER_DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<typeof CUSTOMIZER_DEFAULTS>;
    return {
      size:
        typeof parsed.size === "number" && parsed.size >= 16 && parsed.size <= 64
          ? parsed.size
          : CUSTOMIZER_DEFAULTS.size,
      variant: parsed.variant === "mono" ? "mono" : "color",
      color: normalizeCustomizerColor(parsed.color),
    };
  } catch {
    return { ...CUSTOMIZER_DEFAULTS };
  }
}

function pageFromHash(): PageId {
  const h = window.location.hash.replace(/^#\/?/, "").toLowerCase();
  if (h === "guide" || h === "packages" || h === "icons") return h;
  return "icons";
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

const REPO_URL = "https://github.com/MiladJoodi/FarsiUI-Icons";
const REPO_API = "https://api.github.com/repos/MiladJoodi/FarsiUI-Icons";

function GitHubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2C6.477 2 2 6.486 2 12.021c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.009-.866-.013-1.7-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.467-1.11-1.467-.908-.621.069-.608.069-.608 1.004.071 1.532 1.032 1.532 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.339-2.22-.253-4.555-1.113-4.555-4.952 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.56 9.56 0 0 1 12 6.844a9.56 9.56 0 0 1 2.504.337c1.909-1.296 2.747-1.026 2.747-1.026.546 1.378.203 2.397.1 2.65.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.944.359.31.678.92.678 1.855 0 1.338-.012 2.419-.012 2.749 0 .268.18.58.688.481A10.02 10.02 0 0 0 22 12.021C22 6.486 17.523 2 12 2Z" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path
        d="M20 20l-3.5-3.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg
      className="nav-theme-icon"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.4 5.4l1.55 1.55M17.05 17.05l1.55 1.55M5.4 18.6l1.55-1.55M17.05 6.95l1.55-1.55"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      className="nav-theme-icon"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        d="M20.2 14.1A7.8 7.8 0 0 1 9.9 3.8 8.4 8.4 0 1 0 20.2 14.1Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 7h16M4 12h16M4 17h16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
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
        d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
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

function ExternalLinkIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M14 4h6v6M20 4 10 14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Persian/Arabic script → show FA title + EN subtitle; else EN only. */
function hasPersianScript(value: string): boolean {
  return /[\u0600-\u06FF]/.test(value);
}

export function App() {
  const [page, setPage] = useState<PageId>(() => pageFromHash());
  const [query, setQuery] = useState("");
  /** Highlights sidebar + scroll target; does not filter the grid. */
  const [activeGroup, setActiveGroup] = useState<DisplayGroupId | "all">(
    "all",
  );
  const [customizer, setCustomizer] = useState(readStoredCustomizer);
  const variant = customizer.variant;
  const tileSize = customizer.size;
  const iconColor = customizer.color;
  /** Local draft so the color picker stays snappy; gallery commits after debounce. */
  const [colorDraft, setColorDraft] = useState(iconColor);
  const colorCommitTimer = useRef<number | null>(null);
  const [previewSize, setPreviewSize] =
    useState<(typeof PREVIEW_SIZES)[number]>(48);
  const previewRenderPx = Math.round(
    (previewSize / 48) * PREVIEW_FRAME_PX,
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [navOpen, setNavOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    const saved = window.localStorage.getItem("farsiui-icons-theme");
    return saved === "light" || saved === "dark" ? saved : "dark";
  });
  const [copiedKind, setCopiedKind] = useState<"svg" | "jsx" | "import" | null>(
    null,
  );
  const [usageCopied, setUsageCopied] = useState<"install" | "import" | null>(
    null,
  );
  const [starCount, setStarCount] = useState<number | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const copyTimer = useRef<number | null>(null);
  const scrollingToRef = useRef(false);
  const pendingScrollRef = useRef<DisplayGroupId | "all" | null>(null);
  const [scrollNonce, setScrollNonce] = useState(0);

  const go = (next: PageId) => {
    setPage(next);
    setNavOpen(false);
    setSelectedId(null);
    const hash = next === "icons" ? "#icons" : `#${next}`;
    if (window.location.hash !== hash) {
      window.history.pushState(null, "", hash);
    }
  };

  useEffect(() => {
    const onHash = () => setPage(pageFromHash());
    window.addEventListener("hashchange", onHash);
    if (!window.location.hash) {
      window.history.replaceState(null, "", "#icons");
    }
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(REPO_API, {
          headers: { Accept: "application/vnd.github+json" },
        });
        if (!res.ok) return;
        const data = (await res.json()) as { stargazers_count?: number };
        if (!cancelled && typeof data.stargazers_count === "number") {
          setStarCount(data.stargazers_count);
        }
      } catch {
        /* ignore network errors */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    return iconManifest.filter((entry) => entryMatchesQuery(entry, query));
  }, [query]);

  const sections = useMemo(() => {
    const byGroup = new Map<DisplayGroupId, IconManifestEntry[]>();
    for (const entry of filtered) {
      const gid = getDisplayGroupId(entry);
      const list = byGroup.get(gid);
      if (list) list.push(entry);
      else byGroup.set(gid, [entry]);
    }
    return displayGroups
      .map((g) => ({
        id: g.id,
        labelFa: g.labelFa,
        icons: byGroup.get(g.id) ?? [],
      }))
      .filter((s) => s.icons.length > 0);
  }, [filtered]);

  const groupCounts = useMemo(() => {
    const counts = new Map<DisplayGroupId, number>();
    for (const entry of iconManifest) {
      const gid = getDisplayGroupId(entry);
      counts.set(gid, (counts.get(gid) ?? 0) + 1);
    }
    return counts;
  }, []);

  const visibleGroups = useMemo(() => {
    return displayGroups.filter((g) => (groupCounts.get(g.id) ?? 0) > 0);
  }, [groupCounts]);

  const totalVisible = iconManifest.length;

  const isSearching = query.trim().length > 0;

  const activeGroupLabel = isSearching
    ? "نتایج"
    : activeGroup === "all"
      ? "همه"
      : (getDisplayGroupMeta(activeGroup)?.labelFa ?? activeGroup);

  const isCustomized =
    customizer.size !== CUSTOMIZER_DEFAULTS.size ||
    customizer.variant !== CUSTOMIZER_DEFAULTS.variant ||
    customizer.color !== CUSTOMIZER_DEFAULTS.color;

  const selected: IconManifestEntry | undefined = selectedId
    ? iconManifest.find((e) => e.id === selectedId)
    : undefined;

  const flashCopied = (kind: "svg" | "jsx" | "import") => {
    if (copyTimer.current != null) {
      window.clearTimeout(copyTimer.current);
    }
    setCopiedKind(kind);
    copyTimer.current = window.setTimeout(() => setCopiedKind(null), 1200);
  };

  function scrollToGroup(id: DisplayGroupId | "all") {
    // Clear search so section anchors exist again.
    if (query.trim()) setQuery("");
    setActiveGroup(id);
    scrollingToRef.current = true;
    pendingScrollRef.current = id;
    setScrollNonce((n) => n + 1);
  }

  function updateCustomizer(patch: Partial<typeof CUSTOMIZER_DEFAULTS>) {
    setCustomizer((prev) => ({ ...prev, ...patch }));
  }

  function commitIconColor(next: string) {
    const color = normalizeCustomizerColor(next);
    setColorDraft(color);
    setCustomizer((prev) =>
      prev.color === color ? prev : { ...prev, color },
    );
  }

  function onColorDraftChange(next: string) {
    setColorDraft(next);
    if (colorCommitTimer.current != null) {
      window.clearTimeout(colorCommitTimer.current);
    }
    colorCommitTimer.current = window.setTimeout(() => {
      colorCommitTimer.current = null;
      commitIconColor(next);
    }, COLOR_COMMIT_MS);
  }

  function flushColorDraft() {
    if (colorCommitTimer.current != null) {
      window.clearTimeout(colorCommitTimer.current);
      colorCommitTimer.current = null;
    }
    commitIconColor(colorDraft);
  }

  function resetCustomizer() {
    if (colorCommitTimer.current != null) {
      window.clearTimeout(colorCommitTimer.current);
      colorCommitTimer.current = null;
    }
    setColorDraft(CUSTOMIZER_DEFAULTS.color);
    setCustomizer({ ...CUSTOMIZER_DEFAULTS });
  }

  useEffect(() => {
    setColorDraft(iconColor);
  }, [iconColor]);

  useEffect(() => {
    return () => {
      if (colorCommitTimer.current != null) {
        window.clearTimeout(colorCommitTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      window.localStorage.setItem("farsiui-icons-theme", theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  // Tab discard / bfcache restore can remount without re-running the HTML boot script.
  useEffect(() => {
    const syncTheme = () => {
      try {
        const saved = window.localStorage.getItem("farsiui-icons-theme");
        if (saved === "light" || saved === "dark") {
          setTheme((prev) => (prev === saved ? prev : saved));
          document.documentElement.dataset.theme = saved;
        }
      } catch {
        /* ignore */
      }
    };
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) syncTheme();
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") syncTheme();
    };
    window.addEventListener("pageshow", onPageShow);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("pageshow", onPageShow);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        "farsiui-icons-customizer",
        JSON.stringify(customizer),
      );
    } catch {
      /* ignore */
    }
  }, [customizer]);

  useEffect(() => {
    return () => {
      if (copyTimer.current != null) {
        window.clearTimeout(copyTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    if (page !== "icons") return;
    let cancelled = false;
    (async () => {
      try {
        await preloadAllIconData();
      } catch {
        /* ignore */
      }
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [page]);

  useEffect(() => {
    if (page !== "icons" || isSearching || scrollNonce === 0) return;
    const pending = pendingScrollRef.current;
    if (pending == null) return;
    pendingScrollRef.current = null;

    const run = () => {
      if (pending === "all") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        const el = document.getElementById(`group-${pending}`);
        if (el) {
          const nav = document.querySelector(".site-nav") as HTMLElement | null;
          const sticky = document.querySelector(
            ".sticky-bar",
          ) as HTMLElement | null;
          const offset =
            (nav?.offsetHeight ?? 64) + (sticky?.offsetHeight ?? 0) + 8;
          const top =
            el.getBoundingClientRect().top + window.scrollY - offset;
          window.scrollTo({ top, behavior: "smooth" });
        }
      }
      window.setTimeout(() => {
        scrollingToRef.current = false;
      }, 800);
    };

    window.requestAnimationFrame(run);
  }, [page, isSearching, sections, scrollNonce]);

  useEffect(() => {
    if (page !== "icons" || isSearching || !galleryRef.current) return;
    const root = galleryRef.current;
    const nodes = root.querySelectorAll<HTMLElement>("[data-group-section]");
    if (!nodes.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (scrollingToRef.current) return;
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort(
            (a, b) =>
              a.boundingClientRect.top - b.boundingClientRect.top,
          );
        const top = visible[0];
        if (!top?.target) return;
        const id = (top.target as HTMLElement).dataset.groupSection as
          | DisplayGroupId
          | undefined;
        if (id) setActiveGroup(id);
      },
      {
        root: null,
        rootMargin: "-20% 0px -55% 0px",
        threshold: [0, 0.1, 0.25],
      },
    );

    nodes.forEach((n) => observer.observe(n));
    return () => observer.disconnect();
  }, [page, isSearching, sections]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (page !== "icons") go("icons");
        window.setTimeout(() => searchRef.current?.focus(), 0);
      }
      if (e.key === "Escape") {
        setSelectedId(null);
        setNavOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [page]);

  const importLine = selected
    ? `import { ${selected.componentName} } from "@farsiui/icons";`
    : "";
  const jsxLine = selected
    ? `<${selected.componentName} size={${previewSize}} variant="${variant}" />`
    : "";

  const showFaTitle =
    !!selected &&
    hasPersianScript(selected.nameFa) &&
    selected.nameFa.trim() !== selected.nameEn.trim();
  const drawerTitle = selected
    ? showFaTitle
      ? selected.nameFa
      : selected.nameEn
    : "";
  const drawerSubtitle = showFaTitle && selected ? selected.nameEn : null;

  const copySvg = async () => {
    const svg = previewRef.current?.querySelector("svg");
    if (!svg) return;
    const clone = svg.cloneNode(true) as SVGElement;
    // Preview may be scaled up to fill the stage; export at the labeled size.
    clone.setAttribute("width", String(previewSize));
    clone.setAttribute("height", String(previewSize));
    const ok = await copyText(clone.outerHTML);
    if (ok) flashCopied("svg");
  };

  const copyJsx = async () => {
    const ok = await copyText(jsxLine);
    if (ok) flashCopied("jsx");
  };

  const copyImport = async () => {
    const ok = await copyText(importLine);
    if (ok) flashCopied("import");
  };

  return (
    <div className="app">
      <header className="site-nav" dir="rtl" lang="fa">
        <div className="site-nav-inner">
          <a
            className="nav-brand"
            href="#icons"
            aria-label="فارسی‌آیکون"
            onClick={(e) => {
              e.preventDefault();
              go("icons");
            }}
          >
            <span className="nav-brand-text">فارسی‌آیکون</span>
          </a>

          <nav className="nav-links" aria-label="منوی اصلی" dir="ltr" lang="en">
            {NAV_LINKS.map((link) => (
              <a
                key={link.page}
                href={`#${link.page}`}
                className={page === link.page ? "active" : undefined}
                onClick={(e) => {
                  e.preventDefault();
                  go(link.page);
                }}
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="nav-controls">
            <a
              className="nav-star-btn"
              href={REPO_URL}
              target="_blank"
              rel="noreferrer"
              aria-label={
                starCount != null
                  ? `${starCount} stars on GitHub`
                  : "GitHub repository"
              }
            >
              <GitHubIcon />
              {starCount != null ? (
                <span className="nav-star-count" dir="ltr" lang="en">
                  {starCount}
                </span>
              ) : null}
            </a>

            <button
              type="button"
              className="nav-icon-btn"
              aria-label={
                theme === "dark" ? "حالت روشن" : "حالت تاریک"
              }
              onClick={() =>
                setTheme((t) => (t === "dark" ? "light" : "dark"))
              }
            >
              {theme === "dark" ? <SunIcon /> : <MoonIcon />}
            </button>

            <button
              type="button"
              className={`nav-icon-btn hamburger ${navOpen ? "open" : ""}`}
              aria-label="منو"
              aria-expanded={navOpen}
              onClick={() => setNavOpen((v) => !v)}
            >
              <MenuIcon />
            </button>
          </div>
        </div>

        {navOpen ? (
          <div className="mobile-nav" role="menu">
            {NAV_LINKS.map((link) => (
              <a
                key={link.page}
                href={`#${link.page}`}
                className={page === link.page ? "active" : undefined}
                role="menuitem"
                onClick={(e) => {
                  e.preventDefault();
                  go(link.page);
                }}
              >
                {link.label}
              </a>
            ))}
          </div>
        ) : null}
      </header>

      {page === "guide" ? (
        <div className="page doc-shell">
          <GuidePage />
        </div>
      ) : null}

      {page === "packages" ? (
        <div className="page doc-shell">
          <PackagesPage />
        </div>
      ) : null}

      {page === "icons" ? (
        <div className="page page-with-sidebar">
          <div
            className="gallery"
            ref={galleryRef}
            style={
              {
                "--icon-size": `${tileSize}px`,
              } as CSSProperties
            }
          >
            <div className="sticky-bar">
              <label className="search">
                <SearchIcon />
                <input
                  ref={searchRef}
                  type="search"
                  dir="rtl"
                  lang="fa"
                  placeholder="جستجو"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  aria-label="جستجو"
                />
                <span className="kbd">Ctrl+K</span>
              </label>
            </div>

            <div className="usage-strip" dir="ltr" lang="en">
              <div className="usage-row">
                <span className="usage-label">نصب</span>
                <code className="usage-code">npm install @farsiui/icons</code>
                <button
                  type="button"
                  className="usage-copy"
                  aria-label="کپی دستور نصب"
                  title={usageCopied === "install" ? "کپی شد" : "کپی"}
                  onClick={async () => {
                    const ok = await copyText("npm install @farsiui/icons");
                    if (ok) {
                      setUsageCopied("install");
                      window.setTimeout(() => setUsageCopied(null), 1200);
                    }
                  }}
                >
                  {usageCopied === "install" ? <CheckIcon /> : <CopyIcon />}
                </button>
              </div>
              <div className="usage-row">
                <span className="usage-label">مثال</span>
                <code className="usage-code">
                  {`import { IspRightelIcon } from "@farsiui/icons";`}
                </code>
                <button
                  type="button"
                  className="usage-copy"
                  aria-label="کپی مثال import"
                  title={usageCopied === "import" ? "کپی شد" : "کپی"}
                  onClick={async () => {
                    const ok = await copyText(
                      `import { IspRightelIcon } from "@farsiui/icons";`,
                    );
                    if (ok) {
                      setUsageCopied("import");
                      window.setTimeout(() => setUsageCopied(null), 1200);
                    }
                  }}
                >
                  {usageCopied === "import" ? <CheckIcon /> : <CopyIcon />}
                </button>
              </div>
            </div>

            <p className="gallery-caption" dir="rtl" lang="fa">
              {activeGroupLabel}
              {!ready ? " · loading…" : null}
            </p>

            <div className="grid-wrap">
              {filtered.length === 0 ? (
                <p className="empty">No icons match your search.</p>
              ) : isSearching ? (
                <div className="grid">
                  {filtered.map((entry) => {
                    const active = entry.id === selectedId;
                    return (
                      <button
                        key={entry.id}
                        type="button"
                        className={`tile ${active ? "active" : ""}`}
                        onClick={() => {
                          setCopiedKind(null);
                          setSelectedId((prev) =>
                            prev === entry.id ? null : entry.id,
                          );
                        }}
                        aria-label={entry.nameEn}
                        aria-pressed={active}
                      >
                        <span className="tile-icon">
                          <LogoIcon
                            name={entry.id}
                            size={tileSize}
                            variant={variant}
                            style={
                              variant === "mono"
                                ? { color: iconColor }
                                : undefined
                            }
                          />
                        </span>
                        <span className="tile-tip">{entry.nameEn}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="icon-sections">
                  {sections.map((section) => (
                    <section
                      key={section.id}
                      id={`group-${section.id}`}
                      className="icon-section"
                      data-group-section={section.id}
                      aria-labelledby={`group-heading-${section.id}`}
                    >
                      <h2
                        id={`group-heading-${section.id}`}
                        className="icon-section-title"
                        dir="rtl"
                        lang="fa"
                      >
                        {section.labelFa}
                        <span className="icon-section-count" dir="rtl" lang="fa">
                          {toFaDigits(section.icons.length)}
                        </span>
                      </h2>
                      <div className="grid">
                        {section.icons.map((entry) => {
                          const active = entry.id === selectedId;
                          return (
                            <button
                              key={entry.id}
                              type="button"
                              className={`tile ${active ? "active" : ""}`}
                              onClick={() => {
                                setCopiedKind(null);
                                setSelectedId((prev) =>
                                  prev === entry.id ? null : entry.id,
                                );
                              }}
                              aria-label={entry.nameEn}
                              aria-pressed={active}
                            >
                              <span className="tile-icon">
                                <LogoIcon
                                  name={entry.id}
                                  size={tileSize}
                                  variant={variant}
                                  style={
                                    variant === "mono"
                                      ? { color: iconColor }
                                      : undefined
                                  }
                                />
                              </span>
                              <span className="tile-tip">{entry.nameEn}</span>
                            </button>
                          );
                        })}
                      </div>
                    </section>
                  ))}
                </div>
              )}
            </div>
          </div>

          <aside
            className="cat-sidebar"
            aria-label="دسته‌بندی‌ها"
            dir="rtl"
            lang="fa"
          >
            <div
              className={`customizer-card ${isCustomized ? "customized" : ""}`}
              dir="rtl"
              lang="fa"
            >
              <div className="customizer-header">
                <h2 className="customizer-title">نمایش</h2>
                <div className="customizer-header-actions">
                  <span className="customizer-value" dir="rtl" lang="fa">
                    {toFaDigits(tileSize)}px
                  </span>
                  <button
                    type="button"
                    className="customizer-reset"
                    disabled={!isCustomized}
                    onClick={resetCustomizer}
                    aria-label="بازنشانی"
                    title="بازنشانی"
                  >
                    ↺
                  </button>
                </div>
              </div>

              <label className="customizer-field customizer-field-size">
                <input
                  type="range"
                  min={16}
                  max={64}
                  step={1}
                  value={tileSize}
                  onChange={(e) =>
                    updateCustomizer({ size: Number(e.target.value) })
                  }
                  aria-label="اندازه آیکون"
                />
              </label>

              <div className="customizer-toolbar" role="group" aria-label="حالت و رنگ">
                <div className="customizer-segment">
                  <button
                    type="button"
                    className={variant === "color" ? "active" : ""}
                    onClick={() => updateCustomizer({ variant: "color" })}
                  >
                    رنگی
                  </button>
                  <button
                    type="button"
                    className={variant === "mono" ? "active" : ""}
                    onClick={() => updateCustomizer({ variant: "mono" })}
                  >
                    تک‌رنگ
                  </button>
                </div>
                <div
                  className={`customizer-color-row ${variant !== "mono" ? "is-disabled" : ""}`}
                >
                  <input
                    type="color"
                    className="customizer-color"
                    value={colorDraft}
                    disabled={variant !== "mono"}
                    onChange={(e) => onColorDraftChange(e.target.value)}
                    onBlur={flushColorDraft}
                    aria-label="رنگ آیکون تک‌رنگ"
                    title={variant === "mono" ? colorDraft : "رنگ برند"}
                  />
                </div>
              </div>
            </div>

            <div
              className="cat-list"
              role="listbox"
              aria-label="دسته‌بندی آیکون‌ها"
            >
              <button
                type="button"
                className={`cat-row ${activeGroup === "all" && !isSearching ? "active" : ""}`}
                role="option"
                aria-selected={activeGroup === "all"}
                onClick={() => scrollToGroup("all")}
              >
                <span className="cat-row-label">
                  <span className="cat-fa">همه دسته‌ها</span>
                </span>
                <span className="cat-count" dir="rtl" lang="fa">
                  {toFaDigits(totalVisible)}
                </span>
              </button>

              {visibleGroups.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  className={`cat-row ${activeGroup === g.id && !isSearching ? "active" : ""}`}
                  role="option"
                  aria-selected={activeGroup === g.id}
                  onClick={() => scrollToGroup(g.id)}
                >
                  <span className="cat-row-label">
                    <span className="cat-fa">{g.labelFa}</span>
                  </span>
                  <span className="cat-count" dir="rtl" lang="fa">
                    {toFaDigits(groupCounts.get(g.id) ?? 0)}
                  </span>
                </button>
              ))}
            </div>
          </aside>
        </div>
      ) : null}

      {page === "icons" && selected ? (
        <>
          <button
            type="button"
            className="drawer-backdrop"
            aria-label="Close details"
            onClick={() => setSelectedId(null)}
          />
          <section className="drawer" aria-label={`${drawerTitle} details`}>
            <div className="drawer-preview-col">
              <div ref={previewRef} className="drawer-preview">
                <LogoIcon
                  name={selected.id}
                  size={previewRenderPx}
                  variant={variant}
                  title={drawerTitle}
                  style={
                    variant === "mono" ? { color: iconColor } : undefined
                  }
                />
              </div>
              <div
                className="size-chips"
                role="group"
                aria-label="Preview size"
              >
                {PREVIEW_SIZES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={`size-chip ${previewSize === s ? "active" : ""}`}
                    onClick={() => setPreviewSize(s)}
                    dir="rtl"
                    lang="fa"
                  >
                    {toFaDigits(s)}
                  </button>
                ))}
              </div>
            </div>

            <div className="drawer-body">
              <div className="drawer-head">
                <div className="drawer-titles">
                  <div className="drawer-title-row">
                    <h2
                      className="drawer-title"
                      dir={showFaTitle ? "rtl" : "ltr"}
                      lang={showFaTitle ? "fa" : "en"}
                    >
                      {drawerTitle}
                    </h2>
                    {selected.sourceUrl ? (
                      <a
                        className="drawer-source"
                        href={selected.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        aria-label="Open source"
                        title={selected.sourceUrl}
                      >
                        <ExternalLinkIcon />
                      </a>
                    ) : null}
                  </div>
                  {drawerSubtitle ? (
                    <p className="drawer-en" dir="ltr" lang="en">
                      {drawerSubtitle}
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  className="drawer-close"
                  aria-label="Close"
                  onClick={() => setSelectedId(null)}
                >
                  ×
                </button>
              </div>

              <div className="drawer-actions">
                <button
                  type="button"
                  className={`copy-btn confetti-btn ${copiedKind === "svg" ? "animate" : ""}`}
                  data-confetti-text="Copied!"
                  onClick={copySvg}
                >
                  Copy SVG
                </button>
                <button
                  type="button"
                  className={`copy-btn confetti-btn ${copiedKind === "jsx" ? "animate" : ""}`}
                  data-confetti-text="Copied!"
                  onClick={copyJsx}
                >
                  Copy JSX
                </button>
              </div>

              <div className="import-block">
                <button
                  type="button"
                  className="import-copy"
                  onClick={copyImport}
                  aria-label={
                    copiedKind === "import" ? "Copied" : "Copy import"
                  }
                  title={copiedKind === "import" ? "Copied!" : "Copy"}
                >
                  {copiedKind === "import" ? <CheckIcon /> : <CopyIcon />}
                </button>
                <pre className="import-code" aria-label="Import statement">
                  <code>
                    <span className="tok-kw">import</span>
                    <span className="tok-punc"> {"{"} </span>
                    <span className="tok-id">{selected.componentName}</span>
                    <span className="tok-punc"> {"}"} </span>
                    <span className="tok-kw">from</span>{" "}
                    <span className="tok-str">"@farsiui/icons"</span>
                    <span className="tok-punc">;</span>
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
