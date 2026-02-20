<p align="center">
  <img src="public/meatbags-logo_transparent.png" alt="MeatBags" width="120" />
</p>

<h1 align="center">MeatBags Companion</h1>

<p align="center">
  <strong>The ultimate DEGEN companion for the <a href="https://magiceden.io/marketplace/meatbags">MeatBags NFT collection</a> on Solana.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Solana-Mainnet-9945FF?style=for-the-badge&logo=solana&logoColor=white" />
  <img src="https://img.shields.io/badge/Next.js-15-000000?style=for-the-badge&logo=next.js&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-Strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/License-MIT-39FF14?style=for-the-badge" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Tests-132_passing-39FF14?style=flat-square" />
  <img src="https://img.shields.io/badge/Type_Coverage-100%25-39FF14?style=flat-square" />
  <img src="https://img.shields.io/badge/NFTs_Tracked-10%2C034-FFD700?style=flat-square" />
  <img src="https://img.shields.io/badge/Mask_Colors-20-E53E3E?style=flat-square" />
  <img src="https://img.shields.io/badge/GeoCaches-Dynamic-9B30FF?style=flat-square" />
</p>

---

Track your MeatBags empire across unlimited split wallets. Prep Points, Loserboard rankings, GeoCaches loot, transaction history, wallet interactions, loyalty multipliers, and more. All in one apocalyptic dashboard.

## Features

### Core Tracking
- **Split Wallet Support** --- Track NFTs across unlimited wallets with automatic deduplication and aggregated stats
- **Collection View** --- Filterable, sortable NFT grid with compact + card modes, mask color badges, staking/listing detection, and MagicEden deep links
- **Prep Points Calculator** --- Daily yield projections by mask color with auto-detected loyalty multipliers (1.2x Presale / 1.1x Public Mint / 1.0x Secondary)
- **Loserboard Tracker** --- Dead Points, tier progress (Bronze -> Immortal), 37 auto-detected badges including mask ownership, rarity milestones, and geocache discoveries

### Analytics
- **Transaction History** --- Buy/sell/transfer/mint/list/delist/bid/burn history across all wallets with Solscan links
- **Wallet Interactions** --- Interactive bubble chart visualization of counterparty relationships, trade volume, and direction analysis
- **P&L Summary** --- Real-time profit & loss tracking from transaction history

### GeoCaches (Raid Rewards)
- **Full Statistics** --- Held, opened/burned, bought, sold, listed with per-wallet aggregation
- **Trait Breakdowns** --- Tier (Common/Rare) and Series (Bounty Box I/II, Shit Box) distribution charts
- **Trade Performance** --- GeoCaches-specific P&L and activity timeline

### Platform
- **Loyalty Multiplier Auto-Detection** --- Traces each NFT back to its mint transaction on-chain to determine Presale (1.2x) vs Public Mint (1.1x) vs Secondary (1.0x)
- **Portfolio Dashboard** --- Aggregated overview with live SOL price, collection floor, portfolio valuation, and mask distribution chart
- **Auto-Versioning** --- Conventional Commits + standard-version for automatic SemVer on push to main

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 15 (App Router, Turbopack) |
| **Language** | TypeScript 5.7 (strict mode) |
| **Styling** | Tailwind CSS v4 + custom apocalyptic theme |
| **Client State** | Zustand v5 (persisted to localStorage) |
| **Server State** | TanStack Query v5 (cached, stale-while-revalidate) |
| **Blockchain** | @solana/web3.js + Helius DAS API |
| **Wallet** | @solana/wallet-adapter (Phantom, Solflare, Backpack) |
| **Database** | Vercel Postgres + Drizzle ORM (verified leaderboard) |
| **Animation** | Framer Motion |
| **Testing** | Vitest (132 tests) |
| **CI/CD** | GitHub Actions (auto-version) + Vercel (auto-deploy) |

## Quick Start

### Prerequisites

