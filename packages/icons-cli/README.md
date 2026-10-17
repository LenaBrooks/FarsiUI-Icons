# @farsiui/icons-cli

Copy Iranian brand icon React components into your project (shadcn-style). Icons are fetched once from the GitHub registry — nothing heavy is installed into `node_modules`.

## Usage

```bash
npx @farsiui/icons-cli add bank-melli
npx @farsiui/icons-cli add bank-melli website-digikala --out src/components/icons
```

Then:

```tsx
import { BankMelliIcon } from "@/components/icons/BankMelliIcon";

<BankMelliIcon size={32} />
<BankMelliIcon size={32} variant="mono" style={{ color: "#111" }} />
```

## Options

| Flag | Description |
|------|-------------|
| `--out <dir>` | Output folder (default: `src/components/icons` if `./src` exists, else `components/icons`) |
| `--registry <url>` | Registry base (default: jsDelivr → `farsiui/icons` GitHub) |
| `--force` | Overwrite existing files |

Local registry (development):

```bash
npx @farsiui/icons-cli add bank-melli --registry ./registry
```
