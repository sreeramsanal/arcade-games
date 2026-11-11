# 🕹️ Pixel Arcade — Retro Web Gaming Cockpit

A blazing-fast, retro-inspired browser gaming platform built with modern web technologies. Pixel Arcade delivers 8 fully-playable arcade cabinets, a deterministic daily cognitive challenge, personal telemetry records, and Web Audio API synthesis running at silky 60 FPS with instant loading and zero lag.

Repository: [https://github.com/sreeramsanal/arcade-games](https://github.com/sreeramsanal/arcade-games)

---

## 🌟 Key Features

### 1. Instant Speed & Zero Latency
- **Pure Client Execution:** All gameplay, physics calculations, rendering loops, and procedural sound synthesis execute directly in the browser at 60 FPS.
- **Instant Load & Zero Lag:** No server lag, no roundtrip wait times, and zero loading spinners.
- **Private Telemetry Vault:** Personal records, daily challenge streaks, pilot callsign, and trophy progress persist safely in browser `localStorage` under versioned key `pixel_arcade_storage_v1`.
- **Data Sovereignty:** One-click JSON data export and complete telemetry reset capabilities.

### 2. Authentic Coin-Op Arcade Aesthetic
- **Dual Neon Theme:** Default dark obsidian void (`#0d0f14`, neon crimson `#ff2a4b`, cyan `#00f3ff`, amber `#ffb703`, and matrix green `#22c55e`) with an optional crisp light mode toggle.
- **Dynamic GLSL Hero Shader:** Interactive WebGL shader on the homepage hero with responsive mouse parallax (plus distinct caustic plasma shader in light mode).
- **Web Audio API Synth Engine:** Zero audio file downloads. Every laser shot, paddle bounce, brick crack, combo fanfare, and explosion is generated on-the-fly with procedural oscillator waveforms.

### 3. Eight Fully-Playable Arcade Cabinets

| Game | Route | Description & Controls |
|---|---|---|
| **Snake** | `/games/snake` | Classic grid viper with progressive acceleration, bonus cyber energy gems, score multiplier, and WASD / Arrow / Virtual D-pad controls. |
| **Space Shooter** | `/games/space-shooter` | 60 FPS top-down shoot 'em up with starfield parallax, twin pulse lasers, shield lives, particle shatter, and 3 waves of cyber invaders (Drones, Scouts, Titans). |
| **Breakout** | `/games/breakout` | Dynamic paddle deflection physics with angle calculation, 5 colored brick tiers, particle explosions, and combo multipliers. |
| **Pong** | `/games/pong` | Fast-paced 1-on-1 paddle rally against the adaptive **Bushido AI bot**, rally acceleration, and first-to-5 championship scoring. |
| **Memory Match** | `/games/memory-match` | 4x4 card grid featuring 8 cyber runes, stopwatch timing, move efficiency counter, and card flipping animations. |
| **Minesweeper** | `/games/minesweeper` | 9x9 tactical grid with 10 proximity charges, guaranteed safe first click, zero-cascade flood fill, flag placement mode, and detonation detection. |
| **2048** | `/games/2048` | 4x4 matrix numerical puzzle with directional sliding, number merging logic, neon value badges, and win/game-over validation. |
| **Reaction Test** | `/games/reaction-test` | 5-round synaptic reflex gauntlet, randomized arm delay (1.5s–4.2s), false-start penalty, sub-millisecond precision, and cyborg reflex tier classification. |

### 4. Deterministic Daily Challenge (`/daily-challenge`)
- **Memory Matrix Drill:** 8 two-digit security runes generated deterministically using a **Mulberry32 PRNG** keyed by the local calendar date (`YYYY-MM-DD`).
- **Guaranteed Consistency:** The exact same sequence appears across page reloads for the same date without contacting any server.
- **Single Attempt Per Day:** Enforces 1 completed run per calendar day and displays a live midnight countdown ticker until the next challenge unlocks.
- **Streak Calculation:** Automated consecutive streak tracking handling month, leap-year, and year transitions.
- **Result Sharing:** One-click retro share card copied to clipboard with score and emoji matrices.
- **30-Day Activity Heatmap:** Visual log of daily challenge completions over the past month.

### 5. My Scores & Pilot Cockpit (`/scores`)
- **Custom Pilot Callsign:** Editable 12-character player callsign (default: `PLAYER AAA`).
- **Player XP & Rank Progression:** Dynamic XP accumulation unlocking ranks from *Rookie Operator* to *Legendary Grandmaster*.
- **Personal Records Matrix:** Comprehensive telemetry table for all 8 cabinets with instant "PLAY" links.
- **12 Unlockable Trophies:** Achievements including *First Coin*, *Snake Master*, *Speed Demon*, *Space Ace*, *Centurion*, and *7 Day Streak*.
- **JSON Backup:** One-click export of complete game state.

---

## 🛠️ Technology Stack

- **Framework:** React 18 with TypeScript
- **Bundler:** Vite 6 with `@tailwindcss/vite`
- **Styling:** Tailwind CSS v4 + Custom Neon Arcade CSS variables
- **Navigation:** React Router v6 (`BrowserRouter` with Vercel SPA rewrites)
- **Sound:** Web Audio API (Native `AudioContext`, procedural oscillators)
- **Visuals:** HTML5 Canvas, WebGL Shader, Canvas Confetti
- **Storage:** Browser `localStorage` with versioned schema migration

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/sreeramsanal/arcade-games.git

# Navigate to the project directory
cd arcade-games

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`.

### Production Build

```bash
# Type check and build static production bundle
npm run build

# Preview static production build locally
npm run preview
```

The compiled static files are generated in `dist/`.

---

## ☁️ Vercel Deployment

Pixel Arcade is designed to deploy cleanly to **Vercel's Free Tier** as a static website with zero configuration overhead:

1. Push this repository to GitHub (`https://github.com/sreeramsanal/arcade-games.git`).
2. In the Vercel Dashboard, click **New Project** and select `sreeramsanal/arcade-games`.
3. Configure the project settings:
   - **Framework Preset:** Vite
   - **Root Directory:** `./`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. The included [`vercel.json`](./vercel.json) automatically handles SPA rewrites (`/(.*)` -> `/index.html`) so direct navigation to `/games/snake`, `/daily-challenge`, and `/scores` works out of the box.

---

## 📂 Project Directory Structure

```
arcade-games/
├── dist/                      # Static production output
├── node_modules/
├── src/
│   ├── components/            # Reusable UI & arcade cabinet components
│   │   ├── ArcadeCabinetFrame.tsx   # Coin-op cabinet chassis with HUD
│   │   ├── CRTOverlay.tsx           # Hardware display filter container
│   │   ├── Footer.tsx               # Global retro footer & telemetry
│   │   ├── GameOverModal.tsx        # High-score celebration & initial picker
│   │   ├── Header.tsx               # Top bar, navigation, theme & audio toggles
│   │   ├── HeroShader.tsx           # WebGL plasma ribbon canvas
│   │   └── TouchControls.tsx        # Mobile virtual D-pad and action triggers
│   ├── games/                 # 8 playable game implementations
│   │   ├── BreakoutGame.tsx
│   │   ├── Game2048.tsx
│   │   ├── MemoryMatchGame.tsx
│   │   ├── MinesweeperGame.tsx
│   │   ├── PongGame.tsx
│   │   ├── ReactionTestGame.tsx
│   │   ├── SnakeGame.tsx
│   │   └── SpaceShooterGame.tsx
│   ├── pages/                 # Primary routing views
│   │   ├── ArcadePage.tsx           # Route `/` (Hero, filters, cabinet cards)
│   │   ├── DailyChallengePage.tsx   # Route `/daily-challenge` (Memory matrix)
│   │   ├── GamePage.tsx             # Route `/games/:gameId` (Dynamic cabinet loader)
│   │   └── ScoresPage.tsx           # Route `/scores` (Trophies & telemetry)
│   ├── services/              # Core business & audio logic
│   │   ├── achievementsData.ts      # 12 trophies with unlock conditions
│   │   ├── dailyChallengeService.ts # Mulberry32 date PRNG & countdown
│   │   ├── gamesData.ts             # Metadata catalog for all 8 cabinets
│   │   ├── soundService.ts          # Web Audio API procedural synthesis
│   │   └── storageService.ts        # Versioned localStorage vault manager
│   ├── styles/
│   │   └── index.css                # Tailwind imports & neon variables
│   ├── types/
│   │   └── index.ts                 # TypeScript interfaces and game schemas
│   ├── App.tsx                # App root with router and global overlays
│   └── main.tsx               # React DOM root entry point
├── .gitignore                 # Git ignore configuration
├── index.html                 # Main HTML with font preloads & meta tags
├── package.json
├── tailwind.config.js
├── tsconfig.json
├── vercel.json                # Vercel SPA rewrite rules
└── vite.config.ts             # Vite configuration with @tailwindcss/vite
```

---

## 🔒 Telemetry & Storage Schema

All user telemetry is stored under the versioned key `pixel_arcade_storage_v1`:

```typescript
{
  version: 1,
  theme: "dark" | "light",
  crtEnabled: boolean,
  audioMuted: boolean,
  playerTag: string,
  scores: {
    [gameId]: {
      bestScore: number,
      lastScore: number,
      gamesPlayed: number,
      lastPlayed: string,
      history: Array<{ score: number, date: string }>
    }
  },
  dailyChallenge: {
    lastCompletedDate: string,
    completedDates: string[],
    currentStreak: number,
    bestStreak: number,
    attempts: Record<string, DailyChallengeAttempt>
  },
  unlockedAchievements: string[]
}
```

---

## 📜 License

MIT License. Designed with retro arcade passion.
