import {
  useCallback,
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
  iconManifest,
  preloadAllIconData,
  type DisplayGroupId,
  type IconManifestEntry,
  type IconVariant,
} from "@farsiui/icons";
import { toFaDigits } from "./fa-digits";
import { GuidePage } from "./GuidePage";
import { PackagesPage } from "./PackagesPage";
import { buildSearchIndex, searchEntries } from "./search";
import { VirtualIconGallery } from "./VirtualIconGallery";

buildSearchIndex(iconManifest);

type PageId = "icons" | "guide" | "packages";

type ExtNavLink = {
  label: string;
  href: string;
  icon: "components" | "blocks" | "skills" | "charts" | "animation";
};

const EXT_NAV_LINKS: ExtNavLink[] = [
  {
    label: "کامپوننت‌ها",
    href: "https://farsiui.ir/docs/components",
    icon: "components",
  },
  { label: "بلوک‌ها", href: "https://farsiui.ir/blocks", icon: "blocks" },
  { label: "مهارت‌ها", href: "https://farsiui.ir/skills", icon: "skills" },
  { label: "نمودارها", href: "https://farsiui.ir/charts", icon: "charts" },
  { label: "انیمیشن", href: "https://tarhak.ir/", icon: "animation" },
];

const CONTRIBUTE_URL =
  "https://github.com/MiladJoodi/FarsiUI-Icons/issues/new?title=%D9%BE%DB%8C%D8%B4%D9%86%D9%87%D8%A7%D8%AF%20%D8%A2%DB%8C%DA%A9%D9%88%D9%86&body=%D9%86%D8%A7%D9%85%20%D8%A2%DB%8C%DA%A9%D9%88%D9%86%3A%0A%D9%84%DB%8C%D9%86%DA%A9%20%D9%84%D9%88%DA%AF%D9%88%20%DB%8C%D8%A7%20SVG%3A%0A";

const PREVIEW_SIZES = [16, 24, 32, 48] as const;
/** Drawer stage size in px; `48` fills this box completely. */
const PREVIEW_FRAME_PX = 128;

/** Fallback brand palettes if catalog omits brandColors. */
const BRAND_COLORS: Record<string, string[]> = {
  easycandle: ["#0B2A4A", "#FFC400", "#FF7A00"],
  vibefarsi: ["#E39A8E", "#cf5c49"],
  pixevel: ["#111111", "#FCFCFA", "#F8A8B8"],
  farsiui: ["#2E2E2E", "#FFFFFF"],
  "banana-ai": ["#000000", "#FE8301"],
  shenakhti: ["#009FE3"],
  zarinpal: ["#FFD60A", "#0A33FF"],
  alamto: ["#FFC10A", "#FD5722"],
  "bank-sepah": ["#484848", "#E86018"],
};

const CUSTOMIZER_DEFAULTS = {
  size: 28,
  variant: "color" as IconVariant,
  color: "#a1a1aa",
};

const COLOR_COMMIT_MS = 180;
/** Delay gallery filter while typing so fast input stays smooth. */
const SEARCH_DEBOUNCE_MS = 200;

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

