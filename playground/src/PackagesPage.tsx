import { iconCategories, iconManifest } from "@farsiui/icons";
import { toFaDigits } from "./fa-digits";

const PACKAGES = [
  {
    name: "@farsiui/icons",
    blurb:
      "با npx فایل آیکون داخل پروژه کپی می‌شود — وابستگی به فارسی‌یوآی ندارید.",
    importExample: `npx @farsiui/icons add bank-melli`,
  },
  {
    name: "@farsiui/icons --lucide",
    blurb:
      "همان پکیج؛ رجیستری جدا برای Lucide (stroke). خروجی پیش‌فرض: components/lucide.",
    importExample: `npx @farsiui/icons add house --lucide`,
  },
];

const SOURCES = [
  {
    id: "persian-labs",
    label: "Persian Labs",
    license: "MIT",
    note: "Core multi-category color + mono set",
  },
  {
    id: "aasaam",
    label: "Aasaam",
    license: "CC0",
    note: "Monochrome brand marks",
  },
  {
    id: "persian-simple-icons",
    label: "Persian Simple Icons",
    license: "MIT",
    note: "Simple currentColor marks",
  },
  {
    id: "logos-per-service",
    label: "Utility services",
    license: "see source",
    note: "برق، گاز، آب، پست، مخابرات",
  },
  {
    id: "logos-per-banks",
    label: "LogoS Banks / Gateways",
    license: "CC0",
    note: "Extra bank and gateway artwork",
  },
  {
    id: "devicons",
    label: "Devicons (curated)",
    license: "MIT",
    note: "Telegram, React, GitHub, … — curated for Iranian dev UIs",
  },
  {
    id: "crypto",
    label: "Crypto",
    license: "MIT",
    note: "100 popular cryptocurrency marks (react-crypto-icons)",
  },
  {
    id: "manual",
    label: "Manual",
    license: "per asset",
    note: "User-provided logos (e.g. Shenakhti)",
  },
];

export function PackagesPage() {
  const bySource = new Map<string, number>();
  for (const e of iconManifest) {
    const s = e.source ?? "manual";
    bySource.set(s, (bySource.get(s) ?? 0) + 1);
  }

  return (
    <article className="doc-page">
      <header className="doc-hero">
        <p className="doc-eyebrow">Packages</p>
        <h1>What ships in this repo</h1>
        <p className="doc-lead" dir="rtl" lang="fa">
          {toFaDigits(iconManifest.length)} آیکون برند در{" "}
          {toFaDigits(iconCategories.length)} دسته، به‌علاوهٔ رجیستری جدا برای
          Lucide. انتشار npm فقط CLI است؛ آیکون با <code>npx</code> داخل پروژه
          کپی می‌شود.
        </p>
      </header>

      <section className="doc-section">
        <h2>Import paths</h2>
        <div className="doc-cards">
          {PACKAGES.map((p) => (
            <div key={p.name} className="doc-card">
              <h3>
                <code>{p.name}</code>
              </h3>
              <p>{p.blurb}</p>
              <pre>
                <code>{p.importExample}</code>
              </pre>
            </div>
          ))}
        </div>
      </section>

      <section className="doc-section">
        <h2>Artwork sources</h2>
        <div className="doc-table-wrap">
          <table className="doc-table">
            <thead>
              <tr>
                <th>Source</th>
                <th>Count</th>
                <th>License</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {SOURCES.map((s) => (
                <tr key={s.id}>
                  <td>{s.label}</td>
                  <td dir="rtl" lang="fa">
                    {bySource.has(s.id)
                      ? toFaDigits(bySource.get(s.id)!)
                      : "—"}
                  </td>
                  <td>{s.license}</td>
                  <td>{s.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="doc-section">
        <h2>Publish status</h2>
        <p>
          Version <code>0.2.0</code> publishes the CLI under{" "}
          <code>@farsiui/icons</code>. Brand registry:{" "}
          <code>registry/</code>; Lucide: <code>registry/lucide/</code>. Use{" "}
          <code>--lucide</code> for stroke icons.
        </p>
      </section>
    </article>
  );
}
