# @farsiui/icons

کامپوننت‌های React برای لوگو و آیکون برندها و سرویس‌های ایرانی — بانک، پرداخت، اپ، رسانه، خودرو، دولوپر و بیشتر.

ESM · TypeScript · `color` / `mono` · عنوان فارسی در کاتالوگ

## نصب

```bash
npm install @farsiui/icons
```

دمو: [FarsiUI.ir](https://icons.farsiui.ir/)

نیاز به `react` و `react-dom` نسخه ۱۸ یا ۱۹.

## استفاده

### کامپوننت نام‌دار

```tsx
import { BankMelliIcon, WebsiteDigikalaIcon, VercelIcon } from "@farsiui/icons";

<BankMelliIcon size={32} />
<WebsiteDigikalaIcon size={28} variant="mono" title="دیجی‌کالا" />
```

### با شناسه کاتالوگ

```tsx
import { LogoIcon } from "@farsiui/icons";

<LogoIcon name="bank-melli" size={32} />
<LogoIcon name="website-digikala" variant="mono" />
```

### کاتالوگ

```ts
import { iconManifest, getIconManifestEntry } from "@farsiui/icons";

getIconManifestEntry("bank-melli");
// id, nameFa, nameEn, componentName, brandColors, …
```

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
npm run generate   # ساخت آیکون‌ها از assets/
npm run dev        # playground
npm run build
```

## مجوز

کد پکیج: MIT.  
آرت‌ورک‌ها از منابع مختلف با مجوزهای اصلی خودشان در `assets/` آمده‌اند.
