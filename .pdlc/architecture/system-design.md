# HumDuel — System Design

**Date:** 2026-04-04
**Author:** cloud-architect

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    CLIENTS                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │ Mobile   │  │ Desktop  │  │ Social Preview   │  │
│  │ Browser  │  │ Browser  │  │ (OG Card Render) │  │
│  └────┬─────┘  └────┬─────┘  └────────┬─────────┘  │
└───────┼──────────────┼─────────────────┼────────────┘
        │              │                 │
        ▼              ▼                 ▼
┌─────────────────────────────────────────────────────┐
│              VERCEL (Frontend Host)                  │
│  ┌──────────────────────────────────────────────┐   │
│  │         React SPA (Vite build)                │   │
│  │  ┌─────────┐ ┌──────────┐ ┌───────────────┐ │   │
│  │  │ Pages   │ │ Audio    │ │ Waveform      │ │   │
│  │  │ Router  │ │ Engine   │ │ Canvas        │ │   │
│  │  └─────────┘ └──────────┘ └───────────────┘ │   │
│  └──────────────────────────────────────────────┘   │
│              CDN (static assets + audio files)       │
└─────────────────────┬───────────────────────────────┘
                      │ HTTPS API calls
                      ▼
┌���─────────────────���──────────────────────────────────┐
│              RAILWAY (Backend Host)                   │
│  ┌──────────────────────────────────────────────┐   │
│  │         Express.js API Server                 │   │
│  │  ┌─────────┐ ┌──────────┐ ┌────────────��──┐ │   │
│  │  │ Routes  │ │ Middleware│ │ Controllers   │ │   │
│  │  │         │ │ CORS     │ │ Challenge     │ │   │
│  │  │ /api/*  │ │ Rate Lim │ │ Daily         │ │   │
│  │  │         │ │ Helmet   │ │ Auth          │ ��   │
│  │  │         │ │ Auth JWT │ │ Leaderboard   │ │   │
│  │  ���────────��┘ └──────────┘ └───────┬��──────┘ │   │
│  │                                    │         │   │
│  │  ┌────────────────┐  ┌────────────┴──────┐  │   │
│  │  │ SQLite DB      │  │ Audio Storage     │  │   │
│  │  │ (better-sqlite3)│  │ (local /uploads)  │  │   │
��  │  └────────────────┘  └───��───────────────┘  │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────┬───���───────────────────────────┘
                      │ HTTP (cached)
                      ▼
┌─────────────────────────────────────────────────────┐
│              SPOTIFY WEB API (External)               │
│  Song search, metadata, album art, 30s previews      │
└──────────────────────────────────��──────────────────┘
```

---

## Frontend Architecture

### Directory Structure
```
client/
├── public/
│   ├── favicon.ico
│   └── manifest.json
├── src/
│   ├── main.tsx                 # Entry point
│   ├── App.tsx                  # Router + layout
│   ├── pages/
│   │   ├── HomePage.tsx         # Landing + record
│   │   ├── ChallengePage.tsx    # Guess a challenge
│   │   ├── ResultPage.tsx       # Guess result + share
│   │   ├── DailyPage.tsx        # Daily challenge
│   │   ├── LeaderboardPage.tsx  # Rankings
│   │   └── ProfilePage.tsx      # User stats
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── MobileNav.tsx
│   │   ├── audio/
│   │   │   ├── AudioRecorder.tsx    # Mic capture + controls
│   │   ��   ├── AudioPlayer.tsx      # Playback
│   │   │   └── WaveformCanvas.tsx   # Canvas visualization
│   │   ├── challenge/
│   │   │   ���── ChallengeCard.tsx    # Waveform display card
│   ���   │   ├── GuessingForm.tsx     # Song search + submit
│   │   │   ├── GuessResult.tsx      # Correct/wrong feedback
│   ���   │   └── ShareButton.tsx      # Social share
│   │   └── ui/
│   │       ├─�� Button.tsx
│   │       ├── Input.tsx
│   │       ├── Timer.tsx
│   │       └── Modal.tsx
│   ├���─ hooks/
│   ���   ├── useAudioRecorder.ts  # Web Audio API hook
│   │   ├── useWaveform.ts       # Canvas rendering hook
│   │   ├─�� useChallenge.ts      # Challenge API hook
│   │   └── useAuth.ts           # Auth state hook
│   ├── stores/
│   │   ├── audioStore.ts        # Zustand: audio state
│   │   ├── gameStore.ts         # Zustand: game state
│   │   └── authStore.ts         # Zustand: auth state
│   ├── lib/
│   │   ├── api.ts               # API client (fetch wrapper)
│   │   ├── audio.ts             # Audio utilities
│   │   ├── waveform.ts          # Waveform generation
│   │   └── share.ts             # Share utilities
│   ├── types/
│   │   └── index.ts             # Shared TypeScript types
│   └── styles/
│       └── globals.css          # Tailwind imports
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

### Audio Pipeline

```
Microphone
    │
    ▼
MediaStream (getUserMedia)
    │
    ▼
AudioContext (44.1kHz)
    │
    ├──▶ AnalyserNode ──▶ getByteTimeDomainData() ──▶ Canvas (live waveform)
    │
    ├──▶ MediaStreamAudioSourceNode
    │        │
    │        ▼
    │    ScriptProcessorNode / AudioWorkletNode
    │        │
    │        ▼
    │    Float32Array chunks (accumulated)
    │
    └──▶ MediaRecorder (parallel)
             │
             ▼
         Blob (audio/webm)
             │
             ├──▶ Upload to server (POST /api/challenges)
             └──▶ Local playback (AudioPlayer component)
```

### State Management (Zustand)

```typescript
// audioStore: recording state
{ isRecording, audioBlob, waveformData, duration, startRecording, stopRecording }

// gameStore: challenge/guess state  
{ challenge, guesses, isComplete, timeStarted, submitGuess, resetGame }

// authStore: user auth (Sprint 3)
{ user, token, isLoggedIn, login, logout, register }
```

---

## Backend Architecture

### Directory Structure
```
server/
├── src/
│   ├── index.ts                 # Express app entry
│   ├── config.ts                # Environment config
│   ├── database.ts              # SQLite initialization
│   ├── routes/
│   │   ├── health.ts            # GET /api/health
│   │   ├── challenges.ts        # /api/challenges/*
│   │   ��── daily.ts             # /api/daily/*
│   │   ├── leaderboard.ts       # /api/leaderboard/*
│   │   ├── auth.ts              # /api/auth/*
│   │   └── songs.ts             # /api/songs/search
│   ├── middleware/
│   │   ├── rateLimiter.ts       # express-rate-limit config
│   ���   ├── auth.ts              # JWT verification
│   │   ├── validate.ts          # Input validation
│   │   └── errorHandler.ts      # Global error handler
│   ├── controllers/
│   │   ├── challengeController.ts
��   │   ├── dailyController.ts
│   │   ├── leaderboardController.ts
│   │   ├── authController.ts
│   │   └── songController.ts
│   ├── services/
│   │   ├── challengeService.ts  # Business logic
│   │   ├── dailyService.ts      # Daily challenge generation
│   │   ├── spotifyService.ts    # Spotify API client
│   │   └── audioService.ts      # Audio file management
│   ├── db/
│   │   ├── schema.sql           # DDL
│   │   └── seed.sql             # Sample data
│   └── types/
│       └── index.ts             # Shared types
├── uploads/                     # Audio file storage
├── data/
│   └── humduel.db              # SQLite database file
├── tsconfig.json
└── package.json
```

### Middleware Pipeline

```
Request
  │
  ▼
helmet()           ──▶ Security headers
  │
  ▼
cors()             ──▶ CORS whitelist
  │
  ▼
express.json()     ──▶ Body parsing (50KB limit)
  │
  ▼
rateLimiter()      ──▶ 100 req/min general, 10 req/min uploads
  │
  ���
Router             ──▶ Route matching
  │
  ▼
auth() (optional)  ��─▶ JWT verification (Sprint 3)
  │
  ▼
validate()         ──�� Input validation
  │
  ▼
Controller         ──▶ Business logic
  │
  ▼
errorHandler()     ──▶ Centralized error formatting
  │
  ▼
Response
```

### Daily Challenge Scheduling

**Approach:** Seed-based deterministic generation (no cron needed)

```typescript
// Daily challenge determined by date seed
const getDailyChallenge = (date: string) => {
  // Hash the date to get a deterministic index
  const seed = hashDate(date); // "2026-04-04" → number
  const songIndex = seed % totalSongs;
  return songs[songIndex];
};
```

This means:
- Same song for all players on the same day
- No server-side scheduler needed
- Works across timezones (midnight UTC cutoff)
- Pre-populated song catalog seeded at deploy time

---

## Deployment Architecture

### Vercel (Frontend)
- **Build:** `vite build` → `/dist` static files
- **Deploy:** Git push to main triggers auto-deploy
- **CDN:** Vercel Edge Network for global distribution
- **Environment:** `VITE_API_URL` pointing to Railway backend

### Railway (Backend)
- **Build:** `tsc` → `node dist/index.js`
- **Deploy:** Git push to main triggers auto-deploy
- **Persistent storage:** Railway volume for SQLite DB + audio uploads
- **Environment:** `DATABASE_PATH`, `UPLOAD_DIR`, `JWT_SECRET`, `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `CORS_ORIGIN`

### Audio File Storage
- **MVP:** Local filesystem (`/uploads/` directory on Railway volume)
- **Scale path:** Cloudflare R2 or AWS S3 when storage exceeds 10GB
- **Naming:** `{challengeId}.webm` (8-char nanoid)
- **Retention:** 7 days for challenge audio, permanent for daily challenges
- **Max size:** 500KB per upload (15s @ 128kbps is ~240KB)

---

## Scalability Considerations

### SQLite Limits
- **Read performance:** Excellent. Handles 10K+ concurrent reads.
- **Write performance:** ~1000 writes/sec with WAL mode.
- **Practical limit:** ~50K DAU before needing PostgreSQL migration.
- **Migration trigger:** When write latency exceeds 50ms p95.

### Audio Storage at Scale
- At 10K DAU, ~5K challenges/day × 250KB avg = 1.25GB/day
- 7-day retention = ~9GB rolling
- Railway volume handles this; R2 migration at 50GB

### Rate Limiting
- Per-IP: 100 general, 10 uploads per minute
- Global: Railway auto-scales within plan limits
- DDoS: Vercel/Railway provide basic DDoS protection

### Monitoring
- **Health:** `GET /api/health` returns DB connectivity + uptime
- **Errors:** Client-side error boundary catches + reports to API
- **Performance:** Vercel Analytics (free) for Core Web Vitals

---

## UI/UX Design System (Stitch MCP)

The frontend visual design was created using **Google Stitch MCP**, an AI-powered design-to-code tool. All screens follow a unified design system.

### Design System Summary

| Property | Value |
|----------|-------|
| Color Mode | Dark (#1E1B2E background) |
| Primary | Violet #7C3AED |
| Secondary | Blue #3B82F6 |
| Tertiary | Pink #EC4899 |
| Headlines | Space Grotesk (bold, geometric) |
| Body | Inter (clean, readable) |
| Labels | DM Sans (compact, UI-friendly) |
| Border Radius | 12px (modern, rounded) |
| Color Variant | Vibrant |

### Stitch Project Reference

| Item | ID |
|------|-----|
| Project | `15759218275488447742` |
| Design System Asset | `2159400510209959013` |
| Home Screen | `78278a8c5a0a49c3abe0a4975f5acffb` |
| Recording Screen | `802aea5f7e084e3f984e022a85038d69` |
| Challenge Screen | `10abf42e78cf4f34a1f8c87f3c92fea5` |
| Result Screen | `ab60a26cd16944de93e04bf0e5d8c840` |

### Waveform Signature Element

The HumDuel waveform is the core brand element — a gradient visualization from violet → blue → pink rendered on Canvas API at 60fps. Used across:
- Recording screen (live audio-reactive)
- Challenge card (static preview)
- Share card (branded social image)

### Design-to-Code Pipeline

```
Stitch Design System → generate_screen_from_text → HTML/CSS mockups
                                                        │
                                                        ▼
                                            React components (manual)
                                            Tailwind CSS (utility classes)
                                            shadcn/ui (primitives)
```

During development sprints, Stitch's `react-components` tool can generate validated React component code, and `shadcn-ui` can integrate pre-built accessible components.

### Design Artifacts

All design documentation lives in `.pdlc/design/`:
- `design-system.md` — Complete design tokens and guidelines
- `screen-inventory.md` — All screens with IDs and descriptions
- `wireframes.md` — ASCII wireframes for every screen
- `user-flows.md` — User journey maps and state transitions
- `component-library.md` — React component specifications
- `stitch-project.md` — Stitch MCP project reference and access info
