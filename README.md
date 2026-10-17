# @farsiui/icons

کامپوننت‌های React برای لوگو و آیکون برندها و سرویس‌های ایرانی — بانک، پرداخت، اپ، رسانه، خودرو، دولوپر و بیشتر.

دمو: [icons.farsiui.ir](https://icons.farsiui.ir/)

## استفاده (CLI)

با `npx` فقط همان آیکون‌هایی که لازم دارید داخل پروژه‌تان کپی می‌شوند — وابستگی به فارسیUI در `package.json` اضافه نمی‌شود.

```bash
npx @farsiui/icons add bank-melli
npx @farsiui/icons add bank-melli website-digikala
```

فایل می‌رود به `src/components/icons` (اگر `src` دارید) یا `components/icons`.

```tsx
import { BankMelliIcon } from "@/components/icons/BankMelliIcon";

<BankMelliIcon size={32} />
<BankMelliIcon size={32} variant="mono" style={{ color: "#111" }} />
```

### گزینه‌ها

| فلگ | توضیح |
|------|--------|
| `--lucide` | رجیستری Lucide (آیکون‌های stroke انگلیسی) |
| `--out <dir>` | پوشهٔ خروجی |
| `--registry <url>` | آدرس رجیستری (پیش‌فرض: jsDelivr → GitHub) |
| `--force` | بازنویسی فایل موجود |

## Lucide

آیکون‌های Lucide جدا از برندها هستند (صفحهٔ دمو `#lucide`). با `--lucide` همان‌طور یکی‌یکی کپی می‌شوند:

```bash
npx @farsiui/icons add house --lucide
npx @farsiui/icons add activity zap --lucide
```

خروجی پیش‌فرض: `src/components/lucide` (یا `components/lucide`).

```tsx
import { HouseIcon } from "@/components/lucide/HouseIcon";

<HouseIcon size={24} />
```

## Props (برندها)

| Prop | توضیح |
|------|--------|
| `size` | اندازه مربع |
| `variant` | `"color"` یا `"mono"` (`currentColor`) |
| `title` | نام دسترس‌پذیر؛ بدون آن تزئینی است |
| `className` | روی `<svg>` |

نیاز به React و React DOM نسخه ۱۸ یا ۱۹ در پروژه‌ای که آیکون را استفاده می‌کند.

## توسعه

```bash
npm install
npm run generate                 # ساخت آیکون‌ها از assets/
npm run generate:registry        # رجیستری برندها → registry/
npm run generate:lucide-registry # رجیستری Lucide → registry/lucide/
npm run dev                      # playground
npm run build
```

CLI محلی روی رجیستری همین ریپو:

```bash
node cli/index.mjs add bank-melli --registry ./registry
node cli/index.mjs add house --lucide --registry ./registry/lucide
```

## مجوز

کد پکیج: MIT.  
آرت‌ورک‌ها از منابع مختلف با مجوزهای اصلی خودشان در `assets/` آمده‌اند.  
لوگوهای استارتاپی `assets/manual` جمع‌آوری‌شده توسط [trustmrr.ir](https://trustmrr.ir) از وب‌سایت خود شرکت‌ها (جزئیات در `assets/manual/sources.json`)؛ هر لوگو علامت تجاری همان شرکت است.  
آیکون‌های Lucide تحت مجوز ISC متعلق به پروژهٔ [Lucide](https://lucide.dev) هستند.
