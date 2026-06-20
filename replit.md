# PolyDoom Celo

## Overview
A Phaser-based game with Web3 integration on Celo Mainnet. Features on-chain scores and upgrades.

## Recent Changes
- **2026-06-20**: Migrated from Arc Testnet to Celo Mainnet. Updated all network config, branding, upgrade keys (celo_*), and enemy/level titles throughout the codebase.
- **2026-01-10**: Fixed "build mode" hang by adding an 8-second timeout and robust fallbacks to the `fetchUpgradesAndInventory` mandatory loading sequence in `client/src/pages/home.tsx`.
- **2026-01-10**: Migrated project to Replit environment, fixed missing `tsx` dependency error.

## Architecture
- **Frontend**: React + Phaser. Phaser is initialized from `home.tsx` after mandatory Web3 data checks.
- **Backend**: Express server for leaderboard API and score persistence.
- **Web3**: ethers.js used for interacting with Celo Mainnet contracts (Scores: `0x9b673bDBA9ed06989b1846d4C63468BCE86cf006`, Upgrades: `0x6101d4D79C6573c570eAA0eeabff13e663c17c08`). Note: contracts need to be redeployed on Celo Mainnet.
- **Network**: Celo Mainnet (chainId 42220 / 0xa4ec), RPC: https://forno.celo.org, Explorer: https://celoscan.io
- **USDC on Celo**: `0xcebA9300f2b948710d2653dD7B07f33A8B32118C`

## User Preferences
- Prefers robust error handling for Web3 operations to prevent app hangs.
