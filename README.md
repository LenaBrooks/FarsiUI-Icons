# @farsiui/icons

React icon components for Iranian brands and services.

Includes:

- **417** logos from [persianlabs/icons](https://github.com/persianlabs/icons) (MIT) — 21 categories, color + mono
- **344** marks from [aasaam/brand-icons](https://github.com/aasaam/brand-icons) (CC0) — monochrome `ir_*` icons
- **40** marks from [persian-simple-icons](https://github.com/mojtabaahn/persian-simple-icons) (MIT) — monochrome brand icons
- **5** utility service marks from logos-per-service — color + mono (برق، گاز، آب، پست، مخابرات)
- **52** bank/gateway marks from [zegond/logos-per-banks](https://github.com/zegond/logos-per-banks) (CC0) — color + mono
- **200** curated tech/social brands from [vorillaz/devicons](https://github.com/vorillaz/devicons) (MIT) — Telegram, React, GitHub, …
- **100** popular cryptocurrency marks from [react-crypto-icons](https://github.com/rileystephens28/react-crypto-icons) (MIT) — BTC, ETH, …

## Install

```bash
npm install @farsiui/icons
```

> **Publish note:** Publishing requires an npm Organization named `farsiui`. This package is prepared for publish but is not published by default.

Peer dependencies: `react` and `react-dom` (`^18` or `^19`).

## Usage

### By name (lazy category data)

```tsx
import { LogoIcon } from "@farsiui/icons";

<LogoIcon name="bank-melli" size={32} />
<LogoIcon name="website-digikala" variant="mono" size={28} />
```

### Named components

```tsx
import {
  BankMelliIcon,
  WebsiteDigikalaIcon,
  AasaamDigikalaIcon,
  PsiDigikalaIcon,
  LpsElectricityIcon,
  LpbBankMelliIcon,
} from "@farsiui/icons";

<BankMelliIcon size={32} />
<WebsiteDigikalaIcon size={32} variant="mono" title="Digikala" />
<AasaamDigikalaIcon size={32} />
<PsiDigikalaIcon size={32} />
<LpsElectricityIcon size={32} />
<LpbBankMelliIcon size={32} />
```

### Catalog / search

```ts
import { iconManifest, iconCategories, getIconManifestEntry } from "@farsiui/icons";

iconCategories; // 21 categories with FA/EN labels + counts
iconManifest;   // 417 entries
```

### Props

| Prop | Type | Description |
|------|------|-------------|
| `size` | `number \| string` | Square box (width = height); artwork centered with meet |
| `width` / `height` | `number \| string` | Override dimensions |
| `variant` | `"color" \| "mono"` | Color artwork or currentColor mono mark |
| `title` | `string` | Accessible name. Omit for decorative icons |
| `className` | `string` | Forwarded to the root `<svg>` |

## Adding assets

Drop source SVGs under `assets/<source>/…` (first source: `assets/persian-labs/{category}/{color\|mono}/*.svg`), then:

```bash
npm run generate
```

## Development

```bash
npm install
npm run generate     # rebuild catalog + icon modules from assets/
npm run dev          # Vite playground
npm run build
npm run typecheck
npm run lint
npm run test
```

## License

MIT for package code.

- Persian Labs artwork: MIT — [persianlabs/icons](https://github.com/persianlabs/icons)
- Aasaam artwork: CC0 — [aasaam/brand-icons](https://github.com/aasaam/brand-icons)
- Persian Simple Icons: MIT — [mojtabaahn/persian-simple-icons](https://github.com/mojtabaahn/persian-simple-icons)
- logos-per-service: see [zegond/logos-per-service](https://github.com/zegond/logos-per-service)
- logos-per-banks: CC0 — [zegond/logos-per-banks](https://github.com/zegond/logos-per-banks)
- Devicons (curated): MIT — [vorillaz/devicons](https://github.com/vorillaz/devicons)
- Crypto: MIT — [rileystephens28/react-crypto-icons](https://github.com/rileystephens28/react-crypto-icons)