/** RTL back/clear: horizontal arrow pointing right (فارسی). */
function SearchClearArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 12h14M13 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ExtNavIcon({ name }: { name: ExtNavLink["icon"] }) {
  const common = {
    width: 16,
    height: 16,
    viewBox: "0 0 24 24",
    fill: "none" as const,
    "aria-hidden": true as const,
  };
  if (name === "components") {
    return (
      <svg {...common}>
        <rect x="3" y="3" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.75" />
        <rect x="13" y="3" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.75" />
        <rect x="3" y="13" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.75" />
        <rect x="13" y="13" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.75" />
      </svg>
    );
  }
  if (name === "blocks") {
    return (
      <svg {...common}>
        <rect x="4" y="4" width="16" height="5" rx="1.2" stroke="currentColor" strokeWidth="1.75" />
        <rect x="4" y="10.5" width="16" height="5" rx="1.2" stroke="currentColor" strokeWidth="1.75" />
        <rect x="4" y="17" width="16" height="3" rx="1" stroke="currentColor" strokeWidth="1.75" />
      </svg>
    );
  }
  if (name === "skills") {
    return (
      <svg {...common}>
        <path
          d="M12 3l1.6 4.8L18.5 9.5l-4 3.1L15.8 18 12 15.2 8.2 18l1.3-5.4-4-3.1 4.9-1.7L12 3Z"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (name === "charts") {
    return (
      <svg {...common}>
        <path
          d="M4 19V5M4 19h16"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
        <path
          d="M8 16v-5M12 16V8M16 16v-8"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M10 9.2v5.6l5-2.8-5-2.8Z"
        fill="currentColor"
      />
    </svg>
  );
}

function PlusCircleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="8.25" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M12 8.5v7M8.5 12h7"
        stroke="currentColor"
        strokeWidth="1.75"
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
  /** Debounced copy of `query` — drives filtering / virtual gallery. */
  const [debouncedQuery, setDebouncedQuery] = useState("");
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
  const [, setReady] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    const saved = window.localStorage.getItem("farsiui-icons-theme");
    return saved === "light" || saved === "dark" ? saved : "dark";
  });
  const [copiedKind, setCopiedKind] = useState<
    "svg" | "jsx" | "import" | "cli" | null
  >(    null,
  );
  const [installCopied, setInstallCopied] = useState(false);
  const [copiedColor, setCopiedColor] = useState<string | null>(null);
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

  useEffect(() => {
    // Clear results immediately when the box is emptied.
    if (!query.trim()) {
      setDebouncedQuery("");
      return;
    }
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query);
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [query]);

  const filtered = useMemo(() => {
    return searchEntries(iconManifest, debouncedQuery);
  }, [debouncedQuery]);

  const sections = useMemo(() => {
    // Browse mode groups the full catalog; search uses the flat filtered list.
    const source = debouncedQuery.trim() ? filtered : iconManifest;
    const byGroup = new Map<DisplayGroupId, IconManifestEntry[]>();
    for (const entry of source) {
      const gid = getDisplayGroupId(entry);
      const list = byGroup.get(gid);
      if (list) list.push(entry);
      else byGroup.set(gid, [entry]);
    }
    return displayGroups
      .map((g) => {
        const icons = [...(byGroup.get(g.id) ?? [])].sort(
          (a, b) =>
            a.nameFa.localeCompare(b.nameFa, "fa") ||
            a.nameEn.localeCompare(b.nameEn, "en") ||
            a.id.localeCompare(b.id),
        );
        return {
          id: g.id,
          labelFa: g.labelFa,
          icons,
        };
      })
      .filter((s) => s.icons.length > 0);
  }, [filtered, debouncedQuery]);

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

  const isSearching = debouncedQuery.trim().length > 0;

  const isCustomized =
    customizer.size !== CUSTOMIZER_DEFAULTS.size ||
    customizer.variant !== CUSTOMIZER_DEFAULTS.variant ||
    customizer.color !== CUSTOMIZER_DEFAULTS.color;

  const selected: IconManifestEntry | undefined = selectedId
    ? iconManifest.find((e) => e.id === selectedId)
    : undefined;

  const selectedBrandColors =
    selected?.brandColors ??
    (selected ? BRAND_COLORS[selected.id] : undefined);

  const flashCopied = (kind: "svg" | "jsx" | "import" | "cli") => {
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
    setReady(true);
    let cancelled = false;
    void preloadAllIconData().catch(() => {
      /* ignore — LogoIcon loads categories on demand */
    });
    return () => {
      cancelled = true;
      void cancelled;
    };
  }, [page]);

  const onSelectIcon = useCallback((id: string) => {
    setCopiedKind(null);
    setSelectedId((prev) => (prev === id ? null : id));
  }, []);

  const onActiveGroup = useCallback((id: DisplayGroupId) => {
    setActiveGroup(id);
  }, []);

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

  const cliLine = selected
    ? `npx @farsiui/icons-cli add ${selected.id}`
    : "";
  const importLine = selected
    ? `import { ${selected.componentName} } from "@/components/icons/${selected.componentName}";`
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

  const copyCli = async () => {
    const ok = await copyText(cliLine);
    if (ok) flashCopied("cli");
  };

  const copyImport = async () => {
    const ok = await copyText(importLine);
    if (ok) flashCopied("import");
  };

  return (
    <div className="app">
      <header
        className={`site-nav ${navOpen ? "is-open" : ""}`}
        dir="rtl"
        lang="fa"
      >
        <div className="site-nav-inner">
          <a
            className="nav-brand"
            href="#icons"
            aria-label="آیکون‌های فارسیUI"
            onClick={(e) => {
              e.preventDefault();
              go("icons");
              setQuery("");
              setActiveGroup("all");
              scrollingToRef.current = false;
              pendingScrollRef.current = null;
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            <span className="nav-brand-stack">
              <span className="nav-brand-text">آیکون‌های فارسیUI</span>
            </span>
          </a>

          <nav className="nav-links" aria-label="منوی اصلی">
            {EXT_NAV_LINKS.map((link) => (
              <a
                key={link.href}
                className="nav-ext"
                href={link.href}
                target="_blank"
                rel="noopener noreferrer nofollow"
              >
                <ExtNavIcon name={link.icon} />
                <span>{link.label}</span>
              </a>
            ))}
            <a
              className="nav-contribute"
              href={CONTRIBUTE_URL}
              target="_blank"
              rel="noopener noreferrer nofollow"
              title="آیکون برندتان را پیشنهاد دهید"
            >
              <PlusCircleIcon />
              <span>پیشنهاد آیکون</span>
            </a>
          </nav>

          <div className="nav-controls">
            <button
              type="button"
              className="install-chip"
              dir="ltr"
              lang="en"
              aria-label="کپی دستور نصب"
              title={installCopied ? "کپی شد" : "کپی دستور نصب"}
              onClick={async () => {
                const ok = await copyText("npm install @farsiui/icons");
                if (ok) {
                  setInstallCopied(true);
                  window.setTimeout(() => setInstallCopied(false), 1200);
                }
              }}
            >
              <code>npm i @farsiui/icons</code>
              {installCopied ? <CheckIcon /> : <CopyIcon />}
            </button>

            <a
              className="nav-star-btn"
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer nofollow"
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
            <button
              type="button"
              className="mobile-install"
              dir="ltr"
              lang="en"
              role="menuitem"
              onClick={async () => {
                const ok = await copyText("npm install @farsiui/icons");
                if (ok) {
                  setInstallCopied(true);
                  window.setTimeout(() => setInstallCopied(false), 1200);
                }
                setNavOpen(false);
              }}
            >
              <code>npm i @farsiui/icons</code>
              {installCopied ? <CheckIcon /> : <CopyIcon />}
            </button>
            <div className="mobile-nav-section" role="presentation">
              فارسیUI
            </div>
            {EXT_NAV_LINKS.map((link) => (
              <a
                key={link.href}
                className="nav-ext"
                href={link.href}
                target="_blank"
                rel="noopener noreferrer nofollow"
                role="menuitem"
                onClick={() => setNavOpen(false)}
              >
                <ExtNavIcon name={link.icon} />
                <span>{link.label}</span>
              </a>
            ))}
            <a
              className="nav-contribute"
              href={CONTRIBUTE_URL}
              target="_blank"
              rel="noopener noreferrer nofollow"
              role="menuitem"
              onClick={() => setNavOpen(false)}
            >
              <PlusCircleIcon />
              <span>پیشنهاد آیکون</span>
            </a>
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
              <label className="search" dir="rtl" lang="fa">
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
                    <SearchClearArrowIcon />
                  </button>
                ) : null}
                <span className="kbd">Ctrl+K</span>
              </label>
            </div>

            <div className="grid-wrap">
              <VirtualIconGallery
                sections={sections}
                filtered={filtered}
                isSearching={isSearching}
                tileSize={tileSize}
                variant={variant}
                iconColor={iconColor}
                selectedId={selectedId}
                onSelect={onSelectIcon}
                pendingScrollRef={pendingScrollRef}
                scrollNonce={scrollNonce}
                scrollingToRef={scrollingToRef}
                onActiveGroup={onActiveGroup}
              />
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

              <div className="customizer-size-row">
                <input
                  type="range"
                  className="customizer-size-slider"
                  min={16}
                  max={64}
                  step={1}
                  value={tileSize}
                  onChange={(e) =>
                    updateCustomizer({ size: Number(e.target.value) })
                  }
                  aria-label="اندازه آیکون"
                />
                <span className="customizer-value" dir="ltr" lang="en">
                  {tileSize}px
                </span>
              </div>

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
                  </div>
                  {drawerSubtitle ? (
                    <p className="drawer-en" dir="ltr" lang="en">
                      {drawerSubtitle}
                    </p>
                  ) : null}
                </div>
                <div className="drawer-head-actions">
                  {selected.sourceUrl ? (
                    <a
                      className="drawer-source-link"
                      href={selected.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      title={selected.sourceUrl}
                      aria-label="منبع"
                    >
                      <ExternalLinkIcon />
                    </a>
                  ) : null}
                  <button
                    type="button"
                    className="drawer-close"
                    aria-label="Close"
                    onClick={() => setSelectedId(null)}
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="drawer-actions">
                <button
                  type="button"
                  className={`copy-btn confetti-btn ${copiedKind === "svg" ? "animate" : ""}`}
                  data-confetti-text="کپی شد"
                  onClick={copySvg}
                >
                  Copy SVG
                </button>
                <button
                  type="button"
                  className={`copy-btn confetti-btn ${copiedKind === "jsx" ? "animate" : ""}`}
                  data-confetti-text="کپی شد"
                  onClick={copyJsx}
                >
                  Copy JSX
                </button>
                {selectedBrandColors && selectedBrandColors.length > 0 ? (
                  <div
                    className="brand-colors"
                    dir="ltr"
                    lang="en"
                    aria-label="رنگ‌های برند"
                  >
                    {selectedBrandColors.map((hex) => (
                      <button
                        key={hex}
                        type="button"
                        className={`brand-swatch confetti-btn ${copiedColor === hex ? "animate" : ""}`}
                        style={{ ["--swatch" as string]: hex }}
                        data-confetti-text="کپی شد"
                        title={
                          copiedColor === hex ? "کپی شد" : `کپی ${hex}`
                        }
                        aria-label={`Copy color ${hex}`}
                        onClick={async () => {
                          const ok = await copyText(hex);
                          if (ok) {
                            setCopiedColor(hex);
                            window.setTimeout(
                              () => setCopiedColor(null),
                              1200,
                            );
                          }
                        }}
                      >
                        <span className="brand-swatch-chip" />
                        <span className="brand-swatch-hex">{hex}</span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="import-block">
                <button
                  type="button"
                  className="import-copy"
                  onClick={copyCli}
                  aria-label={
                    copiedKind === "cli" ? "کپی شد" : "کپی دستور CLI"
                  }
                  title={copiedKind === "cli" ? "کپی شد" : "کپی"}
                >
                  {copiedKind === "cli" ? <CheckIcon /> : <CopyIcon />}
                </button>
                <pre className="import-code" aria-label="CLI add command" dir="ltr">
                  <code>
                    <span className="tok-kw">npx</span>{" "}
                    <span className="tok-id">@farsiui/icons-cli</span>{" "}
                    <span className="tok-kw">add</span>{" "}
                    <span className="tok-str">{selected.id}</span>
                  </code>
                </pre>
              </div>

              <div className="import-block">
                <button
                  type="button"
                  className="import-copy"
                  onClick={copyImport}
                  aria-label={
                    copiedKind === "import" ? "کپی شد" : "کپی ایمپورت محلی"
                  }
                  title={copiedKind === "import" ? "کپی شد" : "کپی"}
                >
                  {copiedKind === "import" ? <CheckIcon /> : <CopyIcon />}
                </button>
                <pre className="import-code" aria-label="Local import statement">
                  <code>
                    <span className="tok-kw">import</span>
                    <span className="tok-punc"> {"{"} </span>
                    <span className="tok-id">{selected.componentName}</span>
                    <span className="tok-punc"> {"}"} </span>
                    <span className="tok-kw">from</span>{" "}
                    <span className="tok-str">
                      {`"@/components/icons/${selected.componentName}"`}
                    </span>
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
