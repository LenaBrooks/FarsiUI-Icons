import { useState, type ReactNode } from "react";
import { LogoIcon } from "@farsiui/icons";

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
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

type CodeLang = "bash" | "tsx";

/** Lightweight VS Code Dark+–style token coloring. */
function highlightCode(code: string, lang: CodeLang): ReactNode[] {
  const out: ReactNode[] = [];
  let key = 0;
  const push = (text: string, cls?: string) => {
    if (!text) return;
    out.push(
      cls ? (
        <span key={key++} className={cls}>
          {text}
        </span>
      ) : (
        <span key={key++}>{text}</span>
      ),
    );
  };

  if (lang === "bash") {
    const re =
      /(#[^\n]*)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(\b(?:npx|npm|pnpm|yarn|add|install)\b)|(--[\w-]+)|(@[\w.-]+\/[\w.-]+)|([\w][\w./@-]*)/g;
    let m: RegExpExecArray | null;
    let last = 0;
    while ((m = re.exec(code))) {
      if (m.index > last) push(code.slice(last, m.index));
      if (m[1]) push(m[1], "tok-comment");
      else if (m[2]) push(m[2], "tok-string");
      else if (m[3]) push(m[3], "tok-keyword");
      else if (m[4]) push(m[4], "tok-flag");
      else if (m[5]) push(m[5], "tok-string");
      else if (m[6]) push(m[6], "tok-attr");
      last = m.index + m[0].length;
    }
    if (last < code.length) push(code.slice(last));
    return out;
  }

  // tsx
  const re =
    /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`|'(?:\\.|[^'\\])*')|(\b(?:import|from|export|function|return|const|let|var|type|interface)\b)|(\b(?:size|variant|title|name|className)\b(?=\s*=))|(<\/?[A-Za-z][\w.]*)|(\{|\}|\(|\)|=|>|;|,)|(\b\d+\b)|(\S+)/g;
  let m: RegExpExecArray | null;
  let last = 0;
  while ((m = re.exec(code))) {
    if (m.index > last) push(code.slice(last, m.index));
    if (m[1]) push(m[1], "tok-comment");
    else if (m[2]) push(m[2], "tok-string");
    else if (m[3]) push(m[3], "tok-keyword");
    else if (m[4]) push(m[4], "tok-attr");
    else if (m[5]) push(m[5], "tok-tag");
    else if (m[6]) push(m[6], "tok-punct");
    else if (m[7]) push(m[7], "tok-number");
    else if (m[8]) push(m[8], "tok-plain");
    last = m.index + m[0].length;
  }
  if (last < code.length) push(code.slice(last));
  return out;
}

function CodeBlock({
  code,
  label,
  lang,
}: {
  code: string;
  label: string;
  lang: CodeLang;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="doc-code" dir="ltr" lang="en">
      <div className="doc-code-bar">
        <span className="doc-code-label">{label}</span>
        <button
          type="button"
          className="doc-copy"
          aria-label={copied ? "کپی شد" : "کپی"}
          title={copied ? "کپی شد" : "کپی"}
          onClick={async () => {
            const ok = await copyText(code);
            if (ok) {
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1200);
            }
          }}
        >
          {copied ? <CheckIcon /> : <CopyIcon />}
        </button>
      </div>
      <pre className="doc-code-pre">
        <code>{highlightCode(code, lang)}</code>
      </pre>
    </div>
  );
}

export function GuidePage() {
  return (
    <article className="doc-page" dir="rtl" lang="fa">
      <header className="doc-hero">
        <h1>استفاده از آیکون‌های فارسیUI</h1>
        <p className="doc-lead">
          با CLI آیکون‌های موردنیاز را مستقیماً به پروژه اضافه کنید — بدون نصب
          پکیج کامل.
        </p>
      </header>

      <section className="doc-section">
        <h2>نصب آیکون با CLI</h2>
        <p>
          پکیج <code>@farsiui/icons</code> آیکون‌های انتخاب‌شده را مستقیماً به پروژه
          اضافه می‌کند؛ وابستگی جدیدی در <code>package.json</code> اضافه نمی‌شود.
        </p>
        <CodeBlock
          label="bash"
          lang="bash"
          code={`npx farsiui-icons add bank-melli`}
        />
        <p>می‌توانید چند آیکون را هم‌زمان اضافه کنید:</p>
        <CodeBlock
          label="bash"
          lang="bash"
          code={`npx farsiui-icons add bank-melli bank-mellat`}
        />
        <p>
          فایل‌های آیکون در مسیر <code>src/components/icons</code> یا{" "}
          <code>components/icons</code> قرار می‌گیرند و می‌توانید آن‌ها را مستقیماً
          در پروژه ویرایش کنید.
        </p>
        <div className="doc-demo" dir="ltr" aria-label="نمایش نمونه بانک ملی">
          <div className="doc-demo-item">
            <span className="doc-demo-label">color</span>
            <LogoIcon
              name="bank-melli"
              variant="color"
              size={40}
              title="بانک ملی"
            />
          </div>
          <div className="doc-demo-item" style={{ color: "#a1a1aa" }}>
            <span className="doc-demo-label">mono</span>
            <LogoIcon
              name="bank-melli"
              variant="mono"
              size={40}
              title="بانک ملی"
            />
          </div>
        </div>
      </section>

      <section className="doc-section">
        <h2>آیکون‌های عمومی</h2>
        <p>
          مجموعهٔ آیکون‌های عمومی (Lucide) جدا از برندهاست (صفحهٔ{" "}
          <a href="#lucide">آیکون‌های عمومی</a>). با فلگ <code>--lucide</code>{" "}
          همان مدل کپی تکی را دارید:
        </p>
        <CodeBlock
          label="bash"
          lang="bash"
          code={`npx farsiui-icons add house --lucide`}
        />
        <CodeBlock
          label="bash"
          lang="bash"
          code={`npx farsiui-icons add activity zap --lucide`}
        />
        <p>
          فایل‌ها در <code>src/components/lucide</code> (یا{" "}
          <code>components/lucide</code>) قرار می‌گیرند.
        </p>
      </section>

      <section className="doc-section">
        <h2>تنظیم ظاهر آیکون‌ها</h2>
        <p>آیکون‌ها از دو حالت پشتیبانی می‌کنند:</p>
        <ul className="doc-list">
          <li>
            <code>variant=&quot;color&quot;</code> برای حفظ رنگ‌های اصلی برند
          </li>
          <li>
            <code>variant=&quot;mono&quot;</code> برای استفاده از رنگ فعلی متن با{" "}
            <code>currentColor</code>
          </li>
        </ul>
        <p>همچنین می‌توانید اندازه، عنوان و کلاس‌های CSS را تنظیم کنید:</p>
        <CodeBlock
          label="tsx"
          lang="tsx"
          code={`<BankMelliIcon
  size={32}
  variant="mono"
  title="بانک ملی"
/>`}
        />
        <div
          className="doc-demo doc-demo-mono"
          dir="ltr"
          aria-label="مقایسه variant"
        >
          <div className="doc-demo-item">
            <span className="doc-demo-label">color</span>
            <LogoIcon name="bank-mellat" variant="color" size={40} />
          </div>
          <div className="doc-demo-item" style={{ color: "#a1a1aa" }}>
            <span className="doc-demo-label">mono</span>
            <LogoIcon name="bank-mellat" variant="mono" size={40} />
          </div>
        </div>
        <p className="doc-note">
          <strong>نکته:</strong> برای استفاده از آیکون‌های کپی‌شده، به React و
          React DOM نسخهٔ ۱۸ یا ۱۹ در پروژه‌تان نیاز دارید.
        </p>
      </section>
    </article>
  );
}
