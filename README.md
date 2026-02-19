# MeatBags Companion

The ultimate DEGEN companion app for the [MeatBags NFT collection](https://magiceden.io/marketplace/meatbags) on Solana.

Track your MeatBags empire across split wallets: Prep Points, Loserboard rankings, transaction history, and more.

## Features

- **Split Wallet Support** - Track NFTs across unlimited wallets with aggregated stats
- **Collection View** - Filterable, sortable NFT grid with mask color badges and MagicEden links
- **Prep Points Calculator** - Daily yield projections by mask color with multi-wallet aggregation
- **Loserboard Tracker** - Dead Points, tier progress (Bronze to Immortal), 33 badge tracker
- **Transaction History** - Buy/sell history with SOL + USD values at time of transaction
- **Verified Leaderboard** - True holder rankings with on-chain wallet verification (fixes MagicEden's split wallet problem)
- **Portfolio Dashboard** - Aggregated overview with collection stats from MagicEden

## Tech Stack

- **Next.js 15** (App Router) + **TypeScript** (strict)
- **Tailwind CSS v4** with custom apocalyptic DEGEN theme
- **Zustand** (client state) + **TanStack Query** (server state)
- **@solana/web3.js** + **wallet-adapter** (Phantom, Solflare, Backpack)
- **Helius DAS API** for NFT data (with public RPC fallback)
- **Vercel Postgres** + **Drizzle ORM** for verified leaderboard
- **Vitest** for testing (73 tests)

## Getting Started

### Prerequisites

- Node.js 22+
- A [Helius](https://helius.dev) API key

### Setup

```bash
# Clone the repo
git clone https://github.com/YOUR_USER/meatbags-companion.git
cd meatbags-companion

# Install dependencies
npm install

# Create env file
cp .env.example .env.local
# Edit .env.local and add your HELIUS_API_KEY

# Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Deploy to Vercel

1. Push to GitHub
2. Import repo in [Vercel](https://vercel.com)
3. Add environment variable: `HELIUS_API_KEY`
4. (Optional) Add Vercel Postgres for verified leaderboard
5. Deploy

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with Turbopack |
| `npm run build` | Production build |
| `npm run test` | Run all tests |
| `npm run typecheck` | TypeScript type check |
| `npm run lint` | ESLint |

## Architecture

```
src/
  lib/domain/     Pure business logic (traits, prep-points, loserboard)
  lib/solana/     Blockchain integration (Helius, RPC fallback)
  lib/api/        External APIs (CoinGecko, MagicEden)
  app/api/        Server-side API proxies (protects API keys)
  stores/         Zustand stores (wallet list, UI state)
  hooks/          React hooks (TanStack Query wrappers)
  components/     UI components (apocalyptic themed)
  types/          TypeScript interfaces
  db/             Drizzle ORM schema (Vercel Postgres)
```

## MeatBags Collection Info

- **Blockchain**: Solana
- **Collection**: [Dn5qsJJj4mKBdYQiXFfrS5PSNPwAakK6XSpvAxqH6v2C](https://magiceden.io/marketplace/meatbags)
- **Total Supply**: 10,034 NFTs
- **20 Mask Colors**: Red (1K/day) to Nothing (7.7K/day) Prep Points yield
- **Loyalty Multipliers**: 1.2x (Presale), 1.1x (Public Mint), 1.0x (Secondary)

## License

MIT
