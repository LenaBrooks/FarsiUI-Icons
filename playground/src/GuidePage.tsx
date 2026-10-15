import { useState } from "react";
import { LogoIcon } from "@farsiui/icons";

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function CodeBlock({ code, label }: { code: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="doc-code">
      <div className="doc-code-bar">
        <span>{label}</span>
        <button
          type="button"
          className="doc-copy"
          onClick={async () => {
            const ok = await copyText(code);
            if (ok) {
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1200);
            }
          }}
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre>
        <code>{code}</code>
      </pre>
    </div>
  );
}

export function GuidePage() {
  return (
    <article className="doc-page">
      <header className="doc-hero">
        <p className="doc-eyebrow">Guide</p>
        <h1>Use @farsiui/icons</h1>
        <p className="doc-lead">
          Iranian brand logos as React SVG components — color or mono, searchable
          catalog, tree-shake friendly named exports.
        </p>
      </header>

      <section className="doc-section">
        <h2>Install</h2>
        <p>
          Peer deps: <code>react</code> and <code>react-dom</code> (^18 or ^19).
        </p>
        <CodeBlock
          label="npm"
          code={`npm install @farsiui/icons`}
        />
        <p className="doc-note">
          Package is prepared for publish; use local{" "}
          <code>npm link</code> / workspace until it is on the registry.
        </p>
      </section>

      <section className="doc-section">
        <h2>LogoIcon (by name)</h2>
        <p>
          Lazy-loads category data. Good for galleries and dynamic names from
          your API.
        </p>
        <CodeBlock
          label="tsx"
          code={`import { LogoIcon } from "@farsiui/icons";

export function PayRow() {
  return (
    <>
      <LogoIcon name="bank-melli" size={32} title="Bank Melli" />
      <LogoIcon name="website-digikala" variant="mono" size={28} />
    </>
  );
}`}
        />
        <div className="doc-demo" aria-label="LogoIcon demo">
          <LogoIcon name="bank-melli" size={36} title="Bank Melli" />
          <LogoIcon
            name="website-digikala"
            variant="mono"
            size={36}
            title="Digikala"
          />
          <LogoIcon name="lps-electricity" size={36} title="Electricity" />
        </div>
      </section>

      <section className="doc-section">
        <h2>variant: color | mono</h2>
        <p>
          <code>color</code> keeps brand fills. <code>mono</code> uses{" "}
          <code>currentColor</code> so the icon follows your text/theme color.
        </p>
        <CodeBlock
          label="tsx"
          code={`<LogoIcon name="bank-mellat" variant="color" size={40} />
<LogoIcon name="bank-mellat" variant="mono" size={40} className="text-zinc-500" />`}
        />
        <div className="doc-demo doc-demo-mono" aria-label="Variant demo">
          <div>
            <span className="doc-demo-label">color</span>
            <LogoIcon name="bank-mellat" variant="color" size={40} />
          </div>
          <div style={{ color: "#a1a1aa" }}>
            <span className="doc-demo-label">mono</span>
            <LogoIcon name="bank-mellat" variant="mono" size={40} />
          </div>
        </div>
      </section>

      <section className="doc-section">
        <h2>Tree-shake (named icons)</h2>
        <p>
          Prefer named components from <code>@farsiui/icons/icons</code> when you
          know the icon at build time — bundlers can drop unused modules.
        </p>
        <CodeBlock
          label="tsx"
          code={`import { BankMelliIcon, WebsiteDigikalaIcon } from "@farsiui/icons/icons";

export function Brands() {
  return (
    <>
      <BankMelliIcon size={32} title="Melli" />
      <WebsiteDigikalaIcon size={32} variant="mono" />
    </>
  );
}`}
        />
        <ul className="doc-list">
          <li>
            <code>@farsiui/icons</code> — catalog helpers + <code>LogoIcon</code>
          </li>
          <li>
            <code>@farsiui/icons/icons</code> — per-icon components (best for
            production UI)
          </li>
        </ul>
      </section>

      <section className="doc-section">
        <h2>Props</h2>
        <div className="doc-table-wrap">
          <table className="doc-table">
            <thead>
              <tr>
                <th>Prop</th>
                <th>Type</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <code>size</code>
                </td>
                <td>number | string</td>
                <td>Square box (width = height); artwork centered with meet</td>
              </tr>
              <tr>
                <td>
                  <code>variant</code>
                </td>
                <td>"color" | "mono"</td>
                <td>Default color</td>
              </tr>
              <tr>
                <td>
                  <code>title</code>
                </td>
                <td>string</td>
                <td>Accessible name; omit if decorative</td>
              </tr>
              <tr>
                <td>
                  <code>className</code>
                </td>
                <td>string</td>
                <td>On the root SVG</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="doc-section">
        <h2>Catalog</h2>
        <CodeBlock
          label="ts"
          code={`import {
  iconManifest,
  iconCategories,
  getIconManifestEntry,
} from "@farsiui/icons";

getIconManifestEntry("bank-melli")?.componentName;
// → "BankMelliIcon"`}
        />
      </section>
    </article>
  );
}
