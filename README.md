# @farsiui/icons

کامپوننت‌های React برای لوگو و آیکون برندها و سرویس‌های ایرانی — بانک، پرداخت، اپ، رسانه، خودرو، دولوپر و بیشتر.

دمو: [icons.farsiui.ir](https://icons.farsiui.ir/)

## پیشنهاد: CLI (حجم سبک)

فقط همان آیکون‌هایی که لازم دارید داخل پروژه‌تان کپی می‌شود:

```bash
npx @farsiui/icons-cli add bank-melli
npx @farsiui/icons-cli add bank-melli website-digikala
```

سپس:

فایل می‌رود به `src/components/icons` (اگر `src` دارید) یا `components/icons`.

```tsx
import { BankMelliIcon } from "@/components/icons/BankMelliIcon";

<BankMelliIcon size={32} />
<BankMelliIcon size={32} variant="mono" style={{ color: "#111" }} />
```

جزئیات: [`packages/icons-cli/README.md`](packages/icons-cli/README.md)

## پکیج کامل (اختیاری)

همهٔ آیکون‌ها در `node_modules` (حجم بیشتر):

```bash
npm install @farsiui/icons
```

```tsx
import { BankMelliIcon, WebsiteDigikalaIcon } from "@farsiui/icons";
import { LogoIcon, iconManifest } from "@farsiui/icons";

<BankMelliIcon size={32} />
<LogoIcon name="website-digikala" variant="mono" />
```

نیاز به `react` و `react-dom` نسخه ۱۸ یا ۱۹.

## Props

| Prop | توضیح |
|------|--------|
| `size` | اندازه مربع |
| `variant` | `"color"` یا `"mono"` (`currentColor`) |
| `title` | نام دسترس‌پذیر؛ بدون آن تزئینی است |
| `className` | روی `<svg>` |

## توسعه

```bash
npm install
npm run generate            # ساخت آیکون‌ها از assets/
npm run generate:registry   # رجیستری CLI → registry/
npm run dev                 # playground
npm run build
```

CLI محلی روی رجیستری همین ریپو:

```bash
node packages/icons-cli/src/index.mjs add bank-melli --registry ./registry
```

## مجوز

کد پکیج: MIT.  
آرت‌ورک‌ها از منابع مختلف با مجوزهای اصلی خودشان در `assets/` آمده‌اند.  
لوگوهای استارتاپی `assets/manual` جمع‌آوری‌شده توسط [trustmrr.ir](https://trustmrr.ir) از وب‌سایت خود شرکت‌ها (جزئیات در `assets/manual/sources.json`)؛ هر لوگو علامت تجاری همان شرکت است.