- **Node.js 22+** (LTS recommended)
- A free **[Helius](https://helius.dev)** API key

### Setup

```bash
# Clone
git clone https://github.com/wealthior/meatbags-companion.git
cd meatbags-companion

# Install
npm install

# Environment
cp .env.example .env.local
# Add your HELIUS_API_KEY to .env.local

# Dev server
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** and add your wallet address to start tracking.

### Deploy to Vercel

1. Push to GitHub
2. Import in [Vercel](https://vercel.com)
3. Add env variable: `HELIUS_API_KEY`
4. *(Optional)* Add Vercel Postgres for verified leaderboard
5. Deploy --- auto-deploys on every push to `main`

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run test` | Run all 132 tests |
| `npm run test:watch` | Watch mode |
| `npm run typecheck` | TypeScript strict check |
| `npm run lint` | ESLint |
| `npm run release` | Bump version (auto on CI) |

## Architecture

```
src/
  types/              TypeScript interfaces (nft, geocache, transaction, wallet, api)
  lib/
    domain/           Pure business logic (traits, prep-points, loserboard, geocache-stats)
    solana/           Blockchain integration (Helius DAS, RPC fallback, loyalty-detector)
    api/              External APIs (CoinGecko, MagicEden)
    utils/            Formatting, validation, constants, env
  app/
    api/              Server-side proxies (Helius, MagicEden, leaderboard)
    (dashboard)/      All dashboard pages (collection, prep-points, geocaches, etc.)
  stores/             Zustand stores (wallets, UI preferences)
  hooks/              TanStack Query hooks (NFTs, geocaches, transactions, SOL price)
  components/
    shared/           Reusable UI (StatCard, GlitchText, WipBanner, skeletons)
    nft/              MeatBags NFT components (grid, cards, trait badges)
    geocache/         GeoCaches components (grid, stat cards, trait breakdown)
    interactions/     Wallet interaction visualizations (bubble chart, P&L, timeline)
    layout/           App shell (sidebar, header, footer)
  __tests__/          Unit tests for all domain logic
```

### Data Flow

```
Wallet Address
    |
    v
[Server API Route] ---> [Helius DAS API] ---> Parse & Filter
    |                                              |
    v                                              v
[TanStack Query Hook]                    [Domain Logic]
    |                                         |
    v                                         v
[React Component] <---- [Zustand Store] <---- [Stats/Badges]
```

## Collection Info

| | MeatBags | GeoCaches |
|---|---------|-----------|
| **Blockchain** | Solana | Solana |
| **Supply** | 10,034 NFTs | Dynamic (raid rewards) |
| **Traits** | 20 Mask Colors | Tier + Series |
| **Yield** | 1K-7.7K Prep Points/day | --- |
| **Multipliers** | 1.0x - 1.2x | --- |
| **MagicEden** | [meatbags](https://magiceden.io/marketplace/meatbags) | [meatbags_geocache](https://magiceden.io/marketplace/meatbags_geocache) |

### Mask Color Yield Table

| Rarity | Colors | Daily Yield |
|--------|--------|-------------|
| Common | Red, Purple, Orange, White, Yellow, Light Blue, Green, Teal | 1,000 - 1,175 |
| Uncommon | Olive, Blue, Black, Burgundy, Grey, Pink | 1,200 - 1,325 |
| Rare | Orchid, Navy, Brown | 1,350 - 1,400 |
| Legendary | Gold / GH-Gold | 4,200 |
| Mythic | 1/1, Nothing | 7,000 - 7,700 |

### Loyalty Multipliers

| Category | Multiplier | Detection |
|----------|-----------|-----------|
| Presale Minter | **1.2x** | Auto-detected from on-chain mint timestamp |
| Public Mint | **1.1x** | Auto-detected from on-chain mint timestamp |
| Secondary Buyer | **1.0x** | Default |

## Contributing

Contributions welcome! Please use [Conventional Commits](https://www.conventionalcommits.org/) for commit messages.

```bash
# Run checks before committing
npm run typecheck && npm test && npm run lint
```

## Credits

Built by **[Wealthior](https://x.com/wealthior)** for the MeatBags community.

Powered by [Helius](https://helius.dev) | [MagicEden](https://magiceden.io) | [Solana](https://solana.com)

## License

[MIT](LICENSE) --- Do whatever you want with it, survivor.
