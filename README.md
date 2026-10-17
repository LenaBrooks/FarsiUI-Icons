# @farsiui/icons

React icons for Iranian brands and services. Copy only what you need via CLI — nothing is added to your `package.json`.

**Site:** [https://icons.FarsiUI.ir](https://icons.FarsiUI.ir)

## Usage

```bash
npx farsiui-icons add bank-melli
npx farsiui-icons add bank-melli website-digikala
```

Writes to `src/components/icons` (or `components/icons`).

```tsx
import { BankMelliIcon } from "@/components/icons/BankMelliIcon";

<BankMelliIcon size={32} />
<BankMelliIcon size={32} variant="mono" style={{ color: "#111" }} />
```

| Flag | Description |
|------|-------------|
| `--lucide` | Lucide stroke icons |
| `--out <dir>` | Output directory |
| `--registry <url>` | Registry base URL |
| `--force` | Overwrite existing file |

## Lucide

```bash
npx farsiui-icons add house --lucide
```

Output: `src/components/lucide` (or `components/lucide`).

## Props

| Prop | Description |
|------|-------------|
| `size` | Square size |
| `variant` | `"color"` \| `"mono"` (`currentColor`) |
| `title` | Accessible name |
| `className` | On `<svg>` |

Requires React / React DOM 18 or 19.

## License

MIT (package code). Artwork keeps its original licenses under `assets/`. Lucide icons are ISC ([Lucide](https://lucide.dev)).
